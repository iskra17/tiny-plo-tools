# PLO 솔버 웹 앱 UI/UX 종합 리서치 보고서

> 작성일: 2026-02-15
> 대상 도구: GTO Wizard PLO, PLO Trainer (PLO Mastermind), MonkerSolver, Vision GTO, PioSolver PLO, PokerStove PLO
> 목적: PLO 프리플랍 GTO 솔버 웹 앱 개발을 위한 UI/UX 기능 분석 및 구현 권장사항

---

## 1. 주요 PLO 솔버 도구 분석

### 1.1 GTO Wizard PLO
**유형:** 웹 기반 SaaS (구독형)
**주요 특징:**
- 프리플랍/포스트플랍 모든 스트릿의 GTO 솔루션 브라우징
- 13x13 매트릭스 + 2단계 선택 (PLO 4장 대응)
- 액션 빈도를 수평 바 차트로 표시 (Fold=파란, Call=초록, Raise=빨간)
- 핸드별 EV 값 + 빈도 동시 표시
- 포지션 vs 포지션 매칭 선택 (e.g., BTN vs BB)
- 실시간 핸드 필터링 및 검색
- Aggregate Report (포지션별 전체 레인지 요약)
- 다크 테마 기본, 카드는 4색 덱 (스페이드=검정, 하트=빨강, 다이아=파랑, 클럽=초록)

**UI 패턴:**
- 좌측: 게임트리 내비게이션 (수직 트리)
- 중앙: 포커 테이블 + 보드 카드
- 우측: 레인지 뷰어 (Matrix / Range Table / Aggregate 탭)
- 상단: 시나리오 설정 (스택, 포지션, 레이크)
- 액션 빈도 바: 각 액션이 색상 구간으로 나뉜 하나의 수평 바 (100% 스택 바)

### 1.2 PLO Trainer (PLO Mastermind)
**유형:** 웹 기반 SaaS (구독형)
**주요 특징:** (기존 PLO_Trainer_Analysis.md 참조)
- Study/Train/Videos 3탭 구조
- 3컬럼 레이아웃 (좌측 15% / 중앙 50% / 우측 35%)
- 5단계 피드백 시스템 (Perfect ~ Blunder)
- 카테고리별 수평 막대 그래프
- Normal / Advanced 매트릭스 모드
- Diagonal Suit Logic Separation (수트 필터)

### 1.3 MonkerSolver
**유형:** 데스크톱 앱 (Windows)
**주요 특징:**
- 트리 기반 GTO 계산 엔진
- .rng 파일로 솔루션 내보내기
- 텍스트 기반 핸드 표기법: 괄호 그룹이 같은 수트 카드 (e.g., `(KA)(2Q)`)
- 시각화 기능 제한적 (주로 텍스트/숫자 기반)
- 외부 도구(예: 우리 웹앱)로 시각화하는 것이 일반적
- 액션 코드 체계: 0=Fold, 1=Call, 2=Pot, 3=AllIn, 40075=Raise75%, 40100=Raise100%

### 1.4 Vision GTO
**유형:** 웹 기반 SaaS
**주요 특징:**
- NLHE + PLO 솔루션 제공
- 매트릭스 히트맵: 연속 그라디언트로 EV 값 시각화
- 손 그래프: 핸드를 x축에 EV를 y축에 놓은 분포 차트
- 액션 빈도를 도넛/파이 차트로도 표시
- 핸드 카테고리 필터 (Pairs, Suited, Connected 등)

### 1.5 PioSolver PLO
**유형:** 데스크톱 앱
**주요 특징:**
- NLHE PioSolver의 PLO 확장
- 높은 정확도 솔루션 (실시간 계산)
- 매트릭스 뷰: 히트맵 + 셀 내 숫자(빈도/EV)
- 노드 락킹: 특정 노드의 전략을 고정하고 나머지 재계산
- 스크립팅 지원으로 배치 분석 가능

### 1.6 PokerStove PLO / ProPokerTools
**유형:** 데스크톱/웹 도구 (에퀴티 계산 특화)
**주요 특징:**
- 에퀴티 계산기 (솔버가 아님)
- 레인지 vs 레인지 에퀴티 비교
- 텍스트 기반 레인지 입력 (e.g., "AAxx", "KKds")
- PLO 레인지 문법이 업계 표준으로 자리잡음

---

## 2. 핵심 UI 기능 상세 분석

### 2.1 프리플랍 레인지 표시 방법

PLO는 4장 카드 조합으로 총 270,725개의 고유 핸드가 존재합니다. 이를 효과적으로 표시하기 위해 업계에서 사용하는 방식:

#### 방법 A: 2단계 13x13 매트릭스 (업계 표준)
```
[1단계: 상위 2장 선택]
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A  [AA] [AKs] [AQs] ...
K  [AKo] [KK] [KQs] ...
Q  [AQo] [KQo] [QQ] ...
...

[2단계: 클릭 후 하위 2장 선택]
     A    K    Q    J    T    9    8    7    6    5    4    3    2
A  [--] [--]  [--] ...    (상위 2장과 겹치는 조합은 비활성)
K  [--] [--]  [KQ] ...
...
```

- **대각선 위**: 수티드 조합 (Good Suit)
- **대각선 아래**: 오프수티드 조합 (Bad Suit)
- **대각선**: 페어 핸드
- 장점: 직관적, NLHE 사용자에게 익숙한 패턴
- 단점: 수트 정보가 단순화됨 (Double/Single/Rainbow 구분 필요)

#### 방법 B: 핸드 리스트 테이블 (보조)
```
| Hand          | Fold  | Call  | Raise | EV    |
|---------------|-------|-------|-------|-------|
| (AA)(KK)      | 0%    | 15%   | 85%   | 3.42  |
| (AA)(QJ)      | 0%    | 30%   | 70%   | 2.87  |
| A♠A♥K♠K♥      | 0%    | 10%   | 90%   | 3.65  |
```

- Frequency 컬럼에 색상 바 포함
- EV 정렬 가능
- 검색/필터 기능과 연동

#### 방법 C: 카테고리 집계 바 (보조)
```
핸드 카테고리별 액션 비율:
[Double Suited     ] ████████████████░░░░ Raise 80% | Call 15% | Fold 5%
[Single Suited     ] ██████████░░░░░░░░░░ Raise 50% | Call 30% | Fold 20%
[Rainbow           ] ████░░░░░░░░░░░░░░░░ Raise 20% | Call 25% | Fold 55%
[Pairs             ] ████████████████████ Raise 95% | Call 5%  | Fold 0%
[Connected         ] ██████████████░░░░░░ Raise 65% | Call 25% | Fold 10%
```

### 2.2 액션 빈도 표시 패턴

#### 패턴 1: 스택형 수평 바 (GTO Wizard 스타일) -- 가장 보편적
```
[Fold 15%|||||Call 35%||||||||||||||Raise 50%||||||||||||||||]
 파란색          초록색                빨간색/분홍색
```
- 하나의 바 안에 모든 액션이 비율대로 색상 구분
- 100% 기준으로 비율이 명확히 보임
- **우리 앱의 EnhancedStrategyDisplay에 이미 구현됨**

#### 패턴 2: 개별 바 (PLO Trainer 스타일)
```
Fold:  ████░░░░░░░░░░░░ 25%
Call:  ████████░░░░░░░░ 50%
Raise: ████░░░░░░░░░░░░ 25%
```

#### 패턴 3: 도넛/파이 차트 (Vision GTO 스타일)
```
   ╭─────╮
  │ F:15% │
  │ C:35% │
  │ R:50% │
   ╰─────╯
```
- 시각적으로 인상적이지만 정확한 비율 읽기 어려움
- 보조 표시로 적합

### 2.3 색상 코딩 컨벤션 (업계 표준)

| 액션 | 색상 (일반) | 색상 (GTO Wizard) | Hex 범위 |
|------|------------|-------------------|----------|
| **Fold** | 파란색/회색 | #4A90D9 (파란) | 회색 계열도 일반적 |
| **Check** | 초록색 | #4CAF50 | |
| **Call** | 초록색 | #66BB6A | |
| **Bet Small** | 연한 분홍 | #E8A0BF | |
| **Bet Medium** | 분홍 | #E57373 | |
| **Bet Large / Pot** | 진한 빨강 | #D32F2F | |
| **Raise** | 빨간/주황 | #FF5722 | |
| **All-in** | 진한 빨강/보라 | #B71C1C | |

**핵심 원칙:** 패시브(Check/Call) = 초록 계열, 액티브(Bet/Raise) = 빨간/분홍 계열, Fold = 파란/회색

### 2.4 EV 표시 방법

```
┌─────────────────────────────────────────┐
│ Hand: A♠A♥K♠Q♥                         │
│                                         │
│ Actions:                                │
│  Fold:  0%   EV: 0.00                  │
│  Call:  25%  EV: 2.45  ← (선택 시 강조) │
│  Raise: 75%  EV: 2.87  ← 최고 EV ★     │
│                                         │
│ maxEV: 2.87  |  EV Diff: -0.42 (vs Call)│
│ Weight: 100%                            │
└─────────────────────────────────────────┘
```

- **maxEV**: 가장 높은 EV를 가진 액션의 EV 값
- **EV Diff**: 선택한 액션과 maxEV 액션의 차이
- **Weight**: 해당 핸드가 레인지에 포함되는 비율 (0~100%)

### 2.5 포지션 기반 내비게이션

#### GTO Wizard 스타일 (가장 직관적):
```
[시나리오 선택 바]
6-Max | 100bb | NL/PLO Toggle

[포지션 매칭]
Hero: [UTG ▼]  Action: [RFI ▼]
vs Villain: [BB ▼]

[액션 트리 (수직)]
UTG: Raise 2.5bb
  └─ BB: ?
      ├─ Fold (62%)
      ├─ Call (28%)
      └─ 3Bet 8bb (10%)
          └─ UTG: ?
              ├─ Fold (45%)
              ├─ Call (40%)
              └─ 4Bet 22bb (15%)
```

#### PLO Trainer 스타일 (수평 트리):
```
[UTG R100] → [MP Fold] → [CO Fold] → [BTN Fold] → [SB Fold] → [BB ???]
   2.5bb                                                    현재 노드
```

#### 우리 앱 현재 구현 (PositionActionBar):
```
[UTG ▼] [MP ▼] [CO ▼] [BTN ▼] [SB ▼] [BB ▼]
 Raise    Fold    Fold   Call    Fold    ???
```
- 각 포지션에 드롭다운으로 액션 선택
- 선택된 액션이 포지션 아래에 표시

### 2.6 수트 필터 시스템

PLO에서 수트 구성은 핸드 가치에 큰 영향. 필터 옵션:

| 필터 | 설명 | 예시 | 핸드 수 비율 |
|------|------|------|-------------|
| **All** | 모든 수트 조합 | - | 100% |
| **Double Suited** | 2+2 같은 수트 | A♠K♥8♠5♥ | ~11% |
| **Single Suited** | 2장만 같은 수트 | A♠K♥8♠5♣ | ~50% |
| **Rainbow** | 모두 다른 수트 | A♠K♥8♦5♣ | ~25% |
| **Triple Suited** | 3장 같은 수트 | A♠K♠8♠5♥ | ~13% |
| **Monotone** | 4장 모두 같은 수트 | A♠K♠8♠5♠ | ~1% |

**구현 방식 (PLO Trainer):**
- 토글 버튼 그룹으로 배치
- 선택 시 매트릭스 + 핸드 리스트 즉시 업데이트
- 복수 선택 가능 (e.g., Double + Single)

### 2.7 핸드 카테고리/그룹화

#### 프리플랍 카테고리 (PLO 특화):
```
[구조 기반 카테고리]
- Pairs (AA, KK, QQ, ...)
- Double Paired (AAKKds, AAQQds, ...)
- Connected (JT98, 8765, ...)
- Gapped Connected (KJT8, QT97, ...)
- Rundowns (KQJT, QJT9, T987, ...)
- Broadway (AKQJ, AKQx, AKJx, ...)
- Danglers (AAK2, KKQ3, ...)

[수트 기반 카테고리]
- Double Suited
- Single Suited (to Ace, to King, ...)
- Rainbow
- Triple Suited
- Monotone

[복합 카테고리]
- Premium (top 10%): AAxx, KKxx ds, Rundowns ds
- Strong (top 30%): Single-suited broadway, Connected
- Playable (top 60%): Most suited hands
- Marginal (bottom 40%): Rainbow, danglers
```

### 2.8 핸드 필터링 문법

PLO 레인지 필터링에서 사용되는 업계 표준 문법:

```
// 기본 형식
AAxx          - AA + 아무 2장
KKds          - KK double suited
AKQJds        - AKQJ double suited
T987ss        - T987 single suited

// 특정 카드 지정
AA[KQ][JT]    - AA + (K 또는 Q) + (J 또는 T)
KK[98-65]     - KK + 연결된 하위 2장 (98~65)

// 와일드카드
AKQ*          - AKQ + 아무 1장
**87          - 아무 2장 + 87

// 수트 지정
As Kh Qs Jh   - 특정 수트 지정
(AK)(QJ)      - Monker 표기: AK 같은 수트 + QJ 같은 수트

// 범위
[JT-87]       - JT, T9, 98, 87 연결 카드
```

---

## 3. 구현 권장사항 (우선순위별)

### 3.1 Must-Have (필수 구현)

#### MH-1: 액션 빈도 스택 바 (현재 구현됨, 개선 필요)
```
현재: EnhancedStrategyDisplay에 기본 구현
개선점:
- 각 액션 구간에 마우스 오버 시 툴팁 (정확한 %, EV)
- 액션 구간 클릭 시 해당 액션의 핸드만 필터링
- 바 위에 핸드 이름 표시
- 고정 높이 (40px) + 최소 너비 보장 (5% 미만 액션도 클릭 가능)
```

**React 구현 스케치:**
```tsx
// ActionFrequencyBar.tsx
interface ActionBarProps {
  actions: { code: string; name: string; freq: number; ev: number; color: string }[];
  onActionClick?: (actionCode: string) => void;
  height?: number;
}

const ActionFrequencyBar: React.FC<ActionBarProps> = ({ actions, onActionClick, height = 40 }) => {
  return (
    <div className="flex w-full rounded-md overflow-hidden" style={{ height }}>
      {actions
        .filter(a => a.freq > 0)
        .map(action => (
          <div
            key={action.code}
            className="flex items-center justify-center text-xs font-medium text-white cursor-pointer
                       hover:brightness-110 transition-all relative group"
            style={{
              width: `${Math.max(action.freq * 100, 3)}%`,  // 최소 3% 너비
              backgroundColor: action.color
            }}
            onClick={() => onActionClick?.(action.code)}
          >
            {action.freq > 0.08 && `${action.name} ${Math.round(action.freq * 100)}%`}
            {/* 툴팁 */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block
                            bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
              {action.name}: {(action.freq * 100).toFixed(1)}% | EV: {action.ev.toFixed(2)}
            </div>
          </div>
        ))}
    </div>
  );
};
```

#### MH-2: 매트릭스 셀 컬러 코딩 (현재 구현됨, 개선 필요)
```
현재: 기본 Fold/Call/Raise 색상 구현됨
개선점:
- 혼합 전략 셀에 그라디언트 표시 (다수 액션이 비슷한 빈도일 때)
- 셀 호버 시 간략 툴팁 (주요 액션 + 빈도)
- 셀 선택 시 테두리 강조 (2px solid white)
- 빈 셀 (해당 조합 없음) 표시 (어두운 회색)
```

**셀 색상 계산 로직:**
```tsx
// 각 셀의 배경색을 액션 빈도 가중 평균으로 계산
function getCellColor(actions: ActionFreq[]): string {
  const colors = {
    fold: { r: 74, g: 144, b: 217 },   // 파란
    call: { r: 76, g: 175, b: 80 },     // 초록
    raise: { r: 229, g: 57, b: 53 },    // 빨간
  };

  let r = 0, g = 0, b = 0;
  for (const action of actions) {
    const c = colors[action.type] || colors.fold;
    r += c.r * action.freq;
    g += c.g * action.freq;
    b += c.b * action.freq;
  }
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
```

#### MH-3: 핸드 리스트 (현재 구현됨, 개선 필요)
```
현재: HandList.tsx에 기본 구현 (정렬 포함)
개선점:
- 가상 스크롤 (react-window 또는 @tanstack/react-virtual)
  → 16,000+ 핸드 렌더링 시 필수
- 핸드 카드에 수트 색상 표시 (♠검정 ♥빨강 ♦파랑 ♣초록)
- 각 핸드 행의 빈도 바를 인라인 미니 바 차트로 표시
- 핸드 클릭 시 좌측 패널의 상세 전략 표시와 연동
```

**가상 스크롤 구현:**
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualHandList({ hands }: { hands: HandData[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: hands.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,  // 각 행 36px
    overscan: 20,
  });

  return (
    <div ref={parentRef} className="h-[500px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <HandRow
            key={virtualRow.key}
            hand={hands[virtualRow.index]}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              height: virtualRow.size,
              width: '100%',
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

#### MH-4: 수트 필터 실제 연동 (부분 구현됨)
```
현재: SuitFilter.tsx 버튼 UI + classifySuit 함수 구현됨
개선점:
- 'All' 필터 활성화 시 전체 핸드 표시
- 복수 필터 선택 지원 (예: Double + Single 동시 선택)
- 필터 변경 시 매트릭스 색상 즉시 업데이트
- 필터별 핸드 수 뱃지 표시 (예: "Double Suited (1,245)")
```

#### MH-5: 게임트리 내비게이션 개선
```
현재: PositionActionBar로 기본 구현
개선점:
- 현재 경로를 빵 부스러기(breadcrumb)로 표시:
  "UTG Raise100 → MP Fold → CO Fold → BTN Call → SB Fold → BB: ???"
- 각 노드에서 가능한 액션 목록을 시각적으로 표시
- 뒤로가기/앞으로가기 버튼
- 트리 깊이 표시 (현재 depth 레벨)
```

**Breadcrumb 구현:**
```tsx
function ActionBreadcrumb({ actions }: { actions: ActionNode[] }) {
  return (
    <div className="flex items-center gap-1 text-sm overflow-x-auto py-2">
      {actions.map((action, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-gray-500">→</span>}
          <button
            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap
              ${action.isActive
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            onClick={() => action.onClick()}
          >
            <span className="text-gray-400">{action.position}</span>{' '}
            <span style={{ color: getActionColor(action.code) }}>
              {action.name}
            </span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
```

#### MH-6: EV 표시
```
현재: 기본 EV 값 표시됨
개선점:
- maxEV 강조 표시 (별표 또는 굵은 글씨)
- EV Diff 컬럼 추가 (maxEV - 해당 액션 EV)
- EV 기준 정렬 옵션
- EV > 0 (수익) = 초록, EV < 0 (손실) = 빨간 색상 코딩
- bb 단위 표시 (예: "EV: +2.45bb")
```

### 3.2 Should-Have (권장 구현)

#### SH-1: 핸드 카테고리 필터
```
구현 내용:
- 프리플랍 핸드 카테고리 분류 엔진
- 카테고리 목록 (체크박스 또는 버튼):
  □ Premium (AAxx, KKxx ds, Top Rundowns)
  □ Pairs (AA-22)
  □ Double Paired (AAKKds, ...)
  □ Rundowns (4장 연속: KQJT, QJT9, ...)
  □ Broadway (2+ 브로드웨이 카드)
  □ Connected (2+ 연결 카드)
  □ Suited Aces (Axxx suited to A)
  □ Danglers (3장 연결 + 1장 이탈)

- 카테고리별 전략 분포 바 차트 (좌측 패널):
  [Pairs    ] ████████████████░░░░ R:80% C:15% F:5%
  [Rundowns ] ██████████████░░░░░░ R:70% C:20% F:10%
  [Broadway ] ██████████░░░░░░░░░░ R:50% C:25% F:25%
  [Danglers ] ████░░░░░░░░░░░░░░░░ R:20% C:15% F:65%

- 카테고리 클릭 시 매트릭스 + 핸드 리스트 필터링
```

**카테고리 분류 함수:**
```tsx
type HandCategory =
  | 'premium' | 'pairs' | 'double_paired' | 'rundowns'
  | 'broadway' | 'connected' | 'suited_aces' | 'danglers' | 'other';

function categorizeHand(ranks: number[], suitPattern: string): HandCategory[] {
  const categories: HandCategory[] = [];
  const sorted = [...ranks].sort((a, b) => b - a);
  const hasPair = new Set(ranks).size < 4;
  const broadwayCards = sorted.filter(r => r >= 10).length;
  const isConnected = sorted[0] - sorted[3] <= 4;  // gap 고려

  // Premium: AA + 좋은 사이드카드, 또는 KK ds + 연결
  if (sorted[0] === 14 && sorted[1] === 14) {
    categories.push('premium');
  }
  if (hasPair) categories.push('pairs');
  if (broadwayCards >= 3) categories.push('broadway');
  if (isConnected) categories.push('rundowns');
  // ... 기타 분류 로직

  return categories.length > 0 ? categories : ['other'];
}
```

#### SH-2: 핸드 검색/필터 개선
```
현재: RangeInput.tsx에 텍스트 입력 구현
개선점:
- 자동완성 (입력 시 매칭되는 핸드 실시간 표시)
- 와일드카드 지원 (AAxx, KK**, **87)
- 수트 필터 문법 (ds=double suited, ss=single suited, rb=rainbow)
- 레인지 문법 (AA-QQ, AKxx-AJxx)
- 검색 결과 카운트 표시 ("345 hands matched")
- 검색 히스토리 (최근 10개)
```

#### SH-3: Aggregate Report (집계 보고서)
```
구현 내용:
- 현재 노드에서 전체 레인지의 전략 요약:

  ┌─────────────────────────────────────┐
  │ BB vs UTG RFI - Aggregate Report    │
  │                                     │
  │ Total Combos: 270,725              │
  │ Playing: 38.5% (104,229 combos)    │
  │                                     │
  │ Strategy Distribution:              │
  │ [Fold 61.5%████████████|Call 28.2%███████|3Bet 10.3%███]│
  │                                     │
  │ Average EV: +1.24bb                 │
  │ Top 10% Hands EV: +4.56bb          │
  │ Bottom 10% Hands EV: -0.87bb       │
  └─────────────────────────────────────┘

- 포지션별 비교: 같은 상황에서 다른 포지션의 전략 비교
```

#### SH-4: 다크 테마 전체 적용
```
현재: 부분적 다크 테마
개선점:
- Tailwind CSS v4의 @theme 활용한 일관된 다크 테마
- 색상 변수 체계:
  --bg-primary: #0F1419 (최상위 배경)
  --bg-secondary: #1A1F2E (카드/패널 배경)
  --bg-tertiary: #242938 (입력/호버 배경)
  --text-primary: #E8EAED
  --text-secondary: #9AA0A6
  --border: #3C4043
  --accent-fold: #4A90D9
  --accent-call: #4CAF50
  --accent-raise: #E53935
  --accent-allin: #B71C1C
```

#### SH-5: 포커 테이블 시각화 개선
```
현재: PokerTable.tsx 기본 구현
개선점:
- 각 포지션 원형 아바타에 현재 액션 표시 (컬러 링)
- 팟 크기를 bb 단위로 중앙에 크게 표시
- 현재 액션 포지션 강조 (깜빡임 또는 밝은 테두리)
- 딜러 버튼(D) 표시
- 각 포지션의 베팅 금액 (칩 스택 또는 숫자)
- 카드 아이콘 (선택된 핸드가 있을 때 해당 포지션에 표시)
```

### 3.3 Nice-to-Have (차별화 기능)

#### NH-1: 키보드 단축키
```
| 단축키 | 기능 |
|--------|------|
| ← / → | 이전/다음 액션 노드 |
| ↑ / ↓ | 핸드 리스트 위/아래 |
| F | Fold 액션 선택 |
| C | Call 액션 선택 |
| R | Raise 액션 선택 |
| 1-6 | 포지션 선택 (UTG~BB) |
| M | Matrix 탭 전환 |
| L | Range(List) 탭 전환 |
| S | 수트 필터 순환 (All→DS→SS→RB) |
| Esc | 매트릭스 선택 해제 / 1단계로 돌아가기 |
| / | 핸드 검색 포커스 |
| ? | 단축키 도움말 |
```

**구현:**
```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return; // 입력 중이면 무시

    switch (e.key) {
      case 'Escape':
        dispatch({ type: 'RESET_MATRIX_SELECTION' });
        break;
      case '/':
        e.preventDefault();
        searchInputRef.current?.focus();
        break;
      case 'm': case 'M':
        setActiveTab('matrix');
        break;
      // ... 기타 단축키
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

#### NH-2: 핸드 비교 모드
```
구현 내용:
- 2개 이상의 핸드를 선택하여 전략/EV 나란히 비교
- 매트릭스에서 Ctrl+클릭으로 복수 셀 선택
- 비교 패널:

  ┌─────────────────┬─────────────────┐
  │ A♠A♥K♠Q♥        │ A♠A♥8♠7♥        │
  │ Fold: 0%        │ Fold: 5%        │
  │ Call: 20%       │ Call: 35%       │
  │ Raise: 80%      │ Raise: 60%      │
  │ EV: 3.42        │ EV: 2.15        │
  │ Diff: +1.27     │ (기준)           │
  └─────────────────┴─────────────────┘
```

#### NH-3: EV 히트맵 모드
```
구현 내용:
- 매트릭스 셀 색상을 액션 빈도 대신 EV 값 기반으로 표시
- 연속 그라디언트: 빨간(낮은 EV) → 노란(중간) → 초록(높은 EV)
- 토글: "Action View" ↔ "EV View" 전환 버튼
```

#### NH-4: 핸드 히스토리 / 북마크
```
구현 내용:
- 관심 있는 핸드/노드를 북마크하여 나중에 빠르게 접근
- localStorage에 저장
- 최근 조회한 노드 히스토리 (최대 20개)
```

#### NH-5: 레인지 내보내기
```
구현 내용:
- 현재 보고 있는 레인지를 텍스트/CSV/이미지로 내보내기
- 매트릭스 스크린샷 (html2canvas)
- 핸드 리스트 CSV 다운로드
- Monker 표기법 텍스트 복사
```

#### NH-6: Train 모드 (미래 계획)
```
단계적 구현:
Phase 1: 랜덤 핸드 출제 + 액션 선택 + 정답 확인
Phase 2: 5단계 피드백 (Perfect~Blunder) + EV Diff
Phase 3: 세션 통계 (Accuracy%, Total EV loss)
Phase 4: Study this hand 연동
Phase 5: 카테고리별 약점 분석
```

#### NH-7: 반응형 디자인 / 모바일 대응
```
브레이크포인트:
- Desktop (>1280px): 2컬럼 전체 레이아웃
- Tablet (768~1280px): 탭 전환식 (테이블/매트릭스 번갈아 표시)
- Mobile (<768px): 단일 컬럼 + 스와이프 내비게이션

매트릭스 모바일 대응:
- 핀치 줌 지원
- 셀 최소 크기 44x44px (터치 타겟)
- 2단계 선택 시 전체 화면 모달로 표시
```

---

## 4. 구현 로드맵 제안

### Phase 1: 핵심 개선 (현재 세션)
| # | 작업 | 소요 시간 | 영향도 |
|---|------|----------|--------|
| 1 | 가상 스크롤 (HandList) | 2시간 | 높음 - 성능 |
| 2 | 핸드 카드 수트 색상 표시 | 1시간 | 높음 - 가독성 |
| 3 | 액션 바 툴팁 + 호버 효과 | 1시간 | 중간 - UX |
| 4 | 매트릭스 셀 호버 툴팁 | 1시간 | 중간 - UX |
| 5 | EV 색상 코딩 (양수=초록, 음수=빨간) | 30분 | 중간 - 가독성 |
| 6 | 빵 부스러기 내비게이션 | 1.5시간 | 높음 - UX |

### Phase 2: 기능 확장 (다음 세션)
| # | 작업 | 소요 시간 | 영향도 |
|---|------|----------|--------|
| 1 | 핸드 카테고리 분류 엔진 | 3시간 | 높음 |
| 2 | 카테고리별 전략 바 차트 | 2시간 | 높음 |
| 3 | 다크 테마 일관성 적용 | 2시간 | 중간 |
| 4 | 복수 수트 필터 선택 | 1시간 | 중간 |
| 5 | 핸드 검색 자동완성 | 2시간 | 중간 |
| 6 | Aggregate Report | 3시간 | 중간 |

### Phase 3: 고급 기능 (이후 세션)
| # | 작업 | 소요 시간 | 영향도 |
|---|------|----------|--------|
| 1 | 키보드 단축키 | 2시간 | 중간 |
| 2 | 핸드 비교 모드 | 3시간 | 낮음 |
| 3 | EV 히트맵 모드 | 2시간 | 낮음 |
| 4 | 레인지 내보내기 | 2시간 | 낮음 |
| 5 | 반응형 디자인 | 4시간 | 중간 |

---

## 5. 기술 스택 권장사항

### 추가 패키지 (React + TypeScript + Tailwind)
```json
{
  "@tanstack/react-virtual": "^3.x",     // 가상 스크롤 (HandList 성능)
  "html2canvas": "^1.x",                  // 매트릭스 스크린샷 내보내기
  "recharts": "^2.x",                     // 차트 (카테고리 바, EV 그래프)
  "cmdk": "^1.x",                          // 핸드 검색 커맨드 팔레트
  "framer-motion": "^11.x"                // 애니메이션 (선택사항)
}
```

### 성능 최적화 팁
1. **매트릭스 렌더링**: 169개 셀은 `React.memo`로 불필요한 리렌더 방지
2. **핸드 리스트**: 반드시 가상 스크롤 사용 (16,000+ 행)
3. **API 캐싱**: 같은 노드 재방문 시 캐시 활용 (`Map<string, RangeData>`)
4. **색상 계산**: `useMemo`로 셀 색상 캐싱 (의존성: actionData)
5. **수트 필터**: 프론트엔드에서 필터링 (서버 재요청 없이)

---

## 6. 요약

| 우선순위 | 기능 | 참고 도구 | 현재 상태 |
|---------|------|----------|----------|
| **Must** | 액션 빈도 스택 바 + 툴팁 | GTO Wizard | 기본 구현, 개선 필요 |
| **Must** | 매트릭스 컬러 코딩 + 호버 | PLO Trainer | 기본 구현, 개선 필요 |
| **Must** | 핸드 리스트 가상 스크롤 | 공통 | 미구현 |
| **Must** | 수트 필터 완전 연동 | PLO Trainer | 부분 구현 |
| **Must** | 게임트리 빵부스러기 | GTO Wizard | 미구현 |
| **Must** | EV 표시 + 색상 코딩 | 공통 | 기본 구현 |
| **Should** | 핸드 카테고리 필터 | PLO Trainer | 미구현 |
| **Should** | Aggregate Report | GTO Wizard | 미구현 |
| **Should** | 다크 테마 일관성 | 공통 | 부분 구현 |
| **Should** | 핸드 검색 개선 | GTO Wizard | 기본 구현 |
| **Nice** | 키보드 단축키 | GTO Wizard | 미구현 |
| **Nice** | 핸드 비교 모드 | Vision GTO | 미구현 |
| **Nice** | Train 모드 | PLO Trainer | 미구현 |
| **Nice** | 반응형 디자인 | PLO Trainer | 미구현 |
