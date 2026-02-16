# PLO Preflop Solver

MonkerSolver에서 추출한 PLO (Pot-Limit Omaha) 프리플랍 GTO 전략을 웹에서 조회할 수 있는 풀스택 애플리케이션입니다.

![PLO Solver Screenshot](./docs/screenshot.png)

## 주요 기능

- ✅ 4장 카드 선택 (그리드 클릭 또는 텍스트 입력)
- ✅ 프리플랍 액션 트리 네비게이션 (Fold/Call/Raise)
- ✅ 각 핸드별 GTO 전략 조회 (빈도, EV)
- ✅ 전체 레인지 뷰 (빈도 필터링)
- ✅ 6max, 100bb 스택 지원
- ✅ 4,221개 게임 트리 노드, 69M+ 전략 데이터

## 빠른 시작

### 필요 사항

- Node.js 18+
- PostgreSQL 14+

### 설치 및 실행

```bash
# 1. 저장소 클론 (또는 다운로드)
cd "C:\code\claude\PLO web solver"

# 2. PostgreSQL 데이터베이스 생성
createdb plo_solver

# 3. 백엔드 설정
cd backend
npm install
npm run db:init      # DB 스키마 생성
npm run parse        # .rng 파일 파싱 (5-10분 소요)
npm run dev          # 서버 실행 (port 3001)

# 4. 프론트엔드 설정 (새 터미널)
cd ../frontend
npm install
npm run dev          # 개발 서버 실행 (port 5173)
```

브라우저에서 http://localhost:5173 접속

## 문서

- [설치 가이드](./SETUP_GUIDE.md) - 상세한 설치 및 문제 해결
- [아키텍처 문서](./ARCHITECTURE.md) - 기술 스택, DB 스키마, API 명세

## 프로젝트 구조

```
PLO web solver/
├── backend/              # Express + TypeScript 서버
│   ├── src/
│   │   ├── routes/       # API 엔드포인트
│   │   ├── db/           # PostgreSQL 쿼리
│   │   └── utils/        # Monker 핸드 변환
│   └── scripts/          # DB 초기화 & 파싱
├── frontend/             # React + Vite 앱
│   └── src/
│       ├── components/   # UI 컴포넌트
│       ├── hooks/        # React 훅
│       └── api/          # API 클라이언트
└── 6max 50z preflop rng/ # .rng 소스 파일
    └── 100bb/            # 4,221개 .rng 파일
```

## 기술 스택

- **Frontend:** React, TypeScript, Tailwind CSS v4, Vite
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL
- **Deploy:** Vercel (FE) + Railway (BE/DB)

## 데이터 출처

MonkerSolver에서 "Export preflop for MonkerViewer" 기능으로 추출한 .rng 파일 사용.

## 라이선스

MIT License

## 참고 프로젝트

- [PreflopAdvisor](https://github.com/ksoeze/PreflopAdvisor) - 핸드 변환 로직 참고

## 기여

이슈 및 PR 환영합니다!

## 주의사항

MonkerSolver .rng 파일은 개인 사용 목적으로만 사용하세요. 상업적 재배포는 MonkerSolver 라이선스를 준수해야 합니다.
