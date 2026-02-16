/**
 * Monker hand notation utility.
 *
 * Monker notation encodes PLO hands as suit-isomorphism classes:
 * - Cards outside parentheses each have a unique suit
 * - Cards inside parentheses share the same suit
 * - Multiple parenthetical groups = multiple suit groups
 *
 * Examples:
 *   "AAAA"     → 4 aces, all different suits (rainbow)
 *   "(2A)AA"   → 2 and A share a suit, other A's are different
 *   "(23A)A"   → 2, 3, A share a suit, 4th A is different
 *   "(2A)(3A)" → 2+A one suit, 3+A another suit
 */

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;
const SUITS = ['h', 'd', 'c', 's'] as const;

type Rank = typeof RANKS[number];
type Suit = typeof SUITS[number];

export interface Card {
  rank: Rank;
  suit: Suit;
}

export interface SuitGroup {
  ranks: Rank[];
}

/**
 * Parse Monker hand notation into suit groups.
 * Returns an array of SuitGroup, where each group's cards share a suit.
 * Single cards not in parens are each their own group.
 */
export function parseMonkerHand(hand: string): SuitGroup[] {
  const groups: SuitGroup[] = [];
  let i = 0;

  while (i < hand.length) {
    if (hand[i] === '(') {
      i++; // skip '('
      const ranks: Rank[] = [];
      while (i < hand.length && hand[i] !== ')') {
        ranks.push(hand[i] as Rank);
        i++;
      }
      i++; // skip ')'
      groups.push({ ranks });
    } else {
      groups.push({ ranks: [hand[i] as Rank] });
      i++;
    }
  }

  return groups;
}

/**
 * Get the rank index for sorting (2=0, 3=1, ..., A=12).
 */
export function rankIndex(rank: string): number {
  return RANKS.indexOf(rank as Rank);
}

/**
 * Convert a 4-card hand (with suits) to Monker notation.
 * This maps concrete suited cards to their isomorphism class.
 *
 * Steps:
 * 1. Group cards by suit
 * 2. Sort groups by size (desc), then by rank
 * 3. Assign canonical representation
 */
export function cardsToMonker(cards: Card[]): string {
  if (cards.length !== 4) throw new Error('PLO hand must have exactly 4 cards');

  // Group cards by suit
  const suitMap = new Map<Suit, Rank[]>();
  for (const card of cards) {
    const existing = suitMap.get(card.suit) || [];
    existing.push(card.rank);
    suitMap.set(card.suit, existing);
  }

  // Sort each suit group's ranks descending
  for (const ranks of suitMap.values()) {
    ranks.sort((a, b) => rankIndex(b) - rankIndex(a));
  }

  // Collect groups, sorted: larger groups first, then by highest rank desc
  const groups = Array.from(suitMap.values());
  groups.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    // Same size: compare highest rank
    return rankIndex(b[0]) - rankIndex(a[0]);
  });

  // Build Monker notation
  let result = '';
  for (const group of groups) {
    if (group.length === 1) {
      result += group[0];
    } else {
      result += '(' + group.join('') + ')';
    }
  }

  return result;
}

/**
 * Parse a standard hand string like "AhKs2d3c" into Card array.
 */
export function parseStandardHand(hand: string): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < hand.length; i += 2) {
    const rank = hand[i].toUpperCase() as Rank;
    const suit = hand[i + 1].toLowerCase() as Suit;
    if (!RANKS.includes(rank)) throw new Error(`Invalid rank: ${hand[i]}`);
    if (!SUITS.includes(suit)) throw new Error(`Invalid suit: ${hand[i + 1]}`);
    cards.push({ rank, suit });
  }
  return cards;
}

/**
 * Convert a standard hand string (e.g. "AhKs2d3c") to Monker notation.
 */
export function standardToMonker(hand: string): string {
  return cardsToMonker(parseStandardHand(hand));
}

/**
 * Normalize a Monker-notation hand to canonical order.
 * Monker canonical order: ranks sorted ascending (2→A) within groups,
 * groups sorted by size desc then by lowest rank asc.
 *
 * Rainbow hands (no parens): just sort ranks ascending.
 * Suited groups: sort ranks within each group ascending, then sort groups.
 */
export function normalizeMonkerHand(hand: string): string {
  const groups = parseMonkerHand(hand);

  // Sort ranks within each group ascending (Monker canonical)
  for (const group of groups) {
    group.ranks.sort((a, b) => rankIndex(a) - rankIndex(b));
  }

  // Sort groups: larger groups first, then by lowest rank ascending
  groups.sort((a, b) => {
    if (b.ranks.length !== a.ranks.length) return b.ranks.length - a.ranks.length;
    return rankIndex(a.ranks[0]) - rankIndex(b.ranks[0]);
  });

  // Build normalized notation
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

// --- Action sequence decoding ---

export const ACTION_MAP: Record<string, string> = {
  '0': 'Fold',
  '1': 'Call',
  '2': 'RaisePot',
  '3': 'AllIn',
  '40100': 'Raise100',
  '40075': 'Raise75',
  '40050': 'Raise50',
  '40033': 'Raise33',
};

// 6max positions in MonkerSolver order (action sequence order: UTG acts first preflop)
export const POSITIONS_6MAX = ['UTG', 'MP', 'CO', 'BU', 'SB', 'BB'] as const;

export interface DecodedAction {
  position: string;
  action: string;
  raw: string;
}

/**
 * Parse a .rng filename (without extension) into individual action codes.
 * Handles multi-digit codes like "40100".
 */
export function parseActionCodes(filename: string): string[] {
  const codes: string[] = [];
  const parts = filename.split('.');

  for (const part of parts) {
    codes.push(part);
  }
  return codes;
}

/**
 * Decode an action sequence from a .rng filename into human-readable form.
 *
 * In 6max preflop, positions act: UTG, MP, CO, BU, SB, BB
 * After BB acts, it cycles back (for re-raises).
 */
export function decodeActionSequence(filename: string): {
  actions: DecodedAction[];
  actingPosition: string;
  humanReadable: string;
} {
  // Remove .rng extension if present
  const base = filename.replace(/\.rng$/, '');
  const codes = parseActionCodes(base);

  const actions: DecodedAction[] = [];
  let posIdx = 0; // Start from UTG

  for (const code of codes) {
    const position = POSITIONS_6MAX[posIdx % POSITIONS_6MAX.length];
    const action = ACTION_MAP[code] || `Unknown(${code})`;
    actions.push({ position, action, raw: code });

    // Only advance position for non-fold actions... actually all actions advance
    posIdx++;
  }

  // The file represents the range for the NEXT position to act
  // (the position that hasn't acted yet at this node)
  const actingPosition = POSITIONS_6MAX[posIdx % POSITIONS_6MAX.length];

  const humanReadable = actions.map(a => `${a.position}:${a.action}`).join(' → ');

  return { actions, actingPosition, humanReadable };
}

/**
 * Get the action type from the last action in the sequence.
 * The .rng file contains the range of the player who took this action.
 */
export function getLastAction(filename: string): { position: string; action: string } {
  const base = filename.replace(/\.rng$/, '');
  const codes = parseActionCodes(base);

  if (codes.length === 0) return { position: 'UTG', action: 'Open' };

  const lastCode = codes[codes.length - 1];
  const posIdx = (codes.length - 1) % POSITIONS_6MAX.length;

  return {
    position: POSITIONS_6MAX[posIdx],
    action: ACTION_MAP[lastCode] || `Unknown(${lastCode})`,
  };
}
