# PLO 웹솔버 설치 및 실행 가이드

## 필요한 프로그램

1. **Node.js** (v18 이상)
2. **PostgreSQL** (v14 이상)
3. **Git** (선택사항)

---

## 1단계: PostgreSQL 설치

### Windows에서 설치

1. PostgreSQL 공식 사이트 다운로드: https://www.postgresql.org/download/windows/
2. 설치 프로그램 실행
3. 설치 중 설정:
   - Port: `5432` (기본값)
   - Password: `postgres` (또는 원하는 비밀번호 - 나중에 `.env` 파일에 입력해야 함)
   - Locale: 기본값 사용
4. 설치 완료 후 pgAdmin 4도 함께 설치됨 (GUI 관리 도구)

### 데이터베이스 생성

**방법 1: pgAdmin 사용 (GUI)**
1. pgAdmin 4 실행
2. 왼쪽 트리에서 `Servers` → `PostgreSQL` → 우클릭 → `Create` → `Database`
3. Database name: `plo_solver`
4. Save 클릭

**방법 2: 명령줄 사용**
```bash
# PostgreSQL 설치 폴더의 bin 디렉토리로 이동 (보통 C:\Program Files\PostgreSQL\16\bin)
# 또는 환경변수에 등록되어 있으면 아무 곳에서나 실행 가능

psql -U postgres
# 비밀번호 입력

CREATE DATABASE plo_solver;
\q
```

---

## 2단계: 백엔드 설정

### 의존성 설치

터미널(PowerShell 또는 cmd)을 열고:

```bash
cd "C:\code\claude\PLO web solver\backend"
npm install
```

### 환경변수 확인

`backend/.env` 파일이 이미 생성되어 있습니다.
PostgreSQL 비밀번호를 다르게 설정했다면 수정하세요:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/plo_solver
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### 데이터베이스 스키마 생성

```bash
npm run db:init
```

출력 예시:
```
Initializing database schema...
Database schema initialized successfully.
```

### .rng 파일 파싱 및 DB 삽입

```bash
npm run parse
```

이 작업은 4,221개의 .rng 파일을 읽어서 DB에 삽입합니다.
- 예상 소요 시간: **5~15분** (PC 성능에 따라 다름)
- 진행 상황이 콘솔에 표시됩니다: `Processed 100/4221 files (20.5 files/sec)`

---

## 3단계: 프론트엔드 설정

새 터미널을 열고:

```bash
cd "C:\code\claude\PLO web solver\frontend"
npm install
```

---

## 4단계: 서버 실행

### 백엔드 서버 실행

첫 번째 터미널에서:

```bash
cd "C:\code\claude\PLO web solver\backend"
npm run dev
```

출력:
```
Server running on port 3001
```

### 프론트엔드 개발 서버 실행

두 번째 터미널에서:

```bash
cd "C:\code\claude\PLO web solver\frontend"
npm run dev
```

출력:
```
  VITE v7.3.1  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 5단계: 웹앱 사용

브라우저에서 http://localhost:5173/ 접속

### 사용 방법

1. **카드 선택**: 카드 그리드에서 4장 클릭 (또는 텍스트로 입력: `AhKs2d3c`)
2. **액션 선택**: UTG부터 시작해서 Fold/Call/Raise 버튼 클릭
3. **결과 확인**:
   - 각 액션의 빈도(%)와 EV가 표시됨
   - 색깔 막대로 전략 비율 시각화

---

## 문제 해결

### 데이터베이스 연결 오류

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**해결책:**
- PostgreSQL 서비스가 실행 중인지 확인
  - Windows: `services.msc` → `postgresql-x64-16` 서비스 확인
- `.env` 파일의 `DATABASE_URL` 확인 (비밀번호, 포트 등)

### 포트 충돌

```
Error: listen EADDRINUSE: address already in use :::3001
```

**해결책:**
- 이미 실행 중인 프로세스 종료
- 또는 `.env`에서 다른 포트 사용 (예: `PORT=3002`)

### .rng 파일을 찾을 수 없음

```
Ranges directory not found: ...
```

**해결책:**
- .rng 파일이 올바른 위치에 있는지 확인: `6max 50z preflop rng/100bb/*.rng`
- 또는 parse 스크립트 실행 시 경로 지정:
  ```bash
  npm run parse "C:\your\custom\path" "Custom Sim Name"
  ```

---

## 개발 팁

### DB 초기화 (데이터 전부 삭제 후 재시작)

```bash
cd backend
npm run db:init
npm run parse
```

### 프론트엔드만 재시작

```bash
cd frontend
npm run dev
```

### 백엔드 API 직접 테스트

브라우저 또는 curl로:
```bash
# 시뮬레이션 목록
curl http://localhost:3001/api/simulations

# 특정 핸드 전략 조회
curl "http://localhost:3001/api/strategy?simId=1&hand=AAAA&actionPrefix=0.0.0.0"
```

---

## 배포 (선택사항)

### Frontend → Vercel

1. GitHub에 코드 푸시
2. Vercel 연결
3. Build command: `npm run build`
4. Output directory: `dist`
5. Root directory: `frontend`
6. Environment variable 설정: `VITE_API_URL=https://your-backend.railway.app`

### Backend + DB → Railway

1. Railway.app에서 새 프로젝트 생성
2. PostgreSQL 서비스 추가
3. Backend 서비스 추가 (GitHub 연결)
4. Environment variables 자동 설정됨
5. Start command: `npm start`
