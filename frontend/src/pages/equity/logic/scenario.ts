/* ═══ PLO Equity Calculator — Scenario Builder Logic ═══ */

import type { CardStr, HandOptionId, ScenarioResult } from "../types.ts";
import { SUITS, RV, VR } from "../constants.ts";
import { FD, shuf } from "./deck.ts";
import { bestO } from "./poker.ts";

/**
 * Generate a scenario matching the requested hand types for 2 players.
 * Tries up to 200 attempts to find a valid deal.
 * Returns null if generation fails.
 */
export function generateScenario(p1o: HandOptionId[], p2o: HandOptionId[], gt: number = 4): ScenarioResult | null {
  for (let a = 0; a < 200; a++) {
    const r = tryGen(p1o, p2o, gt);
    if (r) return r;
  }
  return null;
}

function tryGen(p1o: HandOptionId[], p2o: HandOptionId[], gt: number): ScenarioResult | null {
  const as = shuf([...SUITS]);
  const fs = as[0], ns = as[1], ts = as[2];
  const allOpts = [...p1o, ...p2o];
  const needsFlush = allOpts.some(o => (["flush", "nut_flush", "flush_draw", "nut_flush_draw", "combo_draw"] as string[]).includes(o));
  const needsPaired = allOpts.some(o => (["trips", "full_house"] as string[]).includes(o));
  const needsConn = allOpts.some(o => (["straight", "oesd", "wrap", "gutshot", "combo_draw"] as string[]).includes(o));
  const mid = [7, 8, 9, 10, 11], hi = [10, 11, 12, 13];
  let br: number[];
  if (needsConn) {
    const sv = mid[Math.floor(Math.random() * mid.length)];
    br = allOpts.includes("straight") ? [sv, sv - 1, sv - 2] : [sv, sv - 1, sv - 3];
  } else {
    const pool = shuf([...hi, ...mid]);
    br = [pool[0], pool[1], pool[2]];
  }
  br = [...new Set(br)].slice(0, 3);
  while (br.length < 3) {
    const r = Math.floor(Math.random() * 9) + 4;
    if (!br.includes(r)) br.push(r);
  }
  br.sort((a, b) => b - a);
  if (needsPaired) br[2] = br[0];
  let bs: string[];
  if (needsFlush) {
    const madeFlush = allOpts.some(o => (["flush", "nut_flush"] as string[]).includes(o));
    bs = madeFlush ? [fs, fs, fs] : [fs, fs, ns];
  } else {
    bs = shuf([fs, ns, ts]);
  }
  const board = br.map((r, i) => VR[r] + bs[i]);
  if (new Set(board).size !== 3) return null;
  const used = new Set(board);
  const p1c = genHole(p1o, board, br, bs, fs, used, gt);
  if (!p1c) return null;
  for (const c of p1c) used.add(c);
  const p2c = genHole(p2o, board, br, bs, fs, used, gt);
  if (!p2c) return null;

  // Validate: check that generated hands match requested scenarios exactly
  if (!validateScenario(p1o, p1c, board, br, bs, fs) || !validateScenario(p2o, p2c, board, br, bs, fs)) {
    return null;
  }

  return { board, players: [p1c, p2c] };
}

function validateScenario(opts: HandOptionId[], holeCards: CardStr[], board: CardStr[], br: number[], bs: string[], fs: string): boolean {
  const holeVals = holeCards.map(c => RV[c[0]]);
  const boardVals = board.map(c => RV[c[0]]);

  for (const opt of opts) {
    switch (opt) {
      case "flush_draw": {
        const flushSuitOnBoard = bs.filter(s => s === fs).length;
        if (flushSuitOnBoard < 2) return false;
        const holeFsCards = holeCards.filter(c => c[1] === fs);
        if (holeFsCards.length < 1) return false;
        if (holeFsCards.some(c => c[0] === "A")) return false;
        break;
      }
      case "nut_flush_draw": {
        const flushSuitOnBoard = bs.filter(s => s === fs).length;
        if (flushSuitOnBoard < 2) return false;
        if (!holeCards.some(c => c[1] === fs && c[0] === "A")) return false;
        if (flushSuitOnBoard >= 3) return false;
        break;
      }
      case "top_pair": {
        const topCard = br[0];
        if (!holeVals.includes(topCard)) return false;
        if (holeVals.filter(v => v === topCard).length >= 2) return false;
        if (holeVals.some(v => v !== topCard && boardVals.includes(v))) return false;
        break;
      }
      case "two_pair": {
        const paired = boardVals.filter(v => holeVals.includes(v));
        const uniquePaired = [...new Set(paired)];
        if (uniquePaired.length < 2) return false;
        break;
      }
      case "set":
      case "top_set":
      case "middle_set":
      case "bottom_set": {
        const targetIdx = opt === "top_set" ? 0 : opt === "middle_set" ? 1 : opt === "bottom_set" ? 2 : 0;
        const targetVal = br[targetIdx];
        if (holeVals.filter(v => v === targetVal).length < 2) return false;
        break;
      }
      case "straight": {
        const best = bestO(holeCards, board);
        if (!best || best.r !== 4) return false;
        break;
      }
      case "flush": {
        const best = bestO(holeCards, board);
        if (!best || best.r !== 5) return false;
        const holeFsCards = holeCards.filter(c => c[1] === fs);
        if (holeFsCards.some(c => c[0] === "A")) return false;
        break;
      }
      case "nut_flush": {
        const best = bestO(holeCards, board);
        if (!best || best.r < 5) return false;
        if (!holeCards.some(c => c[1] === fs && c[0] === "A")) return false;
        break;
      }
      case "wrap": {
        const best = bestO(holeCards, board);
        if (best && best.r >= 4) return false;
        break;
      }
    }
  }
  return true;
}

function genHole(opts: HandOptionId[], board: CardStr[], br: number[], bs: string[], fs: string, used: Set<string>, gt: number): CardStr[] | null {
  const cards: CardStr[] = [];
  for (const opt of opts) {
    const g = genOpt(opt, board, br, bs, fs, used, cards);
    if (!g) return null;
    for (const c of g) {
      if (!used.has(c) && !cards.includes(c)) {
        cards.push(c);
        used.add(c);
      }
    }
  }
  while (cards.length < gt) {
    const av = FD.filter(c => !used.has(c) && !cards.includes(c));
    if (!av.length) return null;
    // Fill with cards that don't accidentally create stronger hands
    const safe = av.filter(c => {
      const v = RV[c[0]];
      const s = c[1];
      const boardVals = board.map(b => RV[b[0]]);
      if (boardVals.includes(v) && !opts.some(o => (["top_pair", "two_pair", "trips", "set", "top_set", "middle_set", "bottom_set", "full_house"] as string[]).includes(o))) return false;
      if (s === fs && !opts.some(o => (["flush", "nut_flush", "flush_draw", "nut_flush_draw", "combo_draw"] as string[]).includes(o))) return false;
      return true;
    });
    const pool = safe.length > 0 ? safe : av;
    const p = pool[Math.floor(Math.random() * pool.length)];
    cards.push(p);
    used.add(p);
  }
  return cards.slice(0, gt);
}

function genOpt(opt: HandOptionId, board: CardStr[], br: number[], bs: string[], fs: string, used: Set<string>, ex: CardStr[]): CardStr[] | null {
  const av = (r: number, s: string): CardStr | null => {
    const c = VR[r] + s;
    return !used.has(c) && !ex.includes(c) ? c : null;
  };
  const anySuit = (r: number): CardStr | null => {
    for (const s of shuf([...SUITS])) {
      const c = av(r, s);
      if (c) return c;
    }
    return null;
  };
  const nonF = (r: number): CardStr | null => {
    for (const s of shuf(SUITS.filter(x => x !== fs))) {
      const c = av(r, s);
      if (c) return c;
    }
    return av(r, fs);
  };

  switch (opt) {
    case "top_pair": {
      const c = nonF(br[0]); return c ? [c] : null;
    }
    case "middle_pair": {
      if (br.length < 2) return null; const c = nonF(br[1]); return c ? [c] : null;
    }
    case "bottom_pair": {
      if (br.length < 3) return null; const c = nonF(br[2]); return c ? [c] : null;
    }
    case "overpair": {
      const ov = br[0] + 1;
      if (ov > 14) return null;
      const ss = shuf([...SUITS]);
      const c1 = av(ov, ss[0]), c2 = av(ov, ss[1]);
      return c1 && c2 ? [c1, c2] : null;
    }
    case "two_pair": {
      const c1 = nonF(br[0]), c2 = nonF(br[1]);
      return c1 && c2 ? [c1, c2] : null;
    }
    case "trips": {
      const c = anySuit(br[0]); return c ? [c] : null;
    }
    case "set":
    case "top_set": {
      const tr = br[0];
      const ss = shuf([...SUITS]).filter(s => { const bs2 = board.find(b => RV[b[0]] === tr); return bs2 ? s !== bs2[1] : true; });
      const c1 = av(tr, ss[0]), c2 = ss.length > 1 ? av(tr, ss[1]) : null;
      return c1 && c2 ? [c1, c2] : null;
    }
    case "middle_set": {
      if (br.length < 2) return null;
      const tr = br[1];
      const ss = shuf([...SUITS]).filter(s => { const bs2 = board.find(b => RV[b[0]] === tr); return bs2 ? s !== bs2[1] : true; });
      const c1 = av(tr, ss[0]), c2 = ss.length > 1 ? av(tr, ss[1]) : null;
      return c1 && c2 ? [c1, c2] : null;
    }
    case "bottom_set": {
      if (br.length < 3) return null;
      const tr = br[2];
      const ss = shuf([...SUITS]).filter(s => { const bs2 = board.find(b => RV[b[0]] === tr); return bs2 ? s !== bs2[1] : true; });
      const c1 = av(tr, ss[0]), c2 = ss.length > 1 ? av(tr, ss[1]) : null;
      return c1 && c2 ? [c1, c2] : null;
    }
    case "straight": {
      const bv = [...br].sort((a, b) => a - b);
      for (let l = 2; l <= 10; l++) {
        const s5 = [l, l + 1, l + 2, l + 3, l + 4];
        const nd = s5.filter(v => !bv.includes(v));
        if (nd.length === 2) {
          const c1 = nonF(nd[0]), c2 = nonF(nd[1]);
          if (c1 && c2) return [c1, c2];
        }
      }
      return null;
    }
    case "flush": {
      // Non-nut flush: do NOT use Ace
      const hr = shuf([13, 12, 11, 10, 9, 8, 7]);
      const picks: CardStr[] = [];
      for (const r of hr) {
        const c = av(r, fs);
        if (c) picks.push(c);
        if (picks.length === 2) break;
      }
      return picks.length === 2 ? picks : null;
    }
    case "nut_flush": {
      const c1 = av(14, fs);
      if (!c1) return null;
      for (const r of shuf([13, 12, 11, 10, 9])) {
        const c2 = av(r, fs);
        if (c2) return [c1, c2];
      }
      return null;
    }
    case "full_house": {
      const tr = br[0];
      const ss = shuf([...SUITS]).filter(s => { const bs2 = board.find(b => RV[b[0]] === tr); return bs2 ? s !== bs2[1] : true; });
      const c1 = av(tr, ss[0]), c2 = ss.length > 1 ? av(tr, ss[1]) : null;
      if (!c1 || !c2) return null;
      const c3 = anySuit(br[1]);
      return c3 ? [c1, c2, c3] : null;
    }
    case "quads": {
      const tr = br[0];
      const ss = SUITS.filter(s => { const bs2 = board.find(b => RV[b[0]] === tr); return bs2 ? s !== bs2[1] : true; });
      const cards = ss.map(s => av(tr, s)).filter((c): c is CardStr => c !== null);
      return cards.length >= 3 ? cards.slice(0, 3) : null;
    }
    case "oesd": {
      for (let t = 0; t < 20; t++) {
        const r1 = br[0] + (Math.random() > 0.5 ? 1 : -3);
        const r2 = r1 + 1;
        if (r1 >= 2 && r1 <= 14 && r2 >= 2 && r2 <= 14) {
          const c1 = nonF(r1), c2 = nonF(r2);
          if (c1 && c2) return [c1, c2];
        }
      }
      return null;
    }
    case "flush_draw": {
      // Non-nut FD: do NOT use Ace of flush suit
      const ranks = shuf([13, 12, 11, 10, 9, 8, 7, 6]);
      const picks: CardStr[] = [];
      for (const r of ranks) {
        const c = av(r, fs);
        if (c) picks.push(c);
        if (picks.length === 2) break;
      }
      return picks.length === 2 ? picks : null;
    }
    case "nut_flush_draw": {
      const c1 = av(14, fs);
      if (!c1) return null;
      for (const r of shuf([13, 12, 11, 10, 9, 8])) {
        const c2 = av(r, fs);
        if (c2) return [c1, c2];
      }
      return null;
    }
    case "gutshot": {
      const r1 = br[0] + 2;
      if (r1 > 14 || r1 < 2) return null;
      const c = nonF(r1);
      return c ? [c] : null;
    }
    case "wrap": {
      const m = br[1] || br[0];
      for (let att = 0; att < 20; att++) {
        const wc: CardStr[] = [];
        const offsets = shuf([-3, -2, -1, 1, 2, 3].filter(d => {
          const r = m + d;
          return r >= 2 && r <= 14 && !br.includes(r);
        }));
        for (const d of offsets) {
          const r = m + d;
          const c = nonF(r);
          if (c && !ex.includes(c)) wc.push(c);
          if (wc.length >= 3) break;
        }
        if (wc.length < 2) continue;
        const cards = wc.slice(0, 3);
        const testHole = [...ex, ...cards];
        if (testHole.length >= 2) {
          const best = bestO(testHole, board);
          if (best && best.r >= 4) continue;
        }
        return cards;
      }
      return null;
    }
    case "combo_draw": {
      // FD (not NFD) + straight draw
      const c1 = (() => {
        for (const r of shuf([13, 12, 11, 10, 9])) {
          const c = av(r, fs);
          if (c) return c;
        }
        return null;
      })();
      if (!c1) return null;
      const cv = br[0] + 1;
      if (cv <= 14 && cv >= 2) {
        const c2 = nonF(cv);
        if (c2) return [c1, c2];
      }
      return [c1];
    }
    case "overcards": {
      const ov = br[0] + 1;
      if (ov > 14) return null;
      const c = nonF(ov) || anySuit(14);
      return c ? [c] : null;
    }
    case "backdoor_sd": {
      const m = br[1] || br[0];
      const r = m + 3;
      if (r >= 2 && r <= 14) {
        const c = nonF(r);
        if (c) return [c];
      }
      const r2 = m - 3;
      if (r2 >= 2 && r2 <= 14) {
        const c = nonF(r2);
        if (c) return [c];
      }
      return null;
    }
    case "backdoor_fd": {
      const nbs = SUITS.find(s => !bs.includes(s)) || SUITS[3];
      const c = av(Math.floor(Math.random() * 5) + 10, nbs);
      return c ? [c] : null;
    }
    case "blocker": {
      // Nut flush blocker: Ace of a suit that has cards on board
      for (const s of shuf([...SUITS])) {
        if (bs.includes(s)) {
          const c = av(14, s);
          if (c) return [c];
        }
      }
      return null;
    }
    case "air": {
      return []; // No specific cards needed
    }
    default:
      return null;
  }
}
