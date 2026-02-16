# PLO 웹솔버 아키텍처 문서

## 프로젝트 개요

MonkerSolver에서 추출한 PLO (Pot-Limit Omaha) 프리플랍 GTO 전략을 웹에서 조회할 수 있는 풀스택 애플리케이션.

**기술 스택:**
- Frontend: React + TypeScript + Tailwind CSS v4 + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL
- Deploy: Vercel (FE) + Railway (BE/DB)

---

## 데이터 구조

### MonkerSolver .rng 파일 포맷

MonkerSolver에서 "Export preflop for MonkerViewer" 기능으로 추출한 텍스트 파일.

**파일명 규칙:**
- 형식: `0.0.0.0.40100.rng`
- 각 숫자 = 액션 코드 (dot으로 구분)
- 예시:
  - `0` = Fold
  - `1` = Call
  - `2` = Raise Pot
  - `3` = All-in
  - `40100` = Raise 100% (stack)
  - `40075` = Raise 75%
  - `40050` = Raise 50%
  - `40033` = Raise 33%

**파일 내용:**
```
AAAA
1.0;-1000.000000000001
(2A)AA
0.0;227.60579139365282
AAA2
0.0;-574.9420070663217
...
```

- 홀수 줄: Monker 핸드 표기법
- 짝수 줄: `빈도;EV` (빈도는 0~1, EV는 밀리SB 단위)

### Monker 핸드 표기법 (Suit Isomorphism)

PLO 4카드 핸드를 수트 동형성(suit isomorphism)으로 그룹핑한 표기법.

**규칙:**
- 괄호 밖 카드: 각자 다른 수트
- 괄호 안 카드: 같은 수트 공유
- 여러 괄호: 각각 다른 수트 그룹

**예시:**
```
AAAA      → A♠ A♥ A♦ A♣ (4장 모두 다른 수트)
(2A)AA    → 2♠ A♠ A♥ A♦ (2와 A 하나가 같은 수트)
(23A)A    → 2♠ 3♠ A♠ A♥ (2,3,A가 같은 수트, 나머지 A는 다른 수트)
(2A)(3A)  → 2♠ A♠ 3♥ A♥ (2+A가 한 수트, 3+A가 다른 수트)
2345      → 2♠ 3♥ 4♦ 5♣ (rainbow)
```

**변환 알고리즘:** (`backend/src/utils/hand.ts`)
1. 유저가 선택한 4장 카드 (예: `AhKs2d3c`)
2. 수트별로 그룹핑: `{h: [A], s: [K], d: [2], c: [3]}`
3. 그룹 크기 내림차순 정렬 (동일하면 최고 랭크 내림차순)
4. 그룹 크기 1 = 괄호 없음, 2+ = 괄호로 묶음
5. 결과: `AK23` (4장 모두 다른 수트)

---

## 데이터베이스 스키마

### `simulations` 테이블
```sql
CREATE TABLE simulations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,              -- "6max 50z 100bb"
  num_players INTEGER NOT NULL,    -- 6
  stack_bb INTEGER NOT NULL,       -- 100
  game_type TEXT DEFAULT 'PLO'
);
```

### `tree_nodes` 테이블
```sql
CREATE TABLE tree_nodes (
  id SERIAL PRIMARY KEY,
  sim_id INTEGER REFERENCES simulations(id),
  filename TEXT NOT NULL,                    -- "0.0.0.0.40100.rng"
  action_sequence TEXT NOT NULL,             -- "UTG:Fold → MP:Fold → CO:Fold → BU:Fold → SB:Raise100"
  acting_position TEXT NOT NULL,             -- "BB" (다음 액션할 포지션)
  depth INTEGER NOT NULL DEFAULT 0,          -- 액션 깊이 (root=1)
  UNIQUE(sim_id, filename)
);
```

- 각 노드 = 게임 트리의 한 지점
- `filename`으로 부모-자식 관계 추적 (예: `0.0.rng`의 자식은 `0.0.0.rng`, `0.0.1.rng`, ...)
- `depth` = 액션 시퀀스 길이 (빠른 필터링용)

### `hand_strategies` 테이블
```sql
CREATE TABLE hand_strategies (
  id SERIAL PRIMARY KEY,
  node_id INTEGER REFERENCES tree_nodes(id),
  hand TEXT NOT NULL,                -- Monker 표기법 (예: "(AK)Q2")
  frequency REAL NOT NULL,           -- 0.0 ~ 1.0
  ev REAL NOT NULL,                  -- 밀리SB 단위 EV
  UNIQUE(node_id, hand)
);
```

- 각 노드마다 ~16,000개의 핸드별 전략 저장
- 총 레코드 수: 4,221 nodes × 16,432 hands = **약 6900만 행**

**인덱스:**
```sql
CREATE INDEX idx_strategies_node ON hand_strategies(node_id);
CREATE INDEX idx_strategies_hand ON hand_strategies(hand);
CREATE INDEX idx_nodes_sim ON tree_nodes(sim_id);
CREATE INDEX idx_nodes_filename ON tree_nodes(filename);
```

---

## 백엔드 API

### 기본 URL
- Development: `http://localhost:3001/api`
- Production: `https://your-backend.railway.app/api`

### 엔드포인트

#### 1. `GET /api/simulations`
시뮬레이션 목록 조회

**Response:**
```json
[
  {
    "id": 1,
    "name": "6max 50z 100bb",
    "num_players": 6,
    "stack_bb": 100,
    "game_type": "PLO"
  }
]
```

---

#### 2. `GET /api/tree/:simId`
특정 시뮬레이션의 루트 노드들 조회

**Response:**
```json
[
  {
    "id": 1,
    "filename": "0.0.0.0.0.rng",
    "action_sequence": "UTG:Fold → MP:Fold → CO:Fold → BU:Fold → SB:Fold",
    "acting_position": "BB",
    "depth": 5
  },
  ...
]
```

---

#### 3. `GET /api/tree/:simId/children?parent=0.0.rng`
특정 노드의 자식 노드들 조회

**Query Params:**
- `parent`: 부모 노드 파일명

**Response:**
```json
[
  {
    "id": 10,
    "filename": "0.0.0.rng",
    "action_sequence": "UTG:Fold → MP:Fold → CO:Fold",
    "acting_position": "BU",
    "depth": 3
  },
  {
    "id": 11,
    "filename": "0.0.1.rng",
    "action_sequence": "UTG:Fold → MP:Fold → CO:Call",
    "acting_position": "BU",
    "depth": 3
  }
]
```

---

#### 4. `GET /api/tree/:simId/actions?prefix=0.0.0.0`
현재 결정 포인트에서 가능한 액션들 조회

**Query Params:**
- `prefix`: 현재까지의 액션 시퀀스 (dot-separated)

**Response:**
```json
[
  {
    "filename": "0.0.0.0.0.rng",
    "action_sequence": "...",
    "acting_position": "SB"
  },
  {
    "filename": "0.0.0.0.1.rng",
    "action_sequence": "...",
    "acting_position": "SB"
  }
]
```

---

#### 5. `GET /api/strategy?simId=1&hand=AAAA&actionPrefix=0.0.0.0`
특정 핸드의 전략 조회 (가능한 모든 액션과 빈도/EV)

**Query Params:**
- `simId`: 시뮬레이션 ID
- `hand`: Monker 표기법 또는 표준 표기법 (`AhKs2d3c`)
- `actionPrefix`: 현재까지의 액션 시퀀스

**Response:**
```json
{
  "hand": "AAAA",
  "actionPrefix": "0.0.0.0",
  "actions": [
    {
      "action": "Fold",
      "actionCode": "0",
      "frequency": 0.0,
      "ev": -1000.0,
      "filename": "0.0.0.0.0.rng"
    },
    {
      "action": "Call",
      "actionCode": "1",
      "frequency": 0.15,
      "ev": -450.2,
      "filename": "0.0.0.0.1.rng"
    },
    {
      "action": "Raise100",
      "actionCode": "40100",
      "frequency": 0.85,
      "ev": 220.5,
      "filename": "0.0.0.0.40100.rng"
    }
  ]
}
```

---

#### 6. `GET /api/strategy/range?simId=1&filename=0.0.0.0.1.rng&minFreq=0`
특정 노드의 전체 레인지 조회

**Query Params:**
- `simId`: 시뮬레이션 ID
- `filename`: 노드 파일명
- `minFreq`: 최소 빈도 필터 (0~1, 기본값 0)

**Response:**
```json
{
  "node": {
    "filename": "0.0.0.0.1.rng",
    "actionSequence": "UTG:Fold → MP:Fold → CO:Fold → BU:Fold → SB:Call",
    "actingPosition": "BB"
  },
  "hands": [
    { "hand": "AAAA", "frequency": 1.0, "ev": 500.0 },
    { "hand": "(AK)(AK)", "frequency": 0.95, "ev": 450.0 },
    ...
  ],
  "totalHands": 1523
}
```

---

## 프론트엔드 구조

### 컴포넌트 트리

```
App.tsx
├─ CardSelector.tsx          카드 4장 선택 (그리드 + 텍스트 입력)
├─ ActionTree.tsx            액션 트리 네비게이션 (Fold/Call/Raise 버튼)
├─ StrategyDisplay.tsx       선택한 핸드의 전략 표시 (빈도/EV)
└─ RangeView.tsx             전체 레인지 뷰 (접기/펼치기 가능)
```

### 주요 훅

#### `useSimulations()`
시뮬레이션 목록 로드

**Returns:**
```ts
{
  simulations: Simulation[];
  loading: boolean;
}
```

---

#### `useStrategy(simId, hand, actionPrefix)`
특정 핸드의 전략 조회

**Returns:**
```ts
{
  actions: StrategyAction[];
  loading: boolean;
  error: string | null;
}
```

---

#### `useActionTree(simId)`
액션 트리 상태 관리

**Returns:**
```ts
{
  actionCodes: string[];           // ["0", "0", "0", "0"]
  actionPrefix: string;            // "0.0.0.0"
  pushAction: (code: string) => void;
  popAction: () => void;
  reset: () => void;
}
```

---

#### `useAvailableActions(simId, actionPrefix)`
현재 결정 포인트에서 가능한 액션 조회

**Returns:**
```ts
{
  nodes: TreeNode[];
  loading: boolean;
}
```

---

## 핵심 알고리즘

### 1. 핸드 변환: 표준 → Monker

**위치:** `backend/src/utils/hand.ts` → `cardsToMonker()`

```typescript
// 입력: [{ rank: 'A', suit: 'h' }, { rank: 'K', suit: 's' }, ...]
// 출력: "AK23" 또는 "(AK)Q2"

function cardsToMonker(cards: Card[]): string {
  // 1. 수트별 그룹핑
  const suitMap = new Map<Suit, Rank[]>();
  for (const card of cards) {
    suitMap.get(card.suit).push(card.rank);
  }

  // 2. 각 그룹 내 랭크를 내림차순 정렬
  for (const ranks of suitMap.values()) {
    ranks.sort((a, b) => rankIndex(b) - rankIndex(a));
  }

  // 3. 그룹을 크기 내림차순 정렬 (동일하면 최고 랭크로)
  const groups = Array.from(suitMap.values());
  groups.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return rankIndex(b[0]) - rankIndex(a[0]);
  });

  // 4. Monker 표기법 생성
  let result = '';
  for (const group of groups) {
    if (group.length === 1) {
      result += group[0];  // 단일 카드: 괄호 없음
    } else {
      result += '(' + group.join('') + ')';  // 2장+: 괄호로 묶음
    }
  }
  return result;
}
```

**예시:**
- `AhKs2d3c` → `AK23` (4장 모두 rainbow)
- `AhKh2d3c` → `(AK)23` (A와 K가 같은 수트)
- `AhKh2h3c` → `(A2K)3` (A, 2, K가 같은 수트, 랭크 내림차순 정렬됨)

---

### 2. 액션 시퀀스 디코딩

**위치:** `backend/src/utils/hand.ts` → `decodeActionSequence()`

```typescript
// 입력: "0.0.0.0.40100.rng"
// 출력: {
//   actions: [
//     { position: 'UTG', action: 'Fold', raw: '0' },
//     { position: 'MP', action: 'Fold', raw: '0' },
//     { position: 'CO', action: 'Fold', raw: '0' },
//     { position: 'BU', action: 'Fold', raw: '0' },
//     { position: 'SB', action: 'Raise100', raw: '40100' }
//   ],
//   actingPosition: 'BB',
//   humanReadable: 'UTG:Fold → MP:Fold → CO:Fold → BU:Fold → SB:Raise100'
// }

const POSITIONS_6MAX = ['UTG', 'MP', 'CO', 'BU', 'SB', 'BB'];

function decodeActionSequence(filename: string) {
  const codes = filename.replace(/\.rng$/, '').split('.');
  const actions = [];
  let posIdx = 0;

  for (const code of codes) {
    const position = POSITIONS_6MAX[posIdx % 6];
    const action = ACTION_MAP[code] || `Unknown(${code})`;
    actions.push({ position, action, raw: code });
    posIdx++;
  }

  // 다음 액션할 포지션
  const actingPosition = POSITIONS_6MAX[posIdx % 6];

  return { actions, actingPosition, ... };
}
```

---

### 3. 배치 삽입 (파싱 성능 최적화)

**위치:** `backend/scripts/parse-ranges.ts` → `insertHandsBatch()`

```typescript
// 500개씩 묶어서 단일 쿼리로 삽입
// INSERT INTO hand_strategies VALUES ($1,$2,$3,$4), ($5,$6,$7,$8), ...

const BATCH_SIZE = 500;

for (let i = 0; i < entries.length; i += BATCH_SIZE) {
  const batch = entries.slice(i, i + BATCH_SIZE);

  const values = [];
  const placeholders = [];

  batch.forEach((entry, idx) => {
    const offset = idx * 4;
    placeholders.push(`($${offset+1}, $${offset+2}, $${offset+3}, $${offset+4})`);
    values.push(nodeId, entry.hand, entry.frequency, entry.ev);
  });

  await pool.query(
    `INSERT INTO hand_strategies (node_id, hand, frequency, ev)
     VALUES ${placeholders.join(', ')}
     ON CONFLICT (node_id, hand) DO UPDATE ...`,
    values
  );
}
```

**성능:**
- 개별 INSERT: ~2 hours
- 배치 INSERT (500개): **~5-10 minutes**

---

## 데이터 흐름

### 유저가 핸드 조회 시

```
1. User: 카드 4장 선택 (AhKs2d3c)
   ↓
2. Frontend: standardToMonker() → "AK23"
   ↓
3. Frontend: 액션 트리 네비게이션 (0.0.0.0)
   ↓
4. Frontend: GET /api/strategy?simId=1&hand=AK23&actionPrefix=0.0.0.0
   ↓
5. Backend: DB 쿼리
   - 현재 노드(0.0.0.0)의 자식 노드들 찾기
   - 각 자식 노드에서 hand="AK23"인 row 조회
   ↓
6. Backend: 응답 { actions: [{ action: "Fold", frequency: 0, ev: -1000 }, ...] }
   ↓
7. Frontend: StrategyDisplay 컴포넌트에서 시각화
   - 빈도 막대 차트
   - 액션별 테이블 (빈도, EV)
```

---

## 배포 설정

### Frontend (Vercel)

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://your-backend.railway.app"
  }
}
```

**환경변수:**
- `VITE_API_URL`: 백엔드 API URL

**빌드 스크립트 수정 필요:**
`frontend/src/api/client.ts`:
```typescript
const BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

---

### Backend (Railway)

**railway.json:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

**환경변수 (자동 설정됨):**
- `DATABASE_URL`: Railway PostgreSQL 연결 문자열
- `PORT`: Railway가 할당한 포트
- `CORS_ORIGIN`: Vercel 프론트엔드 URL

---

## 확장 가능성

### 1. 포스트플랍 지원
- `.flop`, `.turn` 파일 파싱 추가
- 보드 카드 선택 UI 추가
- DB 스키마에 `board_cards` 컬럼 추가

### 2. 다중 시뮬레이션 비교
- UI에서 여러 sim 선택 → 나란히 비교

### 3. 레인지 차트 시각화
- 169개 핸드 그리드 (홀덤 스타일)
- PLO는 16,432개라 복잡 → 상위 N개만 표시

### 4. 실시간 계산
- MonkerSolver API 통합
- 커스텀 스택/레이크 설정

### 5. 모바일 앱
- React Native로 포팅
- 오프라인 DB 지원 (SQLite)

---

## 성능 고려사항

### DB 크기
- 4,221 nodes × 16,432 hands = **69,360,672 rows**
- 예상 DB 크기: ~10-15GB (인덱스 포함)

### 쿼리 최적화
- `node_id`, `hand` 복합 인덱스로 빠른 조회
- `depth` 인덱스로 트리 네비게이션 최적화
- 레인지 조회 시 `minFreq` 필터로 불필요한 데이터 제거

### 캐싱 전략 (향후)
- Redis로 자주 조회되는 핸드 캐싱
- CDN으로 정적 레인지 데이터 제공

---

## 코드 스타일 가이드

### TypeScript
- Strict mode 활성화
- 명시적 타입 선호 (any 사용 금지)
- Interface > Type (확장 가능성)

### React
- Functional components + hooks
- Props drilling 최소화 (필요 시 Context API)
- 커스텀 훅으로 로직 재사용

### 네이밍
- 컴포넌트: PascalCase
- 파일: kebab-case (컴포넌트는 PascalCase)
- 함수: camelCase
- 상수: SCREAMING_SNAKE_CASE
- DB 테이블: snake_case

---

## 라이선스 및 크레딧

**참고 프로젝트:**
- [PreflopAdvisor](https://github.com/ksoeze/PreflopAdvisor) (Python)
  - 핸드 변환 로직, .rng 파싱 알고리즘 참고

**라이선스:** MIT (또는 적절한 라이선스 지정)

**주의사항:**
- MonkerSolver .rng 파일은 개인 사용 목적으로만 사용
- 상업적 재배포 금지 (MonkerSolver 라이선스 준수)
