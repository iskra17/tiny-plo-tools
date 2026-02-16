import { RANKS } from '../constants/poker';

/**
 * Validate a single Monker-notation hand string.
 * Valid examples: AAAA, (AK)Q2, (AK)(QJ), AA(KQ)
 * Each hand must have exactly 4 rank characters.
 */
export function validateMonkerHand(hand: string): boolean {
  let rankCount = 0;
  let parenDepth = 0;

  for (const ch of hand) {
    if (ch === '(') {
      if (parenDepth > 0) return false; // no nested parens
      parenDepth++;
    } else if (ch === ')') {
      if (parenDepth === 0) return false;
      parenDepth--;
    } else if (RANKS.includes(ch as typeof RANKS[number])) {
      rankCount++;
    } else if (ch === '*') {
      rankCount++;
    } else {
      return false; // invalid character
    }
  }

  return parenDepth === 0 && rankCount === 4;
}

/**
 * Parse a comma-separated range expression into individual hand patterns.
 * Supports: "AAAA, (AK)Q2, AA**"
 */
export function parseRangeExpression(input: string): string[] {
  if (!input.trim()) return [];

  return input
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Check if a hand matches a pattern (supports * wildcards).
 * Pattern ranks are extracted ignoring parens, then compared positionally.
 */
export function handMatchesPattern(hand: string, pattern: string): boolean {
  const handRanks = extractRanks(hand);
  const patternRanks = extractRanks(pattern);

  if (handRanks.length !== 4 || patternRanks.length !== 4) return false;

  // Sort both for comparison (since order may vary)
  const sortedHand = sortRanks(handRanks);
  const sortedPattern = sortRanks(patternRanks);

  for (let i = 0; i < 4; i++) {
    if (sortedPattern[i] !== '*' && sortedPattern[i] !== sortedHand[i]) {
      return false;
    }
  }

  return true;
}

function extractRanks(notation: string): string[] {
  const ranks: string[] = [];
  for (const ch of notation) {
    if (ch !== '(' && ch !== ')') {
      ranks.push(ch);
    }
  }
  return ranks;
}

function sortRanks(ranks: string[]): string[] {
  const order = RANKS as readonly string[];
  return [...ranks].sort((a, b) => {
    if (a === '*') return 1;
    if (b === '*') return -1;
    return order.indexOf(a) - order.indexOf(b);
  });
}

/**
 * Filter a list of hands by multiple patterns.
 */
export function filterHandsByPatterns(hands: string[], patterns: string[]): string[] {
  if (patterns.length === 0) return hands;
  return hands.filter((hand) => patterns.some((p) => handMatchesPattern(hand, p)));
}

/**
 * Normalize a Monker-notation hand to canonical order.
 * Monker canonical: ranks sorted ascending (2→A) within groups,
 * groups sorted by size desc then by lowest rank asc.
 * e.g. "JJTT" → "TTJJ", "(JT)KA" → "(JT)AK"
 *
 * Hands with wildcards (*) are returned as-is.
 */
export function normalizeMonkerHand(hand: string): string {
  if (hand.includes('*')) return hand;

  const RANK_ORDER = RANKS as readonly string[];

  interface Group {
    ranks: string[];
  }

  // Parse into groups
  const groups: Group[] = [];
  let i = 0;
  while (i < hand.length) {
    if (hand[i] === '(') {
      i++;
      const ranks: string[] = [];
      while (i < hand.length && hand[i] !== ')') {
        ranks.push(hand[i]);
        i++;
      }
      i++; // skip ')'
      groups.push({ ranks });
    } else {
      groups.push({ ranks: [hand[i]] });
      i++;
    }
  }

  // Sort ranks within each group ascending (2→A = index 12→0 in RANKS which is A→2)
  // RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'] so higher index = lower rank
  for (const group of groups) {
    group.ranks.sort((a, b) => RANK_ORDER.indexOf(b) - RANK_ORDER.indexOf(a));
  }

  // Sort groups: larger first, then by lowest rank ascending
  groups.sort((a, b) => {
    if (b.ranks.length !== a.ranks.length) return b.ranks.length - a.ranks.length;
    // Compare lowest rank (highest index in RANKS = lowest rank value)
    return RANK_ORDER.indexOf(b.ranks[0]) - RANK_ORDER.indexOf(a.ranks[0]);
  });

  // Build result
  let result = '';
  for (const group of groups) {
    if (group.ranks.length === 1) {
      result += group.ranks[0];
    } else {
      result += '(' + group.ranks.join('') + ')';
    }
  }
  return result;
}
