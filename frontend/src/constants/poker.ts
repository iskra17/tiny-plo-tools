export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
export type Rank = typeof RANKS[number];

export const SUITS = [
  { key: 'h' as const, label: '\u2665', color: 'text-red-500', name: 'hearts' },
  { key: 'd' as const, label: '\u2666', color: 'text-blue-400', name: 'diamonds' },
  { key: 'c' as const, label: '\u2663', color: 'text-green-400', name: 'clubs' },
  { key: 's' as const, label: '\u2660', color: 'text-slate-300', name: 'spades' },
] as const;
export type Suit = 'h' | 'd' | 'c' | 's';

export const POSITIONS_6MAX = ['UTG', 'MP', 'CO', 'BU', 'SB', 'BB'] as const;
export type Position = typeof POSITIONS_6MAX[number];

export const ACTION_MAP: Record<string, string> = {
  '0': 'Fold',
  '1': 'Call',
  '2': 'Pot',
  '3': 'AllIn',
  '40100': 'Pot',
  '40075': 'Raise75',
  '40050': 'Raise50',
  '40033': 'Raise33',
};

export const ACTION_COLORS: Record<string, { bg: string; hover: string; text: string }> = {
  Fold: { bg: 'bg-blue-500', hover: 'hover:bg-blue-400', text: 'text-white' },
  Call: { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-500', text: 'text-white' },
  Pot: { bg: 'bg-rose-600', hover: 'hover:bg-rose-500', text: 'text-white' },
  AllIn: { bg: 'bg-red-800', hover: 'hover:bg-red-700', text: 'text-white' },
  Raise75: { bg: 'bg-amber-600', hover: 'hover:bg-amber-500', text: 'text-white' },
  Raise50: { bg: 'bg-yellow-600', hover: 'hover:bg-yellow-500', text: 'text-white' },
  Raise33: { bg: 'bg-lime-600', hover: 'hover:bg-lime-500', text: 'text-white' },
};

export const SUIT_FILTERS = ['all', 'double', 'single', 'triple', 'rainbow'] as const;
export type SuitFilterType = typeof SUIT_FILTERS[number];

export interface Card {
  rank: Rank;
  suit: Suit;
}

export interface ActionHistoryItem {
  position: string;
  action: string;
  code: string;
}
