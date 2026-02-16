/* ═══ PLO Equity Calculator — Constants ═══ */

import type { Suit, Rank, HandOptionId, MadeHandOption, HandOption, PresetScenario } from "./types.ts";

/** All four suits */
export const SUITS: Suit[] = ["s", "h", "d", "c"];

/** All thirteen ranks, high to low */
export const RANKS: Rank[] = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

/** Suit symbols for display */
export const SS: Record<Suit, string> = { s: "\u2660", h: "\u2665", d: "\u2666", c: "\u2663" };

/** Suit colors for card display */
export const SC: Record<Suit, string> = { s: "#1a1a2e", h: "#c0392b", d: "#2980b9", c: "#27ae60" };

/** Suit background colors */
export const SBG: Record<Suit, string> = { s: "#e8e8f0", h: "#fde8e8", d: "#e8f0fd", c: "#e8fde8" };

/** Rank to numeric value mapping (Ace=14) */
export const RV: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11, T: 10,
  9: 9, 8: 8, 7: 7, 6: 6, 5: 5, 4: 4, 3: 3, 2: 2,
};

/** Numeric value to rank mapping (inverse of RV) */
export const VR: Record<number, string> = {};
for (const [k, v] of Object.entries(RV)) {
  VR[v] = k;
}

/** Player colors (up to 6 players) */
export const PC: string[] = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c"];

/* ═══ Scenario Builder Constants ═══ */

/** Made hand options with categories */
export const MADE_HANDS: MadeHandOption[] = [
  { id: "top_pair", cat: "pair" }, { id: "middle_pair", cat: "pair" },
  { id: "bottom_pair", cat: "pair" }, { id: "overpair", cat: "pair" },
  { id: "trips", cat: "trips" },
  { id: "top_set", cat: "set" }, { id: "middle_set", cat: "set" }, { id: "bottom_set", cat: "set" },
  { id: "two_pair", cat: "twopair" },
  { id: "straight", cat: "straight" },
  { id: "flush", cat: "flush" },
  { id: "full_house", cat: "fullhouse" },
  { id: "quads", cat: "quads" },
  { id: "nut_flush", cat: "nutflush" },
];

/** Draw options */
export const DRAWS: HandOption[] = [
  { id: "oesd" }, { id: "gutshot" }, { id: "flush_draw" }, { id: "nut_flush_draw" },
  { id: "wrap" }, { id: "combo_draw" },
];

/** Extra/other options */
export const EXTRAS: HandOption[] = [
  { id: "overcards" }, { id: "backdoor_sd" }, { id: "backdoor_fd" }, { id: "blocker" }, { id: "air" },
];

/** All hand options combined */
export const ALL_OPTIONS: (MadeHandOption | HandOption)[] = [...MADE_HANDS, ...DRAWS, ...EXTRAS];

/** Hand strength ranking for hierarchy (higher = stronger, follows poker rank) */
export const MADE_STRENGTH: Partial<Record<HandOptionId, number>> = {
  bottom_pair: 1, middle_pair: 1, top_pair: 1, overpair: 1,
  two_pair: 2,
  trips: 3, bottom_set: 3, middle_set: 3, top_set: 3,
  straight: 4,
  flush: 5, nut_flush: 5,
  full_house: 6,
  quads: 7,
};

/** What rank a draw produces if completed */
export const DRAW_PRODUCES: Partial<Record<HandOptionId, number>> = {
  gutshot: 4, oesd: 4, wrap: 4,
  flush_draw: 5, nut_flush_draw: 5,
  combo_draw: 5,
};

/** Set of made hand IDs */
export const MADE_IDS: Set<string> = new Set(Object.keys(MADE_STRENGTH));

/** Set of draw IDs */
export const DRAW_IDS: Set<string> = new Set(Object.keys(DRAW_PRODUCES));

/** Preset scenarios for scenario builder */
export const PRESETS: PresetScenario[] = [
  { id: "set_vs_nfd", p1: ["top_set"], p2: ["nut_flush_draw"] },
  { id: "2p_vs_fd_overpair", p1: ["two_pair"], p2: ["flush_draw", "overpair"] },
  { id: "nfd_vs_pair_gut", p1: ["nut_flush_draw"], p2: ["top_pair", "gutshot"] },
  { id: "topset_vs_wrap", p1: ["top_set"], p2: ["wrap"] },
  { id: "topset_vs_combo", p1: ["top_set"], p2: ["combo_draw"] },
  { id: "overpair_vs_nfd_oesd", p1: ["overpair"], p2: ["nut_flush_draw", "oesd"] },
  { id: "2p_vs_nfd", p1: ["two_pair"], p2: ["nut_flush_draw"] },
  { id: "straight_vs_set_fd", p1: ["straight"], p2: ["top_set", "flush_draw"] },
];

/** Preset scenario display names per language */
export const PRESET_NAMES: Record<string, Record<string, string>> = {
  ko: {
    set_vs_nfd: "\uD0D1\uC14B vs NFD",
    "2p_vs_fd_overpair": "\uD22C\uD398\uC5B4 vs FD+\uC624\uBC84\uD398\uC5B4",
    nfd_vs_pair_gut: "NFD vs \uD0D1\uD398\uC5B4+\uAC70\uD130",
    topset_vs_wrap: "\uD0D1\uC14B vs \uB7A9",
    topset_vs_combo: "\uD0D1\uC14B vs \uCF64\uBCF4\uB4DC\uB85C\uC6B0",
    overpair_vs_nfd_oesd: "\uC624\uBC84\uD398\uC5B4 vs NFD+OESD",
    "2p_vs_nfd": "\uD22C\uD398\uC5B4 vs NFD",
    straight_vs_set_fd: "\uC2A4\uD2B8\uB808\uC774\uD2B8 vs \uD0D1\uC14B+FD",
  },
  en: {
    set_vs_nfd: "Top Set vs NFD",
    "2p_vs_fd_overpair": "Two Pair vs FD+Overpair",
    nfd_vs_pair_gut: "NFD vs Top Pair+Gutshot",
    topset_vs_wrap: "Top Set vs Wrap",
    topset_vs_combo: "Top Set vs Combo Draw",
    overpair_vs_nfd_oesd: "Overpair vs NFD+OESD",
    "2p_vs_nfd": "Two Pair vs NFD",
    straight_vs_set_fd: "Straight vs Top Set+FD",
  },
};
