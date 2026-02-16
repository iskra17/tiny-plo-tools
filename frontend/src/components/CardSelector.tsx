import { useState, useCallback } from 'react';

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
const SUITS = [
  { key: 'h', label: '\u2665', color: 'text-red-500' },
  { key: 'd', label: '\u2666', color: 'text-blue-400' },
  { key: 'c', label: '\u2663', color: 'text-green-400' },
  { key: 's', label: '\u2660', color: 'text-gray-300' },
] as const;

interface Card {
  rank: string;
  suit: string;
}

interface CardSelectorProps {
  onHandChange: (hand: string) => void;
}

export function CardSelector({ onHandChange }: CardSelectorProps) {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [textInput, setTextInput] = useState('');

  const toggleCard = useCallback(
    (rank: string, suit: string) => {
      setSelectedCards((prev) => {
        const exists = prev.find((c) => c.rank === rank && c.suit === suit);
        let next: Card[];
        if (exists) {
          next = prev.filter((c) => !(c.rank === rank && c.suit === suit));
        } else if (prev.length >= 4) {
          return prev;
        } else {
          next = [...prev, { rank, suit }];
        }
        if (next.length === 4) {
          const hand = next.map((c) => c.rank + c.suit).join('');
          onHandChange(hand);
        } else {
          onHandChange('');
        }
        return next;
      });
    },
    [onHandChange]
  );

  const isSelected = (rank: string, suit: string) =>
    selectedCards.some((c) => c.rank === rank && c.suit === suit);

  const clearAll = () => {
    setSelectedCards([]);
    onHandChange('');
  };

  const handleTextSubmit = () => {
    const cleaned = textInput.trim();
    if (cleaned.length === 8) {
      onHandChange(cleaned);
      // Parse into card selections
      const cards: Card[] = [];
      for (let i = 0; i < 8; i += 2) {
        cards.push({ rank: cleaned[i].toUpperCase(), suit: cleaned[i + 1].toLowerCase() });
      }
      setSelectedCards(cards);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Select 4 Cards
        </h3>
        {selectedCards.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded border border-slate-600 hover:border-slate-400"
          >
            Clear
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
            placeholder="e.g. AhKs2d3c"
            className="bg-slate-700 text-sm text-white px-2 py-1 rounded w-32 placeholder-slate-500"
          />
          <button
            onClick={handleTextSubmit}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded"
          >
            Go
          </button>
        </div>
      </div>

      {/* Selected hand display */}
      {selectedCards.length > 0 && (
        <div className="flex gap-1.5">
          {selectedCards.map((c, i) => {
            const suitInfo = SUITS.find((s) => s.key === c.suit)!;
            return (
              <span
                key={i}
                className={`inline-flex items-center gap-0.5 text-lg font-bold bg-slate-700 px-2 py-1 rounded ${suitInfo.color}`}
              >
                {c.rank}
                {suitInfo.label}
              </span>
            );
          })}
          {selectedCards.length < 4 && (
            <span className="text-slate-500 text-sm self-center ml-2">
              {4 - selectedCards.length} more...
            </span>
          )}
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-13 gap-0.5" style={{ gridTemplateColumns: `repeat(13, 1fr)` }}>
        {SUITS.map((suit) =>
          RANKS.map((rank) => {
            const selected = isSelected(rank, suit.key);
            return (
              <button
                key={`${rank}${suit.key}`}
                onClick={() => toggleCard(rank, suit.key)}
                disabled={!selected && selectedCards.length >= 4}
                className={`
                  aspect-[3/4] flex flex-col items-center justify-center text-xs font-bold rounded
                  transition-all cursor-pointer select-none
                  ${selected
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 scale-105'
                    : selectedCards.length >= 4
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  }
                `}
              >
                <span>{rank}</span>
                <span className={selected ? 'text-white' : suit.color}>{suit.label}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
