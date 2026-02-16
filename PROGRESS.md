# PLO Web Solver - 개발 진행 상황

> 마지막 업데이트: 2026-02-14

## 완료된 작업

### Backend (100% 완료)
- [x] Express + TypeScript 서버 설정 (port 3001)
- [x] PostgreSQL 연결 (pool.ts)
- [x] DB 스키마: simulations, tree_nodes, hand_strategies
- [x] .rng 파일 파싱 스크립트 (4,221 파일, ~69M 핸드)
- [x] API 엔드포인트: /simulations, /tree, /strategy, /strategy/range
- [x] `getAvailableActions` 쿼리 수정 (depth 기반 → split_part 기반)
- [x] `getStrategy` 쿼리 수정 (누락된 액션 빈도 자동 계산)

### Frontend - 구조 (완료)
- [x] Context API + useReducer 상태 관리 (AppContext.tsx)
- [x] 상수 정의 (constants/poker.ts)
- [x] 2컬럼 레이아웃 (AppLayout, LeftPanel, RightPanel)
- [x] App.tsx 리팩토링 (AppProvider 적용)

### Frontend - 컴포넌트 (기본 구현 완료, 개선 필요)
- [x] PositionActionBar - 포지션별 액션 선택 드롭다운
- [x] PokerTable - 포커 테이블 시각화 (6 포지션, 팟 표시)
- [x] MatrixGrid - 13x13 그리드 (2단계 선택)
- [x] MatrixTab - Matrix 컨테이너 + 핸드 필터링
- [x] SuitFilter - Double/Single/Triple/Rainbow 버튼
- [x] HandList - 필터된 핸드 리스트 (freq, ev, action bar)
- [x] RangeInput - Monker 표기법 텍스트 입력
- [x] RangeTab - Range 검색 + 결과 표시
- [x] EnhancedStrategyDisplay - 액션 빈도 바 + EV

### 버그 수정 (완료)
- [x] 드롭다운 가려짐 → z-index + overflow 수정
- [x] UTG Raise100 액션 안 보임 → 쿼리 로직 수정
- [x] Strategy 빈 결과 → depth 문제 + 빈도 계산 추가
- [x] Fragment key 경고 → React.Fragment key 추가
- [x] Stage 2 필터 불가능 → 4장 rank 매칭 로직 수정
- [x] Root 레벨 전략 안 보임 → empty actionPrefix 허용
- [x] Pot 지수 증가 → 올바른 pot-sized raise 계산

### 2026-02-14 세션 완료
- [x] **Suit 필터 실제 연동** - 'all' 필터 추가, 핸드 수트 분류 함수 구현 (double/single/triple/rainbow), MatrixTab에서 필터 적용
- [x] **Matrix 셀 컬러 코딩** - 모든 액션 range 로드, 셀별 Fold(회색)/Call(초록)/Raise(빨강) 비율 기반 그라디언트 색상
- [x] **로딩/에러 상태** - EnhancedStrategyDisplay에 에러 메시지 표시 추가
- [x] **선택된 핸드 리셋** - PUSH_ACTION/POP_ACTION/RESET_ACTIONS 시 selectedHands + matrixState 자동 초기화
- [x] **HandList 정렬** - Hand/Freq/EV 컬럼 헤더 클릭으로 오름차순/내림차순 정렬
- [x] **Backend depth 필드** - getAvailableActions 쿼리에 depth 포함 (Matrix 컬러링에 필요)

---

## 남은 작업 (다음 세션)

### 높은 우선순위
1. **중복 시뮬레이션 정리** - DB에 3개 중복 (id 1,2,3). sim_id=3이 완전 데이터
2. **Range 탭 핸드 매칭 개선** - DB의 canonical 표기법과 사용자 입력 매칭 (수트 그룹 무시 문제)

### 중간 우선순위
3. **핸드 카테고리 필터** - Premium, Broadway, Pairs 등 분류
4. **maxEV 컬럼** - 백엔드 API 수정 필요

### 낮은 우선순위
5. **반응형 디자인** - 모바일/태블릿 대응
6. **성능 최적화** - 16,432 핸드 로딩 시 가상 스크롤
7. **Train 모드** - PLO Trainer의 훈련 기능 (미래 계획)

---

## 파일 구조

```
frontend/src/
├── App.tsx                          # 메인 앱 (AppProvider + AppContent)
├── api/client.ts                    # API 클라이언트 (fetch wrapper)
├── constants/poker.ts               # 공유 상수 (RANKS, SUITS, ACTION_MAP 등)
├── context/AppContext.tsx            # 전역 상태 관리 (useReducer)
├── hooks/useStrategy.ts             # 커스텀 훅 (레거시, 일부 사용)
├── utils/rangeParser.ts             # Monker 표기법 파싱/검증
├── components/
│   ├── PositionActionBar.tsx         # 상단 포지션 액션 바
│   ├── PokerTable.tsx               # 포커 테이블 시각화
│   ├── layout/
│   │   ├── AppLayout.tsx            # 2컬럼 레이아웃
│   │   ├── LeftPanel.tsx            # 좌측 (테이블+전략)
│   │   └── RightPanel.tsx           # 우측 (Matrix/Range 탭)
│   ├── matrix/
│   │   ├── MatrixTab.tsx            # Matrix 컨테이너
│   │   ├── MatrixGrid.tsx           # 13x13 그리드
│   │   ├── SuitFilter.tsx           # 수트 필터 버튼
│   │   └── HandList.tsx             # 핸드 리스트 테이블
│   ├── range/
│   │   ├── RangeTab.tsx             # Range 탭 컨테이너
│   │   └── RangeInput.tsx           # 텍스트 입력
│   └── strategy/
│       └── EnhancedStrategyDisplay.tsx  # 전략 표시
│
│   # 레거시 (현재 미사용)
│   ├── CardSelector.tsx
│   ├── ActionTree.tsx
│   ├── StrategyDisplay.tsx
│   └── RangeView.tsx

backend/src/
├── index.ts                         # Express 서버
├── db/pool.ts                       # PostgreSQL 연결
├── db/queries.ts                    # DB 쿼리 (수정됨)
├── utils/hand.ts                    # Monker 표기법 유틸
├── routes/simulations.ts
├── routes/tree.ts
└── routes/strategy.ts               # 전략/레인지 API (수정됨)
```

## 실행 방법
```bash
# Backend (터미널 1)
cd backend && npm run dev

# Frontend (터미널 2)
cd frontend && npm run dev

# 브라우저: http://localhost:5173
```
