/* ═══ CardPicker — 4x13 card selection grid ═══ */

import type { CardStr, Suit } from "../types.ts";
import { RANKS, SUITS, SC, SBG, SS } from "../constants.ts";

interface CardPickerProps {
  used: Set<string>;
  onPick: (card: CardStr) => void;
}

export default function CardPicker({ used, onPick }: CardPickerProps) {
  return (
    <div className="py-3">
      {RANKS.map((rank) => (
        <div key={rank} className="flex gap-0.5 mb-0.5 justify-center">
          {SUITS.map((suit) => {
            const c: CardStr = rank + suit;
            const u = used.has(c);
            return (
              <button
                key={c}
                disabled={u}
                onClick={() => onPick(c)}
                style={{
                  border: u
                    ? "1px solid #ddd"
                    : `1.5px solid ${SC[suit as Suit]}55`,
                  background: u
                    ? "#f0f0f0"
                    : `linear-gradient(135deg, white, ${SBG[suit as Suit]})`,
                  color: u ? "#ccc" : SC[suit as Suit],
                }}
                className={`w-[46px] h-8 rounded-[5px] font-bold text-xs flex items-center justify-center gap-0.5 font-mono ${
                  u ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {rank}
                <span className="text-[11px]">{SS[suit as Suit]}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
