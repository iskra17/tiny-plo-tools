/* ═══ PLO Equity Calculator — Hand Analysis ═══ */

import type { CardStr, Lang } from "../types.ts";
import { SUITS, RV } from "../constants.ts";
import { translations } from "../i18n.ts";
import { FD } from "./deck.ts";
import { combo, bestO } from "./poker.ts";

/**
 * Check if any combination of 2 hole cards + 3 board cards makes a straight.
 */
function anyStraight(hole: CardStr[], board: CardStr[]): boolean {
  const hc = combo(hole, 2);
  const bc = combo(board, 3);
  for (const h of hc) {
    for (const b of bc) {
      const vals = [...h, ...b].map(c => RV[c[0]]);
      const u = [...new Set(vals)].sort((a, b) => b - a);
      if (u.length >= 5) {
        for (let i = 0; i <= u.length - 5; i++) {
          if (u[i] - u[i + 4] === 4) return true;
        }
        if (u.includes(14) && u.includes(5) && u.includes(4) && u.includes(3) && u.includes(2)) return true;
      }
    }
  }
  return false;
}

/**
 * Analyze a player's hand on the given board.
 * Returns a string describing the hand strength (e.g. "Top Set+NFD").
 * Returns empty string if cards are insufficient.
 */
export function analyzeHand(playerCards: CardStr[], boardCards: CardStr[], lang: Lang): string {
  if (!playerCards || playerCards.length < 2 || !boardCards || boardCards.length < 3) return "";
  const t = translations[lang];
  const parts: string[] = [];
  const best = bestO(playerCards, boardCards);
  if (!best) return "";
  const boardVals = boardCards.map(c => RV[c[0]]).sort((a, b) => b - a);

  // Made hand
  if (best.r >= 7) parts.push(t.hands.quads);
  else if (best.r === 6) parts.push(t.hands.full_house);
  else if (best.r === 5) {
    let isNut = false;
    for (const suit of SUITS) {
      const hs = playerCards.filter(c => c[1] === suit);
      const bs = boardCards.filter(c => c[1] === suit);
      if (hs.length >= 2 && bs.length >= 3 && hs.some(c => c[0] === "A")) { isNut = true; break; }
    }
    parts.push(isNut ? t.hands.nut_flush : t.hands.flush);
  }
  else if (best.r === 4) parts.push(t.hands.straight);
  else if (best.r === 3) {
    const tv = best.h;
    const pih = playerCards.filter(c => RV[c[0]] === tv).length >= 2;
    if (pih) {
      if (tv === boardVals[0]) parts.push(t.hands.top_set);
      else if (tv === boardVals[Math.min(1, boardVals.length - 1)]) parts.push(t.hands.middle_set);
      else parts.push(t.hands.bottom_set);
    } else parts.push(t.hands.trips);
  }
  else if (best.r === 2) parts.push(t.hands.two_pair);
  else if (best.r === 1) {
    const pv = best.h;
    if (pv > boardVals[0]) parts.push(t.hands.overpair);
    else if (pv === boardVals[0]) parts.push(t.hands.top_pair);
    else if (boardVals.length > 1 && pv === boardVals[1]) parts.push(t.hands.middle_pair);
    else if (boardVals.includes(pv)) parts.push(t.hands.bottom_pair);
  }

  // Draws (flop/turn only) - only show draws that produce a HIGHER hand
  if (boardCards.length <= 4) {
    // Flush draw: only if current best < flush (r<5)
    if (best.r < 5) {
      for (const suit of SUITS) {
        const hs = playerCards.filter(c => c[1] === suit).length;
        const bs = boardCards.filter(c => c[1] === suit).length;
        if (hs >= 2 && bs === 2) {
          parts.push(playerCards.some(c => c[0] === "A" && c[1] === suit) ? t.hands.nut_flush_draw : t.hands.flush_draw);
          break;
        }
      }
    }
    // Straight draw: only if current best < straight (r<4)
    if (best.r < 4) {
      const used = new Set<string>([...playerCards, ...boardCards]);
      const rem = FD.filter(c => !used.has(c));
      let outs = 0;
      for (const card of rem) {
        const nb = [...boardCards, card];
        if (nb.length > 5) continue;
        if (anyStraight(playerCards, nb)) outs++;
      }
      if (outs >= 9) parts.push(t.hands.wrap);
      else if (outs >= 6) parts.push(t.hands.oesd);
      else if (outs >= 3) parts.push(t.hands.gutshot);
    }
  }

  return parts.join("+");
}
