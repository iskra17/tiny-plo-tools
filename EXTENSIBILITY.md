# PLO Tools - 확장성 가이드

새로운 도구/기능을 추가하는 방법을 설명합니다.

---

## 프로젝트 구조 개요

```
frontend/src/
  main.tsx                ← React 진입점 (BrowserRouter 설정)
  App.tsx                 ← 라우터 + 사이드바 (새 라우트 추가 지점)
  index.css               ← Tailwind v4 글로벌 스타일

  pages/
    SolverPage.tsx        ← Preflop Solver (AppProvider/RangeDataProvider 래핑)
    equity/               ← Equity Calculator (독립적 페이지 + 컴포넌트 + 로직)
      EquityPage.tsx          메인 페이지 컴포넌트
      components/             UI 컴포넌트 (BoardPanel, PlayerPanel, ResultsPanel 등)
      logic/                  순수 계산 로직 (deck.ts, poker.ts, nextCard.ts 등)
      types.ts                타입 정의
      constants.ts            상수 값
      i18n.ts                 다국어(ko/en) 번역

  components/
    layout/
      Sidebar.tsx         ← 사이드바 (새 메뉴 항목 추가 지점, MENU_ITEMS 배열)
      AppLayout.tsx       ← Solver 전용 2-column 레이아웃
      LeftPanel.tsx       ← Solver 왼쪽 패널 (PokerTable + Strategy)
      RightPanel.tsx      ← Solver 오른쪽 패널 (Matrix/Range 탭)
    matrix/               ← 13x13 매트릭스 그리드 (MatrixGrid, MatrixTab, HandList 등)
    strategy/             ← 전략 표시 (EnhancedStrategyDisplay, CategoryChart 등)
    range/                ← 레인지 탭 (RangeTab, RangeInput)
    quiz/                 ← 퀴즈 기능 (QuizPanel, QuizQuestion 등)
    PositionActionBar.tsx ← 포지션 액션 바
    PokerTable.tsx        ← 포커 테이블 시각화
    ActionTimeline.tsx    ← 액션 타임라인

  context/
    AppContext.tsx         ← Solver 전용 상태 관리 (Context + useReducer)

  hooks/
    useRangeData.tsx      ← 레인지 데이터 페칭 훅
    useStrategy.ts        ← 전략 데이터 페칭 훅

  api/
    client.ts             ← API 클라이언트 (백엔드 통신)

  utils/                  ← 유틸리티 함수들
    cardDisplay.tsx           카드 렌더링
    handCategories.ts         핸드 카테고리 분류
    positionCycle.ts          포지션 순환 로직
    rangeParser.ts            레인지 파싱
    betCalculator.ts          베팅 계산
    monkerFilter.ts           Monker 필터

  constants/
    poker.ts              ← 포커 관련 상수 (포지션, 랭크 등)

backend/                  ← Express + PostgreSQL API 서버
  src/                        서버 소스 코드
  scripts/                    DB 임포트 스크립트
```

---

## 새 도구 추가 방법 (Step by Step)

Equity Calculator 페이지를 참고 예시로 사용합니다.

### Step 1. 페이지 폴더 생성

`frontend/src/pages/` 아래에 새 도구 전용 폴더를 생성합니다.

```
frontend/src/pages/새도구/
  NewToolPage.tsx        ← 메인 페이지 컴포넌트
  components/            ← 페이지 전용 UI 컴포넌트
  logic/                 ← 페이지 전용 순수 로직 (필요시)
  types.ts               ← 타입 정의
  constants.ts           ← 상수 값
  i18n.ts                ← 다국어 지원 (필요시)
```

### Step 2. 메인 페이지 컴포넌트 작성

`NewToolPage.tsx`를 작성합니다. 다크 테마에 맞춰 `bg-slate-900` 기반으로 만듭니다.

```tsx
// frontend/src/pages/newtool/NewToolPage.tsx

export default function NewToolPage() {
  return (
    <div className="h-full bg-slate-900 flex flex-col overflow-y-auto">
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex-shrink-0">
        <h1 className="text-lg font-bold text-white">New Tool</h1>
      </header>
      <main className="flex-1 p-4">
        {/* 도구 내용 */}
      </main>
    </div>
  );
}
```

### Step 3. App.tsx에 Route 추가

`frontend/src/App.tsx`에 import와 Route를 추가합니다.

```tsx
import NewToolPage from './pages/newtool/NewToolPage';

// Routes 내부에 추가:
<Route path="/newtool" element={<NewToolPage />} />
```

### Step 4. Sidebar.tsx에 메뉴 항목 추가

`frontend/src/components/layout/Sidebar.tsx`의 `MENU_ITEMS` 배열에 항목을 추가합니다.

```tsx
// 1. 아이콘 컴포넌트를 새로 만듭니다 (SVG 20x20 기준)
function NewToolIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* SVG 내용 */}
    </svg>
  );
}

// 2. MENU_ITEMS 배열에 추가합니다
const MENU_ITEMS: MenuItem[] = [
  { path: '/solver', label: 'Preflop Solver', icon: <SolverIcon /> },
  { path: '/equity', label: 'Equity Calculator', icon: <EquityIcon /> },
  { path: '/newtool', label: 'New Tool', icon: <NewToolIcon /> },  // 추가
];
```

`MenuItem` 인터페이스:
- `path`: 라우트 경로 (예: `/newtool`)
- `label`: 사이드바에 표시될 텍스트
- `icon`: React 노드 (SVG 아이콘, 20x20px)

### Step 5. 빌드 확인

타입 체크와 빌드가 정상적으로 되는지 확인합니다.

```bash
cd frontend
npx tsc --noEmit && npx vite build
```

---

## 코딩 컨벤션

### TypeScript
- **strict mode** 사용 (`tsconfig.json`에 설정됨)
- 타입은 페이지 전용 `types.ts` 파일에 정의
- `any` 타입 사용 최소화

### 스타일링
- **Tailwind v4** 인라인 클래스 사용 (인라인 CSS 최소화)
- 다크 테마 기반: `bg-slate-900` (메인), `bg-slate-800` (헤더/카드), `bg-slate-950` (사이드바)
- 텍스트: `text-white` (주요), `text-slate-300` (보조), `text-slate-400` (비활성)
- 보더: `border-slate-700` 또는 `border-slate-600`
- 액센트 컬러: `blue-500` (선택/활성), `emerald` (긍정), `red` (부정)

### 상태 관리
- **페이지별 독립적 상태 관리** (Context 오염 금지)
  - Solver: `AppContext.tsx` (Context + useReducer)
  - Equity: `useState` (페이지 내부에서 완결)
- 공유 상태가 필요 없다면 `useState`로 충분
- 복잡한 상태가 필요하면 페이지 전용 Context를 별도로 생성

### 컴포넌트 구조
- 페이지 전용 컴포넌트는 `pages/도구명/components/`에 배치
- 여러 페이지에서 공유하는 컴포넌트만 `components/`에 배치
- 순수 로직(계산, 파싱 등)은 `logic/` 폴더에 분리

### 다국어 지원 (선택)
- `i18n.ts`에 번역 객체 정의 (`{ ko: {...}, en: {...} }`)
- `LangContext`로 현재 언어 전달
- `localStorage`에 언어 설정 저장 (키 예: `"plo-lang"`)

---

## 추가 가능한 도구 아이디어

| 도구 | 설명 |
|---|---|
| **Postflop Solver** | 플랍/턴/리버 GTO 솔루션 뷰어 |
| **Hand History Analyzer** | 핸드 히스토리 파일(HH) 파싱 및 분석 |
| **Range vs Range Simulator** | 두 레인지 간 에퀴티 시뮬레이션 |
| **ICM Calculator** | 토너먼트 ICM 칩 가치 계산기 |
| **Tournament Push/Fold Chart** | 숏스택 푸시/폴드 차트 |
| **Odds Calculator** | 아웃츠/확률 계산기 |
| **Bankroll Manager** | 뱅크롤 관리 및 트래킹 |

---

## 참고 사항

- **React Router**: `BrowserRouter` + `Routes`/`Route` 사용 (SPA)
- **배포**: Netlify 배포 시 SPA fallback 설정 필요 (`netlify.toml` 참조)
- **백엔드 의존**: Solver 페이지는 Express + PostgreSQL 백엔드가 필요하지만, Equity Calculator처럼 프론트엔드만으로 동작하는 도구도 가능
- **아이콘**: 사이드바 아이콘은 인라인 SVG로 작성 (외부 아이콘 라이브러리 미사용)
