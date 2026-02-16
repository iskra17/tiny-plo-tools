import { RANKS } from '../constants/poker';

const RANK_INDEX = new Map<string, number>(
  RANKS.map((r, i) => [r, i])
);

/** Get numeric rank index (0=A highest, 12=2 lowest) */
function rankIdx(r: string): number {
  return RANK_INDEX.get(r) ?? -1;
}

interface ParsedCard {
  rank: string;
  suitGroupId: number; // cards in same () group share a suit
}

/** Parse Monker hand notation into cards with suit group info */
function parseHand(hand: string): ParsedCard[] {
  const cards: ParsedCard[] = [];
  let groupId = 0;
  let inGroup = false;
  let currentGroup = -1;

  for (const ch of hand) {
    if (ch === '(') {
      inGroup = true;
      currentGroup = groupId++;
    } else if (ch === ')') {
      inGroup = false;
    } else {
      cards.push({ rank: ch, suitGroupId: inGroup ? currentGroup : groupId++ });
    }
  }
  return cards;
}

/** Expand a range like A:T into [A,K,Q,J,T] */
function expandRange(from: string, to: string): string[] {
  const fromIdx = rankIdx(from);
  const toIdx = rankIdx(to);
  if (fromIdx < 0 || toIdx < 0) return [];
  const lo = Math.min(fromIdx, toIdx);
  const hi = Math.max(fromIdx, toIdx);
  const result: string[] = [];
  for (let i = lo; i <= hi; i++) {
    result.push(RANKS[i]);
  }
  return result;
}

// ─── Suit pattern helpers ───

/** Check if hand has at least one suited pair (any () group with 2+ cards) */
function hasSuitedPair(cards: ParsedCard[]): boolean {
  const seen = new Set<number>();
  for (const c of cards) {
    if (seen.has(c.suitGroupId)) return true;
    seen.add(c.suitGroupId);
  }
  return false;
}

/** Check if hand is double suited */
function isDoubleSuited(cards: ParsedCard[]): boolean {
  const groupCounts = new Map<number, number>();
  for (const c of cards) {
    groupCounts.set(c.suitGroupId, (groupCounts.get(c.suitGroupId) || 0) + 1);
  }
  let suitedPairs = 0;
  for (const v of groupCounts.values()) {
    if (v >= 2) suitedPairs++;
  }
  return suitedPairs >= 2;
}

/** Check if hand is rainbow (no suited pairs) */
function isRainbow(cards: ParsedCard[]): boolean {
  return !hasSuitedPair(cards);
}

/** Get rank frequency map */
function rankFreqs(cards: ParsedCard[]): Map<string, number> {
  const freqs = new Map<string, number>();
  for (const c of cards) {
    freqs.set(c.rank, (freqs.get(c.rank) || 0) + 1);
  }
  return freqs;
}

/** Check if hand has any pair (two cards same rank) */
function hasPair(cards: ParsedCard[]): boolean {
  for (const v of rankFreqs(cards).values()) {
    if (v >= 2) return true;
  }
  return false;
}

/** Check if hand has two different pairs */
function hasDoublePair(cards: ParsedCard[]): boolean {
  let pairs = 0;
  for (const v of rankFreqs(cards).values()) {
    if (v >= 2) pairs++;
  }
  return pairs >= 2;
}

// ─── PPT Suit Pattern matching (xxyy, xxyw, etc.) ───

/**
 * PPT suit patterns:
 *   xxyy = double suited (two distinct suited pairs)
 *   xxyw = single suited (exactly one suited pair)
 *   xxxy = triple suited (3 cards same suit)
 *   xxxx = monotone (all 4 same suit)
 *   xywz = rainbow (all different suits)
 */
function matchesSuitPattern(cards: ParsedCard[], pattern: string): boolean {
  const groupCounts = new Map<number, number>();
  for (const c of cards) {
    groupCounts.set(c.suitGroupId, (groupCounts.get(c.suitGroupId) || 0) + 1);
  }
  const freqs = Array.from(groupCounts.values()).sort((a, b) => b - a);

  switch (pattern) {
    case 'xxyy': // double suited: two groups of 2
      return freqs.length >= 2 && freqs[0] === 2 && freqs[1] === 2;
    case 'xxyw': // single suited: exactly one group of 2, rest are singletons
      return freqs[0] === 2 && (freqs.length < 2 || freqs[1] === 1);
    case 'xxxy': // triple suited: one group of 3
      return freqs[0] === 3;
    case 'xxxx': // monotone: all 4 same suit
      return freqs[0] === 4;
    case 'xywz': // rainbow: all different suits
      return freqs.length === 4 && freqs[0] === 1;
    default:
      return false;
  }
}

// ─── PPT Rank Meta-patterns (RR, RROO, etc.) ───

/**
 * PPT rank meta-patterns:
 *   RR     = has any pair
 *   RROO   = double paired (two different pairs)
 * Note: !RR and RR!RROO are handled by generic inline ! negation
 */
function matchesRankMeta(cards: ParsedCard[], pattern: string): boolean {
  switch (pattern) {
    case 'RR':
      return hasPair(cards);
    case 'RROO':
      return hasDoublePair(cards);
    default:
      return false;
  }
}

// ─── $ Rank Categories ───

const RANK_CATEGORIES: Record<string, Set<string>> = {
  B: new Set(['A', 'K', 'Q', 'J']),        // Big
  M: new Set(['T', '9', '8', '7']),         // Middle
  Z: new Set(['6', '5', '4', '3', '2']),    // Small
  L: new Set(['A', '8', '7', '6', '5', '4', '3', '2']), // Low (A-8 for low games)
  N: new Set(['K', 'Q', 'J', 'T', '9']),    // Non-low
  F: new Set(['K', 'Q', 'J']),              // Face cards
  R: new Set(['A', 'K', 'Q', 'J', 'T']),   // Broadway (Royals)
  W: new Set(['A', '5', '4', '3', '2']),    // Wheel cards
};

// ─── $ Modifiers ───

function matchesDollarMod(cards: ParsedCard[], mod: string): boolean {
  switch (mod) {
    case 'ds': return isDoubleSuited(cards);
    case 'ss': return hasSuitedPair(cards) && !isDoubleSuited(cards); // single suited only
    case 'np': return !hasPair(cards);
    case 'rb': return isRainbow(cards);
    default: return true;
  }
}

// ─── Bracket Notation: (A,K,Q) and (AA-TT) ───

/**
 * Parse bracket notation:
 *   (A,K,Q) = hand must contain at least one of A, K, or Q
 *   (AA-TT) = hand has a pair in range AA through TT
 *   (A-T)   = hand has at least one card in rank range A through T
 */
function matchesBracketNotation(cards: ParsedCard[], bracket: string): boolean {
  // Remove outer parens
  const inner = bracket.slice(1, -1).trim();

  // Check if it's a pair range: AA-TT, KK-JJ, etc.
  const pairRangeMatch = inner.match(/^([AKQJT98765432])\1-([AKQJT98765432])\2$/);
  if (pairRangeMatch) {
    const fromRank = pairRangeMatch[1];
    const toRank = pairRangeMatch[2];
    const rangeRanks = expandRange(fromRank, toRank);
    const freqs = rankFreqs(cards);
    return rangeRanks.some(r => (freqs.get(r) || 0) >= 2);
  }

  // Check if it's a rank range: (A-T), (K-9)
  const rankRangeMatch = inner.match(/^([AKQJT98765432])-([AKQJT98765432])$/);
  if (rankRangeMatch) {
    const rangeRanks = expandRange(rankRangeMatch[1], rankRangeMatch[2]);
    return cards.some(c => rangeRanks.includes(c.rank));
  }

  // Comma-separated ranks: (A,K,Q)
  const items = inner.split(',').map(s => s.trim()).filter(Boolean);
  // Each item is a rank
  return items.some(item => {
    const r = item.toUpperCase();
    if (r.length === 1 && rankIdx(r) >= 0) {
      return cards.some(c => c.rank === r);
    }
    // Could also be a pair like "AA"
    if (r.length === 2 && r[0] === r[1] && rankIdx(r[0]) >= 0) {
      return (rankFreqs(cards).get(r[0]) || 0) >= 2;
    }
    return false;
  });
}

// ─── Slot-based matching with backtracking ───

interface FilterSlot {
  ranks: string[];       // possible ranks for this slot
  suitGroupId: number;   // cards sharing same group must share suit (-1 = any)
}

function parseFilterSlots(filter: string): FilterSlot[] {
  const slots: FilterSlot[] = [];
  let i = 0;
  let suitGroupCounter = 0;
  let currentSuitGroup = -1;
  let inParens = false;

  while (i < filter.length) {
    const ch = filter[i];

    if (ch === '(') {
      inParens = true;
      currentSuitGroup = suitGroupCounter++;
      i++;
      continue;
    }

    if (ch === ')') {
      inParens = false;
      currentSuitGroup = -1;
      i++;
      continue;
    }

    // Check for comparison operators: >=X, <=X
    if ((ch === '>' || ch === '<') && i + 1 < filter.length && filter[i + 1] === '=') {
      const rankChar = filter[i + 2];
      if (rankChar && rankIdx(rankChar) >= 0) {
        const idx = rankIdx(rankChar);
        const ranks: string[] = [];
        if (ch === '>') {
          for (let r = 0; r <= idx; r++) ranks.push(RANKS[r]);
        } else {
          for (let r = idx; r < RANKS.length; r++) ranks.push(RANKS[r]);
        }
        slots.push({ ranks, suitGroupId: inParens ? currentSuitGroup : -1 });
        i += 3;
        continue;
      }
    }

    // Check for range: X:Y (only when Y is not a suit condition keyword)
    if (rankIdx(ch) >= 0 && i + 2 < filter.length && filter[i + 1] === ':') {
      const toChar = filter[i + 2];
      if (rankIdx(toChar) >= 0) {
        const ranks = expandRange(ch, toChar);
        slots.push({ ranks, suitGroupId: inParens ? currentSuitGroup : -1 });
        i += 3;
        continue;
      }
    }

    // Regular rank character
    if (rankIdx(ch) >= 0) {
      slots.push({
        ranks: [ch],
        suitGroupId: inParens ? currentSuitGroup : -1,
      });
      i++;
      continue;
    }

    // Wildcard: x or *
    if (ch === 'x' || ch === 'X' || ch === '*') {
      slots.push({ ranks: [...RANKS], suitGroupId: inParens ? currentSuitGroup : -1 });
      i++;
      continue;
    }

    // Skip unknown characters
    i++;
  }

  return slots;
}

/** Try to match filter slots against hand cards using backtracking */
function matchSlots(cards: ParsedCard[], slots: FilterSlot[]): boolean {
  if (slots.length === 0) return true;
  const used = new Array(cards.length).fill(false);
  const suitGroupMapping = new Map<number, number>();
  return backtrack(cards, slots, 0, used, suitGroupMapping);
}

function backtrack(
  cards: ParsedCard[],
  slots: FilterSlot[],
  slotIdx: number,
  used: boolean[],
  suitGroupMapping: Map<number, number>,
): boolean {
  if (slotIdx >= slots.length) return true;

  const slot = slots[slotIdx];

  for (let ci = 0; ci < cards.length; ci++) {
    if (used[ci]) continue;

    const card = cards[ci];

    // Check rank match
    if (!slot.ranks.includes(card.rank)) continue;

    // Check suit group constraint
    if (slot.suitGroupId >= 0) {
      const mappedGroup = suitGroupMapping.get(slot.suitGroupId);
      if (mappedGroup !== undefined) {
        if (card.suitGroupId !== mappedGroup) continue;
      }
    }

    // Try assigning this card
    used[ci] = true;
    const prevMapping = suitGroupMapping.get(slot.suitGroupId);
    if (slot.suitGroupId >= 0) {
      suitGroupMapping.set(slot.suitGroupId, card.suitGroupId);
    }

    if (backtrack(cards, slots, slotIdx + 1, used, suitGroupMapping)) {
      return true;
    }

    // Undo
    used[ci] = false;
    if (slot.suitGroupId >= 0) {
      if (prevMapping !== undefined) {
        suitGroupMapping.set(slot.suitGroupId, prevMapping);
      } else {
        suitGroupMapping.delete(slot.suitGroupId);
      }
    }
  }

  return false;
}

// ─── Suit condition after ':' ───

const SUIT_TO_GROUP: Record<string, number> = { s: 0, h: 1, d: 2, c: 3 };

function matchSuitCondition(cards: ParsedCard[], condition: string): boolean {
  const lower = condition.toLowerCase().trim();

  if (lower === 'xx') return hasSuitedPair(cards);
  if (lower === 'ss') return hasSuitedPair(cards) && !isDoubleSuited(cards);
  if (lower === 'ds') return isDoubleSuited(cards);
  if (lower === 'rb') return isRainbow(cards);

  // Parse card+suit specifications like "As", "Kh", "AsKh"
  let i = 0;
  while (i < condition.length) {
    const ch = condition[i].toUpperCase();
    if (rankIdx(ch) >= 0 && i + 1 < condition.length) {
      const suitChar = condition[i + 1].toLowerCase();
      if (suitChar in SUIT_TO_GROUP) {
        const targetRank = ch;
        const targetGroup = SUIT_TO_GROUP[suitChar];
        const found = cards.some(c => c.rank === targetRank && c.suitGroupId === targetGroup);
        if (!found) return false;
        i += 2;
        // Skip trailing 's' for "suited" marker
        if (i < condition.length && condition[i].toLowerCase() === 's'
          && (i + 1 >= condition.length || rankIdx(condition[i + 1].toUpperCase()) < 0)) {
          i++;
        }
        continue;
      }
    }
    i++;
  }

  return true;
}

function findSuitConditionColon(filter: string): number {
  for (let i = filter.length - 1; i >= 0; i--) {
    if (filter[i] !== ':') continue;
    const right = filter.substring(i + 1).toLowerCase();
    if (['xx', 'ss', 'ds', 'rb'].includes(right)) return i;
    if (right.length >= 2) {
      const firstChar = right[0].toUpperCase();
      const secondChar = right[1];
      if (rankIdx(firstChar) >= 0 && secondChar in SUIT_TO_GROUP) return i;
    }
    break;
  }
  return -1;
}

// ─── $ category slot matching with backtracking ───

/**
 * Match $B$M etc. - each $ category consumes one card.
 * Uses backtracking to find a valid assignment.
 */
function matchesCategorySlots(cards: ParsedCard[], categories: string[]): boolean {
  if (categories.length === 0) return true;
  const used = new Array(cards.length).fill(false);
  return categoryBacktrack(cards, categories, 0, used);
}

function categoryBacktrack(
  cards: ParsedCard[],
  categories: string[],
  catIdx: number,
  used: boolean[],
): boolean {
  if (catIdx >= categories.length) return true;
  const catKey = categories[catIdx];
  const validRanks = RANK_CATEGORIES[catKey];
  if (!validRanks) return false;

  for (let ci = 0; ci < cards.length; ci++) {
    if (used[ci]) continue;
    if (!validRanks.has(cards[ci].rank)) continue;
    used[ci] = true;
    if (categoryBacktrack(cards, categories, catIdx + 1, used)) return true;
    used[ci] = false;
  }
  return false;
}

// ─── Top-level token parsing ───

/**
 * Split top-level commas respecting parentheses.
 * "(A,K,Q),AA" → ["(A,K,Q)", "AA"]
 */
function splitTopLevelCommas(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of input) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);
  return parts;
}

/**
 * Expand prefix:(list) syntax.
 * "A:(87,76,53)" → "A87,A76,A53"
 */
function expandPrefixSyntax(input: string): string {
  return input.replace(/([^,]+?):\(([^)]+)\)/g, (_, prefix, items) => {
    return items.split(',')
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0)
      .map((item: string) => prefix.trim() + item)
      .join(',');
  });
}

/**
 * Handle inline ! negation then dispatch to atomic matching.
 * AA!Q  → positive=AA, negatives=[Q]  → has AA AND NOT has Q
 * !RR   → positive='', negatives=[RR] → NOT has pair
 * RR!RROO → positive=RR, negatives=[RROO] → pair but NOT double paired
 * AA!Q!J  → positive=AA, negatives=[Q,J] → has AA AND NOT Q AND NOT J
 */
function matchesSingleToken(cards: ParsedCard[], token: string): boolean {
  token = token.trim();
  if (!token) return true;

  // Handle inline ! negation by splitting on !
  if (token.includes('!')) {
    const parts = token.split('!');
    const positive = parts[0]; // may be empty for leading !
    const negatives = parts.slice(1).filter(p => p.length > 0);

    // Positive part must match (empty = always true)
    if (positive && !matchesAtomicToken(cards, positive)) return false;

    // All negative parts must NOT match
    for (const neg of negatives) {
      if (matchesAtomicToken(cards, neg)) return false;
    }
    return true;
  }

  return matchesAtomicToken(cards, token);
}

/**
 * Match a single atomic token (no ! negation).
 * Handles bracket notation, $ modifiers, suit patterns,
 * rank meta-patterns, and slot-based rank matching.
 */
function matchesAtomicToken(cards: ParsedCard[], token: string): boolean {
  token = token.trim();
  if (!token) return true;

  // Handle parenthesized tokens: either bracket notation or suited-group
  if (token.startsWith('(') && token.includes(')')) {
    const closeIdx = token.indexOf(')');
    const inner = token.slice(1, closeIdx);

    // Bracket notation has commas or dash-range inside parens: (A,K,Q), (AA-TT), (A-T)
    const isBracketNotation = inner.includes(',') ||
      /^[AKQJT98765432]{1,2}-[AKQJT98765432]{1,2}$/.test(inner);

    if (isBracketNotation) {
      const bracket = token.slice(0, closeIdx + 1);
      const rest = token.slice(closeIdx + 1);

      if (!matchesBracketNotation(cards, bracket)) return false;

      if (rest.trim()) {
        return matchesAtomicToken(cards, rest);
      }
      return true;
    }

    // Otherwise it's suited-group notation: (AK)xx, (AK)(QJ), (AA)K3
    // Route to slot-based parsing which understands () as suit groups
    const slots = parseFilterSlots(token);
    if (slots.length > 0) {
      return matchSlots(cards, slots);
    }
    return true;
  }

  // Handle : (AND) operator for combining conditions
  if (token.includes(':')) {
    const colonParts = splitColonParts(token);
    if (colonParts.length > 1) {
      return colonParts.every(part => matchesSingleToken(cards, part));
    }
  }

  // Handle $ modifiers and $ rank categories
  if (token.includes('$')) {
    return matchesDollarToken(cards, token);
  }

  // Suit patterns: xxyy, xxyw, xxxy, xxxx, xywz
  if (/^[xywz]{4}$/i.test(token)) {
    return matchesSuitPattern(cards, token.toLowerCase());
  }

  // Rank meta-patterns: RR, RROO
  if (/^(?:RROO|RR)$/i.test(token)) {
    return matchesRankMeta(cards, token.toUpperCase());
  }

  // Wildcard
  if (token === '*') return true;

  // Single rank check (e.g., "Q" in "AA!Q" → hand contains Q)
  if (token.length === 1 && rankIdx(token) >= 0) {
    return cards.some(c => c.rank === token);
  }

  // Regular slot-based rank matching (AA, AAKK, (AK)xx, etc.)
  const slots = parseFilterSlots(token);
  if (slots.length > 0) {
    return matchSlots(cards, slots);
  }

  return true;
}

/**
 * Split a token by ':' for AND semantics,
 * but only if it's not a suit condition or rank range.
 */
function splitColonParts(token: string): string[] {
  // Check if this is a suit condition (e.g., "AA:ss", "AA:ds")
  const suitColonIdx = findSuitConditionColon(token);
  if (suitColonIdx >= 0) {
    // It's a suit condition - handle as rank:suit
    return [token]; // Don't split, handle as a whole
  }

  // Check if it's a rank range (e.g., "A:T")
  if (token.length === 3 && rankIdx(token[0]) >= 0 && token[1] === ':' && rankIdx(token[2]) >= 0) {
    return [token]; // Don't split, it's a range
  }

  // Check if it's prefix:(list) syntax - don't split those
  if (/:\(/.test(token)) {
    return [token];
  }

  // Otherwise split by ':' as AND
  const parts = token.split(':');
  if (parts.length > 1 && parts.every(p => p.trim().length > 0)) {
    return parts;
  }
  return [token];
}

/**
 * Handle tokens with $ (dollar) modifiers/categories.
 * Examples: "$ds", "$B$M", "RR$ds", "$B$M$ds"
 */
function matchesDollarToken(cards: ParsedCard[], token: string): boolean {
  // Extract all $ segments
  const dollarParts: string[] = [];
  const categories: string[] = [];
  let basePart = '';
  let i = 0;

  while (i < token.length) {
    if (token[i] === '$') {
      i++;
      // Read the modifier/category key
      let key = '';
      while (i < token.length && token[i] !== '$' && token[i] !== ':') {
        key += token[i];
        i++;
      }
      if (key) dollarParts.push(key);
    } else {
      basePart += token[i];
      i++;
    }
  }

  // Separate $ parts into modifiers vs rank categories
  const mods: string[] = [];
  for (const part of dollarParts) {
    const lower = part.toLowerCase();
    if (['ds', 'ss', 'np', 'rb'].includes(lower)) {
      mods.push(lower);
    } else {
      const upper = part.toUpperCase();
      if (RANK_CATEGORIES[upper]) {
        categories.push(upper);
      }
    }
  }

  // Check base part (if any)
  if (basePart.trim()) {
    if (!matchesAtomicToken(cards, basePart.trim())) return false;
  }

  // Check modifiers
  for (const mod of mods) {
    if (!matchesDollarMod(cards, mod)) return false;
  }

  // Check rank categories (with backtracking)
  if (categories.length > 0) {
    if (!matchesCategorySlots(cards, categories)) return false;
  }

  return true;
}

/**
 * Match a complete token that may include suit conditions after ':'.
 * This handles the colon as suit-condition separator vs AND separator.
 */
function matchesTokenWithSuit(cards: ParsedCard[], token: string): boolean {
  token = token.trim();
  if (!token) return true;

  // Check for suit condition colon
  const suitColonIdx = findSuitConditionColon(token);
  if (suitColonIdx >= 0) {
    const rankPart = token.substring(0, suitColonIdx);
    const suitPart = token.substring(suitColonIdx + 1);

    if (rankPart) {
      if (!matchesSingleToken(cards, rankPart)) return false;
    }
    return matchSuitCondition(cards, suitPart);
  }

  return matchesSingleToken(cards, token);
}

/**
 * Main filter function: checks if a Monker hand matches the filter input.
 *
 * Supported PPT-style syntax:
 *   AA, AAKK       - rank matching
 *   (AK)xx         - suited group + wildcards
 *   AA,KK          - comma-separated OR
 *   >=T, A:T       - rank ranges
 *   *              - any hand
 *
 * PPT Suit Patterns:
 *   xxyy           - double suited
 *   xxyw           - single suited
 *   xxxy           - triple suited (3 same suit)
 *   xxxx           - monotone (all 4 same suit)
 *   xywz           - rainbow
 *
 * PPT Rank Meta-patterns:
 *   RR             - any pair
 *   RROO           - double paired
 *   !RR            - no pair
 *   RR!RROO        - exactly one pair
 *
 * $ Rank Categories (each consumes one card slot):
 *   $B = Big (A-J), $M = Middle (T-7), $Z = Small (6-2)
 *   $L = Low (A,8-2), $N = Non-low (K-9), $F = Face (K-J)
 *   $R = Broadway/Royals (A-T), $W = Wheel (A,5-2)
 *
 * $ Modifiers:
 *   $ds = double suited, $ss = single suited
 *   $np = no pair, $rb = rainbow
 *
 * Bracket Notation:
 *   (A,K,Q)        - has at least one of A, K, or Q
 *   (AA-TT)        - has a pair in range AA through TT
 *
 * Operators:
 *   ,              - OR (comma)
 *   :              - AND (colon, when not suit-condition or rank-range)
 *   !              - NOT (prefix)
 *
 * Suit Conditions (after :):
 *   AA:ss          - AA, single suited
 *   AA:ds          - double suited
 *   AA:rb          - rainbow
 *   AA:As          - A in spade suit group
 *
 * Prefix Expansion:
 *   A:(87,76,53)   - A87 or A76 or A53
 */
export function matchesMonkerFilter(hand: string, filterInput: string): boolean {
  if (!filterInput.trim()) return true;

  // Expand prefix:(list) syntax first
  const expanded = expandPrefixSyntax(filterInput);

  const handCards = parseHand(hand);
  if (handCards.length < 4) return false;

  // Split by comma for OR logic (respecting parentheses)
  const parts = splitTopLevelCommas(expanded);
  return parts.some((part) => matchesTokenWithSuit(handCards, part));
}
