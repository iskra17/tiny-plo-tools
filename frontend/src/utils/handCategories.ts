/**
 * PLO hand categorization utility.
 * Classifies 4-card PLO hands into strategy-relevant categories.
 */

export type HandCategory =
  | 'pairs'
  | 'double_paired'
  | 'rundowns'
  | 'broadway'
  | 'suited_aces'
  | 'connected'
  | 'other';

export const CATEGORY_LABELS: Record<HandCategory, string> = {
  pairs: 'Pairs',
  double_paired: 'Dbl Paired',
  rundowns: 'Rundowns',
  broadway: 'Broadway',
  suited_aces: 'Suited A',
  connected: 'Connected',
  other: 'Other',
};

export const CATEGORY_COLORS: Record<HandCategory, string> = {
  pairs: 'bg-purple-600',
  double_paired: 'bg-fuchsia-600',
  rundowns: 'bg-cyan-600',
  broadway: 'bg-amber-600',
  suited_aces: 'bg-rose-600',
  connected: 'bg-teal-600',
  other: 'bg-slate-600',
};

export const ALL_CATEGORIES: HandCategory[] = [
  'pairs', 'double_paired', 'rundowns', 'broadway', 'suited_aces', 'connected', 'other',
];

const RANK_VALUE: Record<string, number> = {
  'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};

function extractRanks(hand: string): string[] {
  const ranks: string[] = [];
  for (const ch of hand) {
    if (ch !== '(' && ch !== ')') ranks.push(ch);
  }
  return ranks;
}

function parseSuitGroups(hand: string): string[][] {
  const groups: string[][] = [];
  let currentGroup: string[] | null = null;
  for (const ch of hand) {
    if (ch === '(') currentGroup = [];
    else if (ch === ')') {
      if (currentGroup && currentGroup.length > 0) groups.push(currentGroup);
      currentGroup = null;
    } else if (currentGroup) currentGroup.push(ch);
  }
  return groups;
}

/**
 * Categorize a PLO hand (Monker notation) into one or more categories.
 * A hand can belong to multiple categories (e.g., pairs + broadway).
 */
export function categorizeHand(hand: string): HandCategory[] {
  const ranks = extractRanks(hand);
  if (ranks.length !== 4) return ['other'];

  const values = ranks.map(r => RANK_VALUE[r] || 0).sort((a, b) => b - a);
  const categories: HandCategory[] = [];

  // Count rank occurrences for pair detection
  const rankCounts = new Map<string, number>();
  for (const r of ranks) {
    rankCounts.set(r, (rankCounts.get(r) || 0) + 1);
  }
  const pairCount = Array.from(rankCounts.values()).filter(c => c >= 2).length;

  if (pairCount >= 2) {
    categories.push('double_paired');
    categories.push('pairs');
  } else if (pairCount === 1) {
    categories.push('pairs');
  }

  // Unique sorted values for connectivity analysis
  const uniqueValues = [...new Set(values)].sort((a, b) => b - a);

  // Broadway: 3+ cards with value >= 10 (T, J, Q, K, A)
  const broadwayCount = values.filter(v => v >= 10).length;
  if (broadwayCount >= 3) categories.push('broadway');

  // Rundown: 4 unique ranks with span <= 4 (e.g., KQJT span=3, KQJ9 span=4)
  if (uniqueValues.length === 4) {
    const span = uniqueValues[0] - uniqueValues[3];
    if (span <= 4) {
      categories.push('rundowns');
    } else {
      // Connected: check if at least 3 cards are consecutive (span <= 2 among 3)
      const hasConnection = checkConnected(uniqueValues);
      if (hasConnection) categories.push('connected');
    }
  } else if (uniqueValues.length === 3 && pairCount === 1) {
    // Pair + 2 other cards: check if the non-pair cards are connected
    const span = uniqueValues[0] - uniqueValues[2];
    if (span <= 4) categories.push('connected');
  }

  // Suited Aces: Ace in a suit group with another card
  const suitGroups = parseSuitGroups(hand);
  if (ranks.includes('A') && suitGroups.some(g => g.includes('A') && g.length >= 2)) {
    categories.push('suited_aces');
  }

  if (categories.length === 0) categories.push('other');

  return categories;
}

/** Check if at least 3 of the 4 values form a connected group (gap between consecutive <= 1) */
function checkConnected(sortedDesc: number[]): boolean {
  // Try all combinations of 3 from 4
  for (let skip = 0; skip < sortedDesc.length; skip++) {
    const sub = sortedDesc.filter((_, i) => i !== skip);
    const span = sub[0] - sub[sub.length - 1];
    if (span <= 3) return true;
  }
  return false;
}

// Cache for hand categorization (hands don't change within a session)
const categoryCache = new Map<string, HandCategory[]>();

export function getCachedCategories(hand: string): HandCategory[] {
  let cats = categoryCache.get(hand);
  if (!cats) {
    cats = categorizeHand(hand);
    categoryCache.set(hand, cats);
  }
  return cats;
}
