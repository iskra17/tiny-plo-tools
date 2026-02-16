/* ═══ BoardPanel — Board cards display with input/picker/random ═══ */

import { useState } from "react";
import type { CardStr } from "../types.ts";
import { useT } from "../i18n.ts";
import { parseText } from "../logic/deck.ts";
import MiniCard from "./MiniCard.tsx";
import EmptySlot from "./EmptySlot.tsx";
import CardPicker from "./CardPicker.tsx";

interface BoardPanelProps {
  bc: CardStr[];
  onBcChange: (cards: CardStr[]) => void;
  allUsed: Set<string>;
  pickerTarget: string | null;
  setPickerTarget: (target: string | null) => void;
  onRandomFill: (target: number) => void;
  canCalc: boolean;
}

export default function BoardPanel({
  bc,
  onBcChange,
  allUsed,
  pickerTarget,
  setPickerTarget,
  onRandomFill,
  canCalc,
}: BoardPanelProps) {
  const t = useT();
  const [bt, setBt] = useState("");
  const bpo = pickerTarget === "board";

  const bSub = () => {
    const p = parseText(bt);
    const bU = new Set(bc);
    const v = p.filter((c) => !allUsed.has(c) || bU.has(c));
    onBcChange(v.slice(0, 5));
    setBt("");
  };

  const bPick = (c: CardStr) => {
    if (bc.length < 5) {
      const n = [...bc, c];
      onBcChange(n);
      if (n.length >= 5) setPickerTarget(null);
    }
  };

  return (
    <div className="bg-white/[0.06] backdrop-blur-md rounded-xl p-4 mb-3.5 border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-sm font-bold text-slate-300">{t.board.title}</span>
        <span className="text-[11px] text-slate-500 font-mono">
          {bc.length}/5
          {bc.length >= 3 && canCalc && (
            <span className="text-emerald-400 ml-1.5">{t.board.auto}</span>
          )}
        </span>
      </div>

      {/* Board cards */}
      <div className="flex gap-1.5 min-h-14 mb-2.5 flex-wrap">
        {bc.map((c, i) => (
          <MiniCard
            key={i}
            card={c}
            onRemove={() => onBcChange(bc.filter((_, j) => j !== i))}
          />
        ))}
        {Array.from({ length: 5 - bc.length }).map((_, i) => (
          <EmptySlot key={`e${i}`} />
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-1.5 flex-wrap">
        <div className="flex-1 flex gap-1 min-w-[120px]">
          <input
            type="text"
            placeholder={t.board.inputPlaceholder}
            value={bt}
            onChange={(e) => setBt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && bSub()}
            className="flex-1 py-1.5 px-2.5 border-[1.5px] border-white/15 rounded-lg text-xs font-mono bg-white/[0.06] text-slate-200 outline-none min-w-0 placeholder:text-slate-500"
          />
          <button
            onClick={bSub}
            className="px-2.5 py-1.5 border-none rounded-lg text-xs font-semibold bg-gradient-to-br from-indigo-500 to-purple-600 text-white cursor-pointer"
          >
            {t.board.input}
          </button>
        </div>
        <button
          onClick={() => setPickerTarget(bpo ? null : "board")}
          className={`px-2.5 py-1.5 border-none rounded-lg text-xs font-semibold cursor-pointer ${
            bpo ? "bg-slate-700 text-white" : "bg-white/10 text-slate-300"
          }`}
        >
          {bpo ? t.board.close : t.board.select}
        </button>
        <button
          onClick={() => onRandomFill(3)}
          disabled={bc.length >= 3}
          className="px-2.5 py-1.5 border-none rounded-lg text-[11px] font-semibold bg-white/[0.08] text-slate-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.board.flop}
        </button>
        <button
          onClick={() => onRandomFill(4)}
          disabled={bc.length >= 4}
          className="px-2.5 py-1.5 border-none rounded-lg text-[11px] font-semibold bg-white/[0.08] text-slate-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.board.turn}
        </button>
        <button
          onClick={() => onRandomFill(5)}
          disabled={bc.length >= 5}
          className="px-2.5 py-1.5 border-none rounded-lg text-[11px] font-semibold bg-white/[0.08] text-slate-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.board.river}
        </button>
        <button
          onClick={() => onBcChange([])}
          disabled={bc.length === 0}
          className="px-2.5 py-1.5 border-none rounded-lg text-xs font-semibold bg-red-500/15 text-red-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.board.clear}
        </button>
      </div>

      {/* Picker */}
      {bpo && (
        <div className="mt-2.5 border-t border-white/[0.08] pt-2">
          <CardPicker used={allUsed} onPick={bPick} />
        </div>
      )}
    </div>
  );
}
