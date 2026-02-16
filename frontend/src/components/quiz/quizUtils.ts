/** Quiz utility functions — pure, no React dependencies */

export interface TierConfig {
  label: string;
  color: string;       // tailwind text color
  bgColor: string;     // tailwind bg color
  borderColor: string; // tailwind border color
}

export const TIER_CONFIG: Record<string, TierConfig> = {
  Perfect:    { label: 'Perfect',    color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/40' },
  Correct:    { label: 'Correct',    color: 'text-green-400',   bgColor: 'bg-green-500/20',   borderColor: 'border-green-500/40' },
  Inaccuracy: { label: 'Inaccuracy', color: 'text-yellow-400',  bgColor: 'bg-yellow-500/20',  borderColor: 'border-yellow-500/40' },
  Mistake:    { label: 'Mistake',    color: 'text-orange-400',  bgColor: 'bg-orange-500/20',  borderColor: 'border-orange-500/40' },
  Blunder:    { label: 'Blunder',    color: 'text-red-400',     bgColor: 'bg-red-500/20',     borderColor: 'border-red-500/40' },
};

export type TierName = keyof typeof TIER_CONFIG;

/**
 * Determine feedback tier based on chosen action's frequency and
 * whether it is the highest-frequency (primary) action.
 */
export function getFeedbackTier(
  chosenFreq: number,
  isPrimary: boolean,
): TierName {
  const pct = chosenFreq * 100;
  if (isPrimary && pct > 70) return 'Perfect';
  if (pct > 30) return 'Correct';
  if (pct >= 10) return 'Inaccuracy';
  if (pct >= 3) return 'Mistake';
  return 'Blunder';
}

/**
 * EV loss in bb (maxEV − chosenEV) / 1000
 * Returns 0 if chosen action has the highest EV.
 */
export function calculateEvLoss(maxEv: number, chosenEv: number): number {
  return Math.max(0, (maxEv - chosenEv) / 1000);
}

/**
 * Fisher-Yates in-place shuffle.
 */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface HistoryEntry {
  hand: string;
  chosenAction: string;
  tier: TierName;
  evLoss: number;
  actions: Record<string, { frequency: number; ev: number }>;
}

export interface SessionStats {
  total: number;
  accuracy: number;       // 0-1 (Perfect+Correct / total)
  avgEvLoss: number;      // bb per hand
  tiers: Record<TierName, number>;
}

export function computeSessionStats(history: HistoryEntry[]): SessionStats {
  const tiers: Record<TierName, number> = {
    Perfect: 0, Correct: 0, Inaccuracy: 0, Mistake: 0, Blunder: 0,
  };
  let totalEvLoss = 0;

  for (const h of history) {
    tiers[h.tier]++;
    totalEvLoss += h.evLoss;
  }

  const total = history.length;
  const correct = tiers.Perfect + tiers.Correct;
  return {
    total,
    accuracy: total > 0 ? correct / total : 0,
    avgEvLoss: total > 0 ? totalEvLoss / total : 0,
    tiers,
  };
}
