export interface HelpItem {
  id: string;
  titleKo: string;
  titleEn: string;
  briefKo: string;
  briefEn: string;
  detailedKo: string[];
  detailedEn: string[];
}

export const HELP_ITEMS: HelpItem[] = [
  {
    id: 'overview',
    titleKo: '개요',
    titleEn: 'Overview',
    briefKo: 'Tiny PLO Tools 소개 및 제공 도구 안내',
    briefEn: 'Introduction to Tiny PLO Tools and available tools',
    detailedKo: [
      'Tiny PLO Tools는 PLO(Pot-Limit Omaha) 포커 플레이어를 위한 분석 도구 모음입니다.',
      '현재 두 가지 도구를 제공합니다:',
      '• Preflop Solver — GTO 기반 프리플랍 전략 분석',
      '• Equity Calculator — PLO 핸드 에퀴티 계산기',
      '사이드바에서 원하는 도구를 선택하여 사용하세요.',
    ],
    detailedEn: [
      'Tiny PLO Tools is a collection of analysis tools for PLO (Pot-Limit Omaha) poker players.',
      'Currently two tools are available:',
      '• Preflop Solver — GTO-based preflop strategy analysis',
      '• Equity Calculator — PLO hand equity calculator',
      'Select a tool from the sidebar to get started.',
    ],
  },
  {
    id: 'preflop-solver',
    titleKo: 'Preflop Solver',
    titleEn: 'Preflop Solver',
    briefKo: 'GTO 기반 프리플랍 전략 분석',
    briefEn: 'GTO-based preflop strategy analysis',
    detailedKo: [
      '1. 시뮬레이션을 선택합니다 (예: 6max 50z 100bb).',
      '2. 포지션과 액션을 순서대로 탐색합니다 (UTG → BB).',
      '3. 매트릭스 탭에서 핸드별 전략(Fold/Call/Raise 비율)을 확인합니다.',
      '4. 레인지 탭에서 전체 레인지를 텍스트로 확인합니다.',
      '5. 매트릭스 셀 위에 마우스를 올리면 해당 핸드의 상세 정보가 왼쪽 패널에 표시됩니다.',
      '6. 액션 타임라인을 클릭하면 이전 노드로 이동할 수 있습니다.',
    ],
    detailedEn: [
      '1. Select a simulation (e.g., 6max 50z 100bb).',
      '2. Navigate positions and actions in order (UTG → BB).',
      '3. Check per-hand strategy (Fold/Call/Raise frequencies) in the Matrix tab.',
      '4. View the full range as text in the Range tab.',
      '5. Hover over matrix cells to see detailed hand info in the left panel.',
      '6. Click on the action timeline to jump to previous nodes.',
    ],
  },
  {
    id: 'equity-calc',
    titleKo: 'Equity Calculator',
    titleEn: 'Equity Calculator',
    briefKo: 'PLO 4/5/6 카드 핸드 에퀴티 계산',
    briefEn: 'PLO 4/5/6 card hand equity calculation',
    detailedKo: [
      '1. 게임 타입을 선택합니다 (PLO4 / PLO5 / PLO6).',
      '2. 각 플레이어의 핸드를 입력합니다.',
      '3. 보드 카드를 설정합니다 (플랍/턴/리버).',
      '4. 에퀴티가 자동으로 계산됩니다.',
      '5. 넥스트 카드 분석으로 다음 카드별 에퀴티 변화를 확인합니다.',
      '6. 시나리오 빌더로 여러 상황을 비교할 수 있습니다.',
    ],
    detailedEn: [
      '1. Select game type (PLO4 / PLO5 / PLO6).',
      '2. Enter each player\'s hand.',
      '3. Set board cards (flop / turn / river).',
      '4. Equity is calculated automatically.',
      '5. Use Next Card analysis to see equity changes per card.',
      '6. Use Scenario Builder to compare multiple situations.',
    ],
  },
  {
    id: 'quiz-mode',
    titleKo: '퀴즈 모드',
    titleEn: 'Quiz Mode',
    briefKo: 'GTO 전략을 퀴즈로 학습하고 실력을 측정합니다',
    briefEn: 'Learn GTO strategy through quizzes and measure your skills',
    detailedKo: [
      '1. 상단 탭에서 Quiz를 선택하여 시작합니다.',
      '2. 랜덤 핸드가 출제되면 Fold/Call/Raise 중 하나를 선택합니다.',
      '3. 피드백 5단계: Perfect(최적) → Correct(정답) → Inaccuracy(부정확) → Mistake(실수) → Blunder(대실수)',
      '4. 난이도 선택: 쉬움(전체) / 보통(순수 액션 제외) / 어려움(혼합 전략) / 매우 어려움(균등 선택지)',
      '5. EV Loss: 최적 대비 손실 (bb 단위). 낮을수록 좋습니다.',
      '6. 키보드 단축키: 1/2/3 = 액션 선택, Enter/Space = 다음 핸드',
    ],
    detailedEn: [
      '1. Select the Quiz tab at the top to start.',
      '2. A random hand is shown — choose Fold, Call, or Raise.',
      '3. Feedback tiers: Perfect → Correct → Inaccuracy → Mistake → Blunder',
      '4. Difficulty: Easy(all) / Normal(no pure actions) / Hard(mixed strategy) / Expert(near-equal choices)',
      '5. EV Loss: loss vs optimal play (in bb). Lower is better.',
      '6. Keyboard shortcuts: 1/2/3 = select action, Enter/Space = next hand',
    ],
  },
];

export type HelpLang = 'ko' | 'en';

const LANG_STORAGE_KEY = 'plo-help-lang';

export function getHelpLang(): HelpLang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === 'en' || stored === 'ko') return stored;
  } catch {
    // localStorage not available
  }
  return 'ko';
}

export function setHelpLang(lang: HelpLang): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // localStorage not available
  }
}
