/* ═══ PLO Equity Calculator — Deck Utilities ═══ */

import type { CardStr } from "../types.ts";
import { RANKS, SUITS } from "../constants.ts";

/**
 * Build a full 52-card deck.
 * Each card is a 2-char string: rank + suit (e.g. "As", "Kh").
 */
export function buildDeck(): CardStr[] {
  const d: CardStr[] = [];
  for (const r of RANKS) for (const s of SUITS) d.push(r + s);
  return d;
}

/** Pre-built full deck (52 cards). Used as reference throughout the app. */
export const FD: CardStr[] = buildDeck();

/**
 * Fisher-Yates shuffle. Returns a new shuffled copy of the array.
 */
export function shuf<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/**
 * Parse a text string into an array of card strings.
 * Handles formats like "AsKhQdJc", "AhKd Qc", etc.
 * "10" is converted to "T" before parsing.
 */
export function parseText(text: string): CardStr[] {
  const t = text.trim().toUpperCase().replace(/10/g, "T");
  const cards: CardStr[] = [];
  let i = 0;
  while (i < t.length) {
    if (i + 1 < t.length) {
      const r = t[i];
      const s = t[i + 1].toLowerCase();
      if ((RANKS as readonly string[]).includes(r) && (SUITS as readonly string[]).includes(s)) {
        cards.push(r + s);
        i += 2;
        continue;
      }
    }
    i++;
  }
  return cards;
}
