/** Quiz utility functions — pure, no React dependencies */

export interface TierConfig {
  label: string;
  labelKo: string;
  color: string;       // tailwind text color
  bgColor: string;     // tailwind bg color
  borderColor: string; // tailwind border color
}

export const TIER_CONFIG: Record<string, TierConfig> = {
  Perfect:    { label: 'Perfect',    labelKo: '\uD37C\uD399\uD2B8',   color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/40' },
  Correct:    { label: 'Correct',    labelKo: '\uC815\uB2F5',         color: 'text-green-400',   bgColor: 'bg-green-500/20',   borderColor: 'border-green-500/40' },
  Inaccuracy: { label: 'Inaccuracy', labelKo: '\uBD80\uC815\uD655',   color: 'text-yellow-400',  bgColor: 'bg-yellow-500/20',  borderColor: 'border-yellow-500/40' },
  Mistake:    { label: 'Mistake',    labelKo: '\uC2E4\uC218',         color: 'text-orange-400',  bgColor: 'bg-orange-500/20',  borderColor: 'border-orange-500/40' },
  Blunder:    { label: 'Blunder',    labelKo: '\uB300\uC545\uC218',   color: 'text-red-400',     bgColor: 'bg-red-500/20',     borderColor: 'border-red-500/40' },
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
 * EV loss in bb (maxEV − chosenEV) / 2000  (MonkerSolver unit: 2000 = 1bb)
 * Returns 0 if chosen action has the highest EV.
 */
export function calculateEvLoss(maxEv: number, chosenEv: number): number {
  return Math.max(0, (maxEv - chosenEv) / 2000);
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
  streak: number;
  bestStreak: number;
}

// ---------- Difficulty ----------

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'expert';

export interface DifficultyConfig {
  labelKo: string;
  labelEn: string;
  maxPrimaryFreq: number; // hands with primaryFreq <= this pass (1.0 = no filter)
  color: string;          // tailwind text color class
}

export const DIFFICULTY_OPTIONS: Record<DifficultyLevel, DifficultyConfig> = {
  easy:   { labelKo: '쉬움',     labelEn: 'Easy',   maxPrimaryFreq: 1.0,  color: 'text-green-400' },
  normal: { labelKo: '보통',     labelEn: 'Normal', maxPrimaryFreq: 0.90, color: 'text-blue-400' },
  hard:   { labelKo: '어려움',   labelEn: 'Hard',   maxPrimaryFreq: 0.70, color: 'text-orange-400' },
  expert: { labelKo: '매우 어려움', labelEn: 'Expert', maxPrimaryFreq: 0.50, color: 'text-red-400' },
};

/**
 * Filter hand keys by difficulty level based on primaryFreq.
 * Returns filtered array of hand keys.
 */
export function filterByDifficulty(
  keys: string[],
  difficulty: DifficultyLevel,
  handActionMap: Map<string, { primaryFreq: number }>,
): string[] {
  const config = DIFFICULTY_OPTIONS[difficulty];
  if (config.maxPrimaryFreq >= 1.0) return keys;
  return keys.filter((key) => {
    const entry = handActionMap.get(key);
    return entry ? entry.primaryFreq <= config.maxPrimaryFreq : false;
  });
}

// ---------- Timer ----------

export const TIMER_OPTIONS = [10, 15, 20, 30] as const;
export type TimerSeconds = typeof TIMER_OPTIONS[number];

// ---------- Category Filter ----------

import { getCachedCategories, type HandCategory } from '../../utils/handCategories';

export function filterByCategory(
  keys: string[],
  category: HandCategory | null,
): string[] {
  if (!category) return keys;
  return keys.filter(key => getCachedCategories(key).includes(category));
}

export function computeSessionStats(history: HistoryEntry[]): SessionStats {
  const tiers: Record<TierName, number> = {
    Perfect: 0, Correct: 0, Inaccuracy: 0, Mistake: 0, Blunder: 0,
  };
  let totalEvLoss = 0;
  let streak = 0;
  let bestStreak = 0;

  for (const h of history) {
    tiers[h.tier]++;
    totalEvLoss += h.evLoss;
    if (h.tier === 'Perfect' || h.tier === 'Correct') {
      streak++;
      if (streak > bestStreak) bestStreak = streak;
    } else {
      streak = 0;
    }
  }

  const total = history.length;
  const correct = tiers.Perfect + tiers.Correct;
  return {
    total,
    accuracy: total > 0 ? correct / total : 0,
    avgEvLoss: total > 0 ? totalEvLoss / total : 0,
    tiers,
    streak,
    bestStreak,
  };
}
