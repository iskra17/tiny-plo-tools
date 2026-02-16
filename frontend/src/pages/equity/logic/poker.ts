/* ═══ PLO Equity Calculator — Core Poker Logic ═══ */

import type { CardStr, HandEval, BoardEvalResult, PlayerResult } from "../types.ts";
import { RV } from "../constants.ts";
import { FD, shuf } from "./deck.ts";

/**
 * Generate all combinations of size k from array a.
 * combo([1,2,3], 2) => [[1,2],[1,3],[2,3]]
 */
export function combo<T>(a: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (a.length < k) return [];
  const r: T[][] = [];
  for (let i = 0; i <= a.length - k; i++) {
    const rest = combo(a.slice(i + 1), k - 1);
    for (const c of rest) r.push([a[i], ...c]);
  }
  return r;
}

/**
 * Evaluate a 5-card poker hand.
 * Returns hand rank (0=high card ... 8=straight flush), high value, and kickers.
 */
export function ev5(cards: CardStr[]): HandEval {
  const vals = cards.map(c => RV[c[0]]).sort((a, b) => b - a);
  const suits = cards.map(c => c[1]);
  const fl = suits.every(s => s === suits[0]);
  let st = false, sh = 0;
  const u = [...new Set(vals)].sort((a, b) => b - a);
  if (u.length >= 5) {
    for (let i = 0; i <= u.length - 5; i++) {
      if (u[i] - u[i + 4] === 4) { st = true; sh = u[i]; break; }
    }
    if (!st && u.includes(14) && u.includes(5) && u.includes(4) && u.includes(3) && u.includes(2)) {
      st = true; sh = 5;
    }
  }
  const cn: Record<number, number> = {};
  for (const v of vals) cn[v] = (cn[v] || 0) + 1;
  const g = Object.entries(cn).map(([v, c]) => ({ v: +v, c })).sort((a, b) => b.c - a.c || b.v - a.v);
  const p = g.map(x => x.c).join("");
  if (fl && st) return { r: 8, h: sh, k: [] };
  if (p[0] === "4") return { r: 7, h: g[0].v, k: [g[1].v] };
  if (p === "32") return { r: 6, h: g[0].v, k: [g[1].v] };
  if (fl) return { r: 5, h: 0, k: vals };
  if (st) return { r: 4, h: sh, k: [] };
  if (p[0] === "3") return { r: 3, h: g[0].v, k: g.slice(1).map(x => x.v) };
  if (p.startsWith("22")) return { r: 2, h: g[0].v, k: [g[1].v, g[2].v] };
  if (p[0] === "2") return { r: 1, h: g[0].v, k: g.slice(1).map(x => x.v) };
  return { r: 0, h: 0, k: vals };
}

/**
 * Compare two hand evaluations. Returns positive if a > b, negative if a < b, 0 if equal.
 */
export function hcmp(a: HandEval, b: HandEval): number {
  if (a.r !== b.r) return a.r - b.r;
  if (a.h !== b.h) return a.h - b.h;
  for (let i = 0; i < Math.min(a.k.length, b.k.length); i++) {
    if (a.k[i] !== b.k[i]) return a.k[i] - b.k[i];
  }
  return 0;
}

/**
 * Find the best Omaha hand: pick 2 from hole cards + 3 from board.
 */
export function bestO(hole: CardStr[], board: CardStr[]): HandEval | null {
  const hc = combo(hole, 2);
  const bc = combo(board, 3);
  let best: HandEval | null = null;
  for (const h of hc) {
    for (const b of bc) {
      const e = ev5([...h, ...b]);
      if (!best || hcmp(e, best) > 0) best = e;
    }
  }
  return best;
}

/**
 * Evaluate a complete board for all players. Returns winner index and tied indices.
 */
export function evBoard(players: CardStr[][], board: CardStr[]): BoardEvalResult {
  const hands = players.map(p => bestO(p, board)!);
  let bi = 0;
  let ti = [0];
  for (let i = 1; i < hands.length; i++) {
    const c = hcmp(hands[i], hands[bi]);
    if (c > 0) { bi = i; ti = [i]; }
    else if (c === 0) ti.push(i);
  }
  return { bi, ti };
}

/**
 * Main equity calculation engine.
 * Handles exact enumeration (0-2 cards remaining) and Monte Carlo (3+ cards remaining).
 */
export function runCalc(players: CardStr[][], board: CardStr[], simCount: number): PlayerResult[] {
  const used = new Set<string>();
  for (const p of players) for (const c of p) used.add(c);
  for (const c of board) used.add(c);
  const rem = FD.filter(c => !used.has(c));
  const need = 5 - board.length;
  const wins = new Array(players.length).fill(0) as number[];
  const ties = new Array(players.length).fill(0) as number[];
  let total = 0;

  if (need === 0) {
    const { bi, ti } = evBoard(players, board);
    if (ti.length === 1) wins[bi]++;
    else for (const i of ti) ties[i]++;
    total = 1;
  } else if (need === 1) {
    for (let i = 0; i < rem.length; i++) {
      const { bi, ti } = evBoard(players, [...board, rem[i]]);
      if (ti.length === 1) wins[bi]++;
      else for (const x of ti) ties[x]++;
      total++;
    }
  } else if (need === 2) {
    for (let i = 0; i < rem.length - 1; i++) {
      for (let j = i + 1; j < rem.length; j++) {
        const { bi, ti } = evBoard(players, [...board, rem[i], rem[j]]);
        if (ti.length === 1) wins[bi]++;
        else for (const x of ti) ties[x]++;
        total++;
      }
    }
  } else {
    for (let s = 0; s < simCount; s++) {
      const sh = shuf(rem);
      const { bi, ti } = evBoard(players, [...board, ...sh.slice(0, need)]);
      if (ti.length === 1) wins[bi]++;
      else for (const x of ti) ties[x]++;
      total++;
    }
  }

  const method: "exact" | "montecarlo" = need <= 2 ? "exact" : "montecarlo";
  return players.map((_, i) => ({
    win: ((wins[i] / total) * 100).toFixed(2),
    tie: ((ties[i] / total) * 100).toFixed(2),
    equity: (((wins[i] + ties[i] / 2) / total) * 100).toFixed(2),
    total,
    method,
  }));
}
