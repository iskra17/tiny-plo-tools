import React from 'react';

/** Suit background colors: spade=dark gray, heart=red, diamond=blue, club=green */
const SUIT_BG: Record<string, string> = {
  s: 'bg-slate-600',
  h: 'bg-red-600',
  d: 'bg-blue-600',
  c: 'bg-green-600',
};

const SUIT_SYMBOL: Record<string, string> = {
  s: '♠', h: '♥', d: '♦', c: '♣',
};

const SUIT_KEYS = ['s', 'h', 'd', 'c'];

const RANK_ORDER: Record<string, number> = {
  'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};

interface ParsedCard {
  rank: string;
  suited: boolean;
  groupId: number;
}

/** Parse Monker notation like `(KA)(2Q)` into card objects with group info */
function parseMonkerHand(hand: string): ParsedCard[] {
  const cards: ParsedCard[] = [];
  let groupId = 0;
  let inGroup = false;
  let currentGroupId = -1;

  for (let i = 0; i < hand.length; i++) {
    if (hand[i] === '(') {
      inGroup = true;
      currentGroupId = groupId++;
    } else if (hand[i] === ')') {
      inGroup = false;
    } else {
      cards.push({
        rank: hand[i],
        suited: inGroup,
        groupId: inGroup ? currentGroupId : groupId++,
      });
    }
  }
  return cards;
}

/** Build a suit map for cards, assigning suits sequentially per group */
function buildSuitMap(cards: ParsedCard[]): Map<number, string> {
  const groupSuitMap = new Map<number, string>();
  let suitIdx = 0;
  for (const card of cards) {
    if (!groupSuitMap.has(card.groupId)) {
      groupSuitMap.set(card.groupId, SUIT_KEYS[suitIdx % SUIT_KEYS.length]);
      suitIdx++;
    }
  }
  return groupSuitMap;
}

/** Sort cards by rank descending (A first, 2 last) */
function sortCardsByRankDesc(cards: ParsedCard[]): ParsedCard[] {
  return [...cards].sort((a, b) => (RANK_ORDER[b.rank] || 0) - (RANK_ORDER[a.rank] || 0));
}

/** Render a Monker hand as full-sized cards (for PokerTable center display) */
export function renderMonkerHand(hand: string): React.ReactNode[] {
  const cards = parseMonkerHand(hand);
  const suitMap = buildSuitMap(cards);
  const sorted = sortCardsByRankDesc(cards);

  return sorted.map((card, i) => {
    const suit = suitMap.get(card.groupId)!;
    const bg = SUIT_BG[suit];
    return (
      <div
        key={i}
        className={`w-8 h-11 ${bg} rounded flex items-center justify-center shadow-md border border-white/20`}
      >
        <span className="text-base font-bold text-white">{card.rank}</span>
      </div>
    );
  });
}

/** Render a Monker hand as compact inline cards (for HandList rows) */
export function renderHandCompact(hand: string): React.ReactNode {
  const cards = parseMonkerHand(hand);
  const suitMap = buildSuitMap(cards);
  const sorted = sortCardsByRankDesc(cards);

  return (
    <span className="inline-flex gap-[2px]">
      {sorted.map((card, i) => {
        const suit = suitMap.get(card.groupId)!;
        const bg = SUIT_BG[suit];
        const symbol = SUIT_SYMBOL[suit];
        return (
          <span
            key={i}
            className={`inline-flex items-center justify-center ${bg} rounded-[2px] w-[22px] h-[18px] text-[10px] leading-none`}
          >
            <span className="font-bold text-white">{card.rank}</span>
            <span className="text-white/70 text-[7px] ml-[1px]">{symbol}</span>
          </span>
        );
      })}
    </span>
  );
}
