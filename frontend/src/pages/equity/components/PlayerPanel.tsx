/* ═══ PlayerPanel — Player hand panel with cards, input, results ═══ */

import { useState, useMemo } from "react";
import type { CardStr, GameType } from "../types.ts";
import { PC } from "../constants.ts";
import { useT, useLang } from "../i18n.ts";
import { parseText } from "../logic/deck.ts";
import { analyzeHand } from "../logic/handAnalysis.ts";
import MiniCard from "./MiniCard.tsx";
import EmptySlot from "./EmptySlot.tsx";
import CardPicker from "./CardPicker.tsx";

interface PlayerPanelProps {
  index: number;
  cards: CardStr[];
  gameType: GameType;
  onChange: (cards: CardStr[]) => void;
  allUsed: Set<string>;
  pickerTarget: string | null;
  setPickerTarget: (target: string | null) => void;
  onRandom: () => void;
  boardCards: CardStr[];
}

export default function PlayerPanel({
  index,
  cards,
  gameType,
  onChange,
  allUsed,
  pickerTarget,
  setPickerTarget,
  onRandom,
  boardCards,
}: PlayerPanelProps) {
  const t = useT();
  const lang = useLang();
  const [txt, setTxt] = useState("");
  const max = gameType;
  const open = pickerTarget === `p-${index}`;
  const pUsed = new Set(cards);
  const color = PC[index % PC.length];

  const handAnalysis = useMemo(
    () => analyzeHand(cards, boardCards, lang),
    [cards, boardCards, lang]
  );

  const submit = () => {
    const p = parseText(txt).filter((c) => !allUsed.has(c) || pUsed.has(c));
    onChange(p.slice(0, max));
    setTxt("");
  };

  const pick = (c: CardStr) => {
    if (cards.length < max) {
      const n = [...cards, c];
      onChange(n);
      if (n.length >= max) setPickerTarget(null);
    }
  };

  const placeholder =
    max === 4
      ? t.player.inputPlaceholder4
      : max === 5
        ? t.player.inputPlaceholder5
        : t.player.inputPlaceholder6;

  return (
    <div
      style={{
        border: `2px solid ${color}22`,
        boxShadow: `0 4px 16px ${color}11`,
      }}
      className="bg-white rounded-xl p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
          className="w-7 h-7 rounded-full text-white flex items-center justify-center font-extrabold text-[13px] font-mono"
        >
          {index + 1}
        </div>
        <span className="font-bold text-sm text-slate-800">
          {t.player.title} {index + 1}
        </span>
        {handAnalysis && (
          <span className="text-[10px] text-slate-400 ml-2 font-mono">
            {handAnalysis}
          </span>
        )}
        <span className="text-[11px] text-slate-400 ml-auto font-mono">
          {cards.length}/{max}
        </span>
      </div>

      {/* Cards */}
      <div className="flex gap-1.5 min-h-14 mb-2.5 flex-wrap">
        {cards.map((c, i) => (
          <MiniCard
            key={i}
            card={c}
            onRemove={() => onChange(cards.filter((_, j) => j !== i))}
          />
        ))}
        {Array.from({ length: max - cards.length }).map((_, i) => (
          <EmptySlot key={`e${i}`} dark={false} />
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-1.5 flex-wrap">
        <div className="flex-1 flex gap-1 min-w-40">
          <input
            type="text"
            placeholder={placeholder}
            value={txt}
            onChange={(e) => setTxt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="flex-1 py-1.5 px-2.5 border-[1.5px] border-slate-200 rounded-lg text-xs font-mono outline-none min-w-0 focus:border-blue-400"
          />
          <button
            onClick={submit}
            style={{ background: color }}
            className="px-2.5 py-1.5 border-none rounded-lg text-xs font-semibold text-white cursor-pointer"
          >
            {t.player.input}
          </button>
        </div>
        <button
          onClick={() => setPickerTarget(open ? null : `p-${index}`)}
          className={`px-2.5 py-1.5 border-none rounded-lg text-xs font-semibold cursor-pointer ${
            open
              ? "bg-slate-700 text-white"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {open ? t.player.close : t.player.select}
        </button>
        <button
          onClick={onRandom}
          disabled={cards.length >= max}
          className="px-2.5 py-1.5 border-none rounded-lg text-xs font-semibold bg-slate-100 text-slate-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Random
        </button>
        <button
          onClick={() => onChange([])}
          disabled={cards.length === 0}
          className="px-2.5 py-1.5 border-none rounded-lg text-xs font-semibold bg-red-500/10 text-red-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          X
        </button>
      </div>

      {/* Picker */}
      {open && (
        <div className="mt-2.5 border-t border-slate-100 pt-2">
          <CardPicker used={allUsed} onPick={pick} />
        </div>
      )}
    </div>
  );
}
