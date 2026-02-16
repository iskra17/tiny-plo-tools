/* ═══ PLO Equity Calculator — I18N System ═══ */

import { createContext, useContext } from "react";
import type { Lang, Translations } from "./types.ts";

/** All translations keyed by language code */
export const translations: Record<Lang, Translations> = {
  ko: {
    header: { title: "PLO Equity Calculator", subtitle: "POT LIMIT OMAHA 4 \u00B7 5 \u00B7 6" },
    scenario: {
      title: "\uC2DC\uB098\uB9AC\uC624 \uBE4C\uB354", preset: "\uD504\uB9AC\uC14B", custom: "\uCEE4\uC2A4\uD140",
      apply: "\uC2DC\uB098\uB9AC\uC624 \uC801\uC6A9", close: "\uB2EB\uAE30", presetAndCustom: "\uD504\uB9AC\uC14B & \uCEE4\uC2A4\uD140",
      generating: "\uC0DD\uC131 \uC911...", generate: "\uC2DC\uB098\uB9AC\uC624 \uC0DD\uC131", reset: "\uCD08\uAE30\uD654",
      failRetry: "\uC0DD\uC131 \uC2E4\uD328. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.", failHard: "\uC774 \uC870\uD569\uC740 \uC0DD\uC131\uC774 \uC5B4\uB835\uC2B5\uB2C8\uB2E4.",
      selectAtLeast: "\uAC01 \uD50C\uB808\uC774\uC5B4\uB9C8\uB2E4 \uCD5C\uC18C 1\uAC1C \uC120\uD0DD", unselected: "\uBBF8\uC120\uD0DD",
    },
    settings: { gameType: "\uAC8C\uC784 \uD0C0\uC785", players: "\uD50C\uB808\uC774\uC5B4", simulation: "\uC2DC\uBBAC\uB808\uC774\uC158", preflop: "\uD504\uB9AC\uD50C\uB7AD" },
    board: {
      title: "\uBCF4\uB4DC", auto: "\uC790\uB3D9", inputPlaceholder: "\uC608: AhKdQc",
      input: "\uC785\uB825", select: "\uC120\uD0DD", close: "\uB2EB\uAE30",
      flop: "\uD50C\uB7CD", turn: "\uD134", river: "\uB9AC\uBC84", clear: "\u2715",
    },
    player: {
      title: "Player", inputPlaceholder4: "\uC608: AsKhQdJc", inputPlaceholder5: "\uC608: AsKhQdJcTh", inputPlaceholder6: "\uC608: AsKhQdJcTh9s",
      input: "\uC785\uB825", select: "\uC120\uD0DD", close: "\uB2EB\uAE30", clickToRemove: "\uD074\uB9AD\uD558\uC5EC \uC81C\uAC70",
    },
    results: {
      title: "\uACB0\uACFC", exact: "\uC815\uD655\uD55C \uACC4\uC0B0", win: "\uC2B9\uB9AC", tie: "\uD0C0\uC774", equity: "\uC5D0\uD038\uD2F0",
      totalExact: (n: string) => `\uC804\uCCB4 ${n}\uAC00\uC9C0 \u00B7 \uC815\uD655\uD55C \uACC4\uC0B0`,
      totalMC: (n: string) => `\uC2DC\uBBAC\uB808\uC774\uC158 ${n}\uD68C \u00B7 Monte Carlo`,
    },
    calc: {
      calculating: "\uACC4\uC0B0 \uC911...", exactCalc: "\uC815\uD655\uD55C \uACBD\uC6B0\uC758 \uC218 \uACC4\uC0B0 \uC911...", mcCalc: "Monte Carlo \uC2DC\uBBAC\uB808\uC774\uC158 \uC911...",
      recalc: "\uC7AC\uACC4\uC0B0", calcEquity: "\uC5D0\uD038\uD2F0 \uACC4\uC0B0", clearAll: "\uC804\uCCB4 \uCD08\uAE30\uD654",
    },
    nextCard: {
      title: (label: string) => `\uB2E4\uC74C ${label} \uCE74\uB4DC\uBCC4 \uC5D0\uD038\uD2F0`,
      chart: "\uCC28\uD2B8", grid: "\uADF8\uB9AC\uB4DC",
      sortBy: "\uC815\uB82C \uAE30\uC900", suit: "\uBB34\uB2AC", all: "\uC804\uCCB4", cards: "\uC7A5",
      best: "\uCD5C\uACE0", worst: "\uCD5C\uC800", avg: "\uD3C9\uADE0", favorable: "\uC720\uB9AC",
    },
    usage: {
      title: "\uC0AC\uC6A9\uBC95",
      scenario: "\uC2DC\uB098\uB9AC\uC624:", scenarioDesc: "\uD504\uB9AC\uC14B \uC120\uD0DD \uB610\uB294 \uCEE4\uC2A4\uD140 \uC870\uD569\uC73C\uB85C \uC790\uB3D9 \uB51C",
      input: "\uC785\uB825:", inputDesc: "AsKhQdJc \uD615\uC2DD \uD14D\uC2A4\uD2B8 \uB610\uB294 \uCE74\uB4DC \uC120\uD0DD UI",
      autoCalc: "\uC790\uB3D9 \uACC4\uC0B0:", autoCalcDesc: "\uBCF4\uB4DC 3\uC7A5+ & \uD578\uB4DC \uC644\uC131 \uC2DC \uC5D0\uD038\uD2F0 + \uB2E4\uC74C \uCE74\uB4DC \uBD84\uC11D \uC790\uB3D9 \uC2E4\uD589",
      cardClick: "\uCE74\uB4DC \uD074\uB9AD:", cardClickDesc: "\uD134/\uB9AC\uBC84 \uC5D0\uD038\uD2F0 \uB9AC\uC2A4\uD2B8\uC5D0\uC11C \uCE74\uB4DC \uD074\uB9AD\uD558\uBA74 \uBCF4\uB4DC\uC5D0 \uC790\uB3D9 \uCD94\uAC00",
      flopTurnRiver: "\uD50C\uB7CD/\uD134/\uB9AC\uBC84:", exactDesc: "\uC815\uD655\uD55C \uC804\uC218 \uACC4\uC0B0",
      preflopLabel: "\uD504\uB9AC\uD50C\uB7AD:", mcDesc: "Monte Carlo",
      notation: "\uD45C\uAE30:", notationDesc: "A K Q J T=10 \u00B7 s=\u2660 h=\u2665 d=\u2666 c=\u2663",
    },
    emptyState: "\uD50C\uB808\uC774\uC5B4 \uD578\uB4DC\uC640 \uBCF4\uB4DC\uB97C \uC124\uC815\uD558\uBA74\n\uC5D0\uD038\uD2F0 \uACC4\uC0B0 \uACB0\uACFC\uAC00 \uC5EC\uAE30\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4",
    suitNames: { s: "\uC2A4\uD398\uC774\uB4DC", h: "\uD558\uD2B8", d: "\uB2E4\uC774\uC544", c: "\uD074\uB85C\uBC84" },
    categories: { madeHands: "\uBA54\uC774\uB4DC \uD578\uB4DC", draws: "\uB4DC\uB85C\uC6B0", others: "\uAE30\uD0C0" },
    hands: {
      top_pair: "\uD0D1\uD398\uC5B4", middle_pair: "\uBBF8\uB4E4\uD398\uC5B4", bottom_pair: "\uBC14\uD140\uD398\uC5B4", overpair: "\uC624\uBC84\uD398\uC5B4",
      trips: "\uD2B8\uB9BD\uC2A4", top_set: "\uD0D1\uC14B", middle_set: "\uBBF8\uB4E4\uC14B", bottom_set: "\uBC14\uD140\uC14B",
      set: "\uC14B", two_pair: "\uD22C\uD398\uC5B4", straight: "\uC2A4\uD2B8\uB808\uC774\uD2B8",
      flush: "\uD50C\uB7EC\uC2DC", full_house: "\uD480\uD558\uC6B0\uC2A4", quads: "\uCFFC\uB4DC", nut_flush: "\uB11B\uD50C\uB7EC\uC2DC",
      oesd: "OESD", gutshot: "\uAC70\uD130", flush_draw: "FD", nut_flush_draw: "NFD",
      wrap: "\uB7A9", combo_draw: "\uCF64\uBCF4\uB4DC\uB85C\uC6B0",
      overcards: "\uC624\uBC84\uCE74\uB4DC", backdoor_sd: "\uBC31\uB3C4\uC5B4 SD", backdoor_fd: "\uBC31\uB3C4\uC5B4 FD",
      blocker: "NF \uBE14\uB85C\uCEE4", air: "Air",
    },
  },
  en: {
    header: { title: "PLO Equity Calculator", subtitle: "POT LIMIT OMAHA 4 \u00B7 5 \u00B7 6" },
    scenario: {
      title: "Scenario Builder", preset: "Preset", custom: "Custom",
      apply: "Apply Scenario", close: "Close", presetAndCustom: "Preset & Custom",
      generating: "Generating...", generate: "Generate Scenario", reset: "Reset",
      failRetry: "Generation failed. Please try again.", failHard: "This combination is difficult to generate.",
      selectAtLeast: "Select at least 1 for each player", unselected: "None",
    },
    settings: { gameType: "Game Type", players: "Players", simulation: "Simulation", preflop: "Preflop" },
    board: {
      title: "Board", auto: "Auto", inputPlaceholder: "e.g. AhKdQc",
      input: "Input", select: "Select", close: "Close",
      flop: "Flop", turn: "Turn", river: "River", clear: "\u2715",
    },
    player: {
      title: "Player", inputPlaceholder4: "e.g. AsKhQdJc", inputPlaceholder5: "e.g. AsKhQdJcTh", inputPlaceholder6: "e.g. AsKhQdJcTh9s",
      input: "Input", select: "Select", close: "Close", clickToRemove: "Click to remove",
    },
    results: {
      title: "Results", exact: "Exact Calculation", win: "Win", tie: "Tie", equity: "Equity",
      totalExact: (n: string) => `Total ${n} cases \u00B7 Exact calculation`,
      totalMC: (n: string) => `${n} simulations \u00B7 Monte Carlo`,
    },
    calc: {
      calculating: "Calculating...", exactCalc: "Calculating exact cases...", mcCalc: "Running Monte Carlo simulation...",
      recalc: "Recalculate", calcEquity: "Calculate Equity", clearAll: "Clear All",
    },
    nextCard: {
      title: (label: string) => `Next ${label} Card Equity`,
      chart: "Chart", grid: "Grid",
      sortBy: "Sort by", suit: "Suit", all: "All", cards: "cards",
      best: "Best", worst: "Worst", avg: "Avg", favorable: "Favorable",
    },
    usage: {
      title: "Usage",
      scenario: "Scenario:", scenarioDesc: "Auto-deal with preset or custom combinations",
      input: "Input:", inputDesc: "Text format AsKhQdJc or card picker UI",
      autoCalc: "Auto Calc:", autoCalcDesc: "Auto equity + next card analysis when board 3+ & hands complete",
      cardClick: "Card Click:", cardClickDesc: "Click cards in turn/river equity list to add to board",
      flopTurnRiver: "Flop/Turn/River:", exactDesc: "Exact enumeration",
      preflopLabel: "Preflop:", mcDesc: "Monte Carlo",
      notation: "Notation:", notationDesc: "A K Q J T=10 \u00B7 s=\u2660 h=\u2665 d=\u2666 c=\u2663",
    },
    emptyState: "Set player hands and board to see\nequity calculation results here",
    suitNames: { s: "Spades", h: "Hearts", d: "Diamonds", c: "Clubs" },
    categories: { madeHands: "Made Hands", draws: "Draws", others: "Others" },
    hands: {
      top_pair: "Top Pair", middle_pair: "Middle Pair", bottom_pair: "Bottom Pair", overpair: "Overpair",
      trips: "Trips", top_set: "Top Set", middle_set: "Middle Set", bottom_set: "Bottom Set",
      set: "Set", two_pair: "Two Pair", straight: "Straight",
      flush: "Flush", full_house: "Full House", quads: "Quads", nut_flush: "Nut Flush",
      oesd: "OESD", gutshot: "Gutshot", flush_draw: "FD", nut_flush_draw: "NFD",
      wrap: "Wrap", combo_draw: "Combo Draw",
      overcards: "Overcards", backdoor_sd: "Backdoor SD", backdoor_fd: "Backdoor FD",
      blocker: "NF Blocker", air: "Air",
    },
  },
};

/** React context for current language */
export const LangContext = createContext<Lang>("ko");

/** Hook to get current translations object */
export function useT(): Translations {
  const lang = useContext(LangContext);
  return translations[lang];
}

/** Hook to get current language code */
export function useLang(): Lang {
  return useContext(LangContext);
}
