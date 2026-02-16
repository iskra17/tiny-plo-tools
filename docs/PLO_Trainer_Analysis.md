# PLO Mastermind Trainer - UI/UX 분석 및 개발 기획 참고 문서

> 영상 분석 기반: "Exploring PLO Trainer's New Design" by JNandez  
> 분석일: 2026년 2월 12일

---

## 1. 영상 개요

- **채널:** JNandez (PLO Mastermind 창시자 Fernando Habegger)
- **영상 제목:** "Exploring PLO Trainer's New Design - Study, Chill, Review PLO Spots"
- **영상 길이:** 약 1시간 46분 (라이브 스트리밍)
- **조회수:** 약 2,100회
- **주요 내용:** PLO Mastermind의 PLO Trainer 새 디자인을 탐색하며, Study 모드와 Train 모드를 오가며 다양한 PLO 스팟을 분석하는 라이브 세션. CoinPoker Ante & Straddle, PokerStars Classic, 6-Max Cash 등 다양한 포맷의 트레이닝을 시연.

---

## 2. 전체 레이아웃 구조 분석

### 2.1 글로벌 내비게이션

상단 내비게이션 바는 어두운 배경(#1a1a2e 계열)에 흰색 텍스트로 구성되며, 핵심 탭 3개를 제공:

| 탭 | 기능 | 기획 참고점 |
|---|---|---|
| **Study** | GTO 솔루션 브라우징 - 레인지, 카테고리, 이퀴티 그래프, 매트릭스 뷰 | 솔루션 데이터를 시각적으로 탐색하는 핵심 모드. 우리 서비스의 'Solution Browser'에 해당 |
| **Train** | GTO 전략 훈련 - 랜덤 핸드 배분, 액션 선택, 즉시 EV 피드백 | 실전 훈련 모드. 사용자 참여도가 가장 높은 핵심 기능 |
| **Videos** | 코칭 비디오 라이브러리 연동 | 학습 콘텐츠와 트레이너 통합 모델 |

### 2.2 3컬럼 레이아웃

| 영역 | 비율 | 포함 요소 |
|---|---|---|
| **좌측 사이드바** | ~15% | Training Setup (포맷/스택/포지션 선택), Preferences, Session Stats, Feedback (정확도 등급) |
| **중앙 메인** | ~50% | 포커 테이블 (Study: 보드 + 시나리오 트리 / Train: 보드 + 액션 버튼) |
| **우측 패널** | ~35% | Study: Range 테이블 + Matrix + Categories / Train: Info + History + 핸드 브라우저 |

---

## 3. Study 모드 상세 분석

### 3.1 시나리오 선택 및 트리 내비게이션

화면 상단에 스트릿별 액션 트리가 표시됩니다. 각 포지션(EP, EP1, MP, CO, SB, BB, BTN)의 액션과 스택 사이즈가 시각적으로 표현됩니다.

- **Preflop → Flop → Turn → River** 순서로 클릭하며 각 스트릿의 솔루션 탐색 가능
- 각 노드에서 **Fold / Check / Call / Bet(1/3 pot, 2/3 pot, Pot, All-in)** 액션이 컬러 코드로 구분됨 (초록=Check, 빨간=Fold, 분홍=Bet/Raise)
- 각 포지션의 스택 사이즈가 숫자로 표시됨 (e.g., BTN 80.6, SB 54.35)

### 3.2 Range 테이블 (우측 패널)

각 핸드 콤보별로 솔루션 액션 비율과 EV를 표시하는 스프레드시트 형식의 테이블:

- **컬럼 구성:** Hand | 각 Action별 빈도(%) | EV | Weight(WT)
- **컬러 코딩:** Check=초록, Bet=분홍/빨간 그라데이션으로 액션 비율 시각화
- **검색 및 필터:** 특정 핸드 검색(e.g., "AJs2", "KT9"), 필터 비율, 0% Combos 토글, EV difference 표시
- **탭 전환:** Range / Matrix / Reports 탭으로 데이터 뷰 전환 가능

### 3.3 Categories & Equity Graph (좌측 하단)

핸드 카테고리별 액션 비율을 수평 막대 그래프로 표시:

- Straight, Set, Two Pair, One Pair, Draws, Air 등 핸드 강도별 분류
- Unpaired Double-suited, Unpaired Single-suited, Unpaired Rainbow, One Pair Double-suited 등 프리플롭 카테고리
- 각 카테고리별 Check/Bet 비율이 초록/빨간 바로 시각화
- 카테고리 클릭 시 해당 핸드들만 필터링되어 Range 테이블과 연동

---

## 4. Train 모드 상세 분석

### 4.1 Training Setup (좌측 사이드바)

훈련 시나리오를 선택하는 필터 시스템:

| 필터 항목 | 영상에서 확인된 옵션 |
|---|---|
| Game Type | Cash / Postflop / Preflop |
| Table Size | 6-Max / 7-Max / 1vs1 (HU) |
| Platform | Framework / CoinPoker / PokerStars / Classic |
| Stack Depth | 100bb 기본, 플랫폼별 차이 있음 |
| Stakes | Mid Stakes / High Stakes |
| Rake | 5%, 0.4bb cap / 4.5%, 0.06bb cap 등 |
| Structure | Full Pot / Ante & Straddle |
| Position | SB / BB / BTN / CO / 3BP 등 특정 포지션 선택 가능 |
| Skills Mode | Random preflop 포함 현실적 문제 출제 |

### 4.2 포커 테이블 & 액션 UI

- **테이블 디자인:** 진한 녹색 펠트 테이블, 각 포지션에 스택 사이즈 표시
- **카드 표시:** 4장의 홈 카드가 크게 표시, 수트별 컬러 코딩 (♠검정, ♥빨간, ♦파란, ♣초록)
- **보드 카드:** 테이블 중앙에 크게 표시, Total pot 금액 표시
- **액션 버튼:** Fold(흰색) / Call(초록) / Check(초록) / Pot(분홍/빨간) / 1/3 pot / 2/3 pot / All-in
- **딜러 버튼(D):** 테이블 위에 현재 딜러 포지션 표시

### 4.3 피드백 시스템 (핵심 기능)

사용자가 액션을 선택하면 즉시 피드백이 표시됩니다:

| 피드백 등급 | 컬러 | 설명 |
|---|---|---|
| 🟢 Perfect | 초록 | GTO 완벽 일치 |
| 🟢 Correct | 연한 초록 | GTO와 거의 일치 (미세한 EV 차이) |
| 🟡 Inaccuracy | 노란 | 약간의 EV 손실이 있는 선택 |
| 🟠 Mistake | 주황 | 상당한 EV 손실 |
| 🔴 Blunder | 빨간 | 심각한 EV 손실 - 큰 실수 |

- **액션 선택 후 각 버튼에 솔버 빈도(%) 및 EV 값 표시:** e.g., "Fold ▲ 0% EV 0.00 | Call ● 100% EV 2.74 | Pot ▼ 0% EV 2.65"
- **EV Diff 표시:** 선택한 액션과 최적 액션의 EV 차이를 숫자로 표시
- **"Study this hand" 버튼:** Train에서 바로 Study 모드로 전환하여 해당 핸드 심층 분석 가능
- **"Next hand" 버튼:** 다음 문제로 빠르게 이동

### 4.4 Session Stats

- **Hands:** 플레이한 총 핸드 수
- **Accuracy:** 정확도 퍼센트 (e.g., 75%, 90%, 100%)
- **Total EV loss (bb):** 총 EV 손실량 (bb 단위)
- **Avg. EV loss/spot:** 스팟당 평균 EV 손실
- **Feedback 분류:** Perfect / Correct / Inaccuracy / Mistake / Blunder 각각의 횟수 표시

### 4.5 History 패널 (우측)

세션 내 플레이한 모든 핸드의 히스토리를 스크롤 가능한 리스트로 표시. 각 핸드를 클릭하면 해당 핸드의 솔루버 정보(Fold/Call/Bet 빈도, EV)가 표시됩니다. 피드백 등급에 따라 핸드 배경색이 변경됩니다 (빨간=Blunder, 초록=Perfect).

---

## 5. 우리 서비스 개발에 참고할 핵심 포인트

### 5.1 반드시 구현해야 할 핵심 기능

1. **Study ↔ Train 즉시 전환:** "Study this hand" 버튼으로 Train에서 바로 Study로 전환하는 UX가 학습 효율을 크게 높임. 솔루션 브라우징과 훈련이 끊김없이 연결되는 구조가 핵심
2. **5단계 피드백 시스템:** Perfect/Correct/Inaccuracy/Mistake/Blunder 등급은 체스 엔진의 평가 시스템과 유사하며, 사용자가 실수의 심각성을 직관적으로 이해할 수 있음
3. **EV Diff 시각화:** 각 액션별 솔버 빈도(%) + EV 값을 버튼에 직접 표시하는 방식이 학습 효과 극대화
4. **카테고리 기반 레인지 분석:** 핸드 강도(Straight/Set/Two Pair 등) 및 핸드 특성(Double-suited/Single-suited/Rainbow)별 전략 분포 시각화
5. **세션 통계:** Accuracy%, Total EV loss, Avg EV loss/spot 등 세션 단위 성과 추적
6. **Skills 모드:** "Skills: Cash - Mid Stakes (PS) - Random preflop" 처럼 복합 조건을 조합한 현실적 훈련 모드
7. **멀티 플랫폼 지원:** CoinPoker, PokerStars, Classic 등 플랫폼별 레이크/스택 구조 차이를 반영한 솔루션 제공

### 5.2 UI/UX 벤치마킹 포인트

- **다크 테마:** 어두운 배경은 장시간 학습 시 눈의 피로를 줄이며, 카드/컬러 대비를 높임
- **컬러 커뮤니케이션:** 초록=패시브(Check/Call), 분홍~빨간=액티브(Bet/Raise), 바 그래프의 직관성이 뛰어남
- **실시간 피드백:** 클릭 즉시 결과 표시, 로딩 없음 - 사용자 플로우가 끊기지 않음
- **미니멀 내비게이션:** 핵심 탭 3개(Study/Train/Videos)만으로 단순한 구조
- **4-Card / 5-Card 토글:** 상단 좌측에서 한 번의 클릭으로 PLO4/PLO5 전환

### 5.3 우리 서비스에서 차별화할 수 있는 포인트

- **웹 솔버 방식의 장점 활용:** PLO Trainer는 미리 계산된 솔루션 DB를 브라우징하는 방식. 우리는 실시간 솔브 계산을 활용하여 더 유연한 시나리오 제공 가능
- **사용자 커스텀 시나리오:** PLO Trainer는 미리 정의된 스팟만 제공. 사용자가 직접 보드/핸드/스택을 입력하여 커스텀 분석 가능하게 하면 차별화
- **학습 경로 추천:** AI 기반으로 사용자의 약점을 분석하여 맞춤형 훈련 경로 제안
- **장기 성장 추적:** PLO Trainer의 Session Stats를 넘어, 장기간 Accuracy 추이 및 카테고리별 약점 트렌드 분석

---

## 6. 개발 우선순위 제안

| 우선순위 | 단계 | 기능 | PLO Trainer 참고 |
|---|---|---|---|
| P0 | MVP | 포커 테이블 + 액션 버튼 UI (Fold/Call/Bet/Raise) | Train 모드 메인 화면 |
| P0 | MVP | EV 피드백 시스템 (5단계 등급 + EV Diff) | 피드백 버튼 UI |
| P1 | Phase 1 | Range 테이블 (핸드별 액션 빈도 + EV) | Study 모드 Range 패널 |
| P1 | Phase 1 | Categories 바 그래프 (핸드 강도별 전략 분포) | Study 모드 Categories |
| P1 | Phase 1 | 시나리오 트리 내비게이션 (Preflop→Flop→Turn→River) | Study 모드 상단 트리 |
| P2 | Phase 2 | Session Stats & History 패널 | Session Stats + History |
| P2 | Phase 2 | Study ↔ Train 즉시 전환 | Study this hand 버튼 |
| P2 | Phase 2 | Training Setup 필터 시스템 (Game/Table/Stack/Position) | Training Setup 사이드바 |
| P3 | Phase 3 | Matrix 뷰 (13x13 핸드 그리드) | Study 모드 Matrix 탭 |
| P3 | Phase 3 | Equity Graph / Aggregate Reports | Study 모드 Reports 탭 |
| P3 | Phase 3 | Skills 모드 (복합 조건 훈련) | Skills 모드 |

---

## 7. 요약

PLO Mastermind의 PLO Trainer는 현재 PLO 트레이닝 소프트웨어 시장의 기준점으로, Study/Train 이원 구조, 5단계 EV 피드백, 카테고리 기반 레인지 분석이 핵심 경쟁력입니다. 우리 웹솔버는 이 기본 틀을 참고하되, 실시간 솔브 계산과 커스텀 시나리오 입력 기능으로 차별화할 수 있습니다.
