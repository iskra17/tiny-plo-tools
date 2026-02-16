/* ═══ PLO Equity Calculator — Next Card Analysis ═══ */

import type { CardStr, NextCardResult } from "../types.ts";
import { FD } from "./deck.ts";
import { evBoard } from "./poker.ts";

/**
 * Calculate equities for each possible next card.
 * Used when board has 3 or 4 cards to show turn/river equity by card.
 * Performs exact enumeration for each candidate card.
 */
export function calcNextCardEquities(players: CardStr[][], board: CardStr[]): NextCardResult[] {
  const used = new Set<string>();
  for (const p of players) for (const c of p) used.add(c);
  for (const c of board) used.add(c);
  const remaining = FD.filter(c => !used.has(c));
  const results: NextCardResult[] = [];

  for (const card of remaining) {
    const newBoard = [...board, card];
    const need = 5 - newBoard.length;
    const rem2 = remaining.filter(c => c !== card);
    const wins = new Array(players.length).fill(0) as number[];
    const ties = new Array(players.length).fill(0) as number[];
    let total = 0;

    if (need === 0) {
      const { bi, ti } = evBoard(players, newBoard);
      if (ti.length === 1) wins[bi]++;
      else for (const x of ti) ties[x]++;
      total = 1;
    } else if (need === 1) {
      for (let i = 0; i < rem2.length; i++) {
        const { bi, ti } = evBoard(players, [...newBoard, rem2[i]]);
        if (ti.length === 1) wins[bi]++;
        else for (const x of ti) ties[x]++;
        total++;
      }
    } else if (need === 2) {
      for (let i = 0; i < rem2.length - 1; i++) {
        for (let j = i + 1; j < rem2.length; j++) {
          const { bi, ti } = evBoard(players, [...newBoard, rem2[i], rem2[j]]);
          if (ti.length === 1) wins[bi]++;
          else for (const x of ti) ties[x]++;
          total++;
        }
      }
    }

    const equities = players.map((_, i) => +((wins[i] + ties[i] / 2) / total * 100).toFixed(1));
    results.push({ card, equities });
  }

  return results;
}
