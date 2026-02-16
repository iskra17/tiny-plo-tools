/* ═══ PLO Equity Calculator — Type Definitions ═══ */

/** Single card string, e.g. "As", "Kh", "Td" */
export type CardStr = string;

/** Suit character: s=spade, h=heart, d=diamond, c=club */
export type Suit = "s" | "h" | "d" | "c";

/** Rank character: A,K,Q,J,T,9,8,7,6,5,4,3,2 */
export type Rank = "A" | "K" | "Q" | "J" | "T" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";

/** Numeric rank value (2-14, Ace=14) */
export type RankValue = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

/** Game type: PLO4, PLO5, PLO6 */
export type GameType = 4 | 5 | 6;

/** Hand evaluation result from ev5() */
export interface HandEval {
  /** Hand rank: 0=high, 1=pair, 2=2pair, 3=trips, 4=straight, 5=flush, 6=full house, 7=quads, 8=straight flush */
  r: number;
  /** High card value for the rank category */
  h: number;
  /** Kicker values for tiebreaking */
  k: number[];
}

/** Board evaluation result from evBoard() */
export interface BoardEvalResult {
  /** Best (winning) player index */
  bi: number;
  /** Tied player indices (includes winner if no tie; all tied if tie) */
  ti: number[];
}

/** Single player result from runCalc() */
export interface PlayerResult {
  /** Win percentage string, e.g. "45.23" */
  win: string;
  /** Tie percentage string */
  tie: string;
  /** Equity percentage string (win + tie/2) */
  equity: string;
  /** Total number of evaluations */
  total: number;
  /** Calculation method used */
  method: "exact" | "montecarlo";
}

/** Next card equity result for a single card */
export interface NextCardResult {
  /** The card being evaluated */
  card: CardStr;
  /** Equity percentages for each player */
  equities: number[];
}

/** Scenario generation result */
export interface ScenarioResult {
  /** Board cards (3 cards for flop) */
  board: CardStr[];
  /** Player hole cards */
  players: CardStr[][];
}

/** Hand option ID used in scenario builder */
export type HandOptionId =
  | "top_pair" | "middle_pair" | "bottom_pair" | "overpair"
  | "trips" | "top_set" | "middle_set" | "bottom_set"
  | "two_pair" | "straight" | "flush" | "full_house" | "quads" | "nut_flush"
  | "oesd" | "gutshot" | "flush_draw" | "nut_flush_draw"
  | "wrap" | "combo_draw"
  | "overcards" | "backdoor_sd" | "backdoor_fd" | "blocker" | "air";

/** Hand option with category info (for made hands) */
export interface MadeHandOption {
  id: HandOptionId;
  cat: string;
}

/** Hand option without category (for draws/extras) */
export interface HandOption {
  id: HandOptionId;
}

/** Preset scenario definition */
export interface PresetScenario {
  id: string;
  p1: HandOptionId[];
  p2: HandOptionId[];
}

/** Language code */
export type Lang = "ko" | "en";

/** Translation function type for strings with parameters */
export type TranslationFn = (n: string) => string;
export type TranslationLabelFn = (label: string) => string;

/** Translation object shape */
export interface Translations {
  header: { title: string; subtitle: string };
  scenario: {
    title: string; preset: string; custom: string;
    apply: string; close: string; presetAndCustom: string;
    generating: string; generate: string; reset: string;
    failRetry: string; failHard: string;
    selectAtLeast: string; unselected: string;
  };
  settings: { gameType: string; players: string; simulation: string; preflop: string };
  board: {
    title: string; auto: string; inputPlaceholder: string;
    input: string; select: string; close: string;
    flop: string; turn: string; river: string; clear: string;
  };
  player: {
    title: string; inputPlaceholder4: string; inputPlaceholder5: string; inputPlaceholder6: string;
    input: string; select: string; close: string; clickToRemove: string;
  };
  results: {
    title: string; exact: string; win: string; tie: string; equity: string;
    totalExact: (n: string) => string;
    totalMC: (n: string) => string;
  };
  calc: {
    calculating: string; exactCalc: string; mcCalc: string;
    recalc: string; calcEquity: string; clearAll: string;
  };
  nextCard: {
    title: (label: string) => string;
    chart: string; grid: string;
    sortBy: string; suit: string; all: string; cards: string;
    best: string; worst: string; avg: string; favorable: string;
  };
  usage: {
    title: string;
    scenario: string; scenarioDesc: string;
    input: string; inputDesc: string;
    autoCalc: string; autoCalcDesc: string;
    cardClick: string; cardClickDesc: string;
    flopTurnRiver: string; exactDesc: string;
    preflopLabel: string; mcDesc: string;
    notation: string; notationDesc: string;
  };
  emptyState: string;
  suitNames: Record<Suit, string>;
  categories: { madeHands: string; draws: string; others: string };
  hands: Record<string, string>;
}
