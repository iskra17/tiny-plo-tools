/* ═══ NextCardPanel — Per-card equity display (chart + grid views) ═══ */

import { useState } from "react";
import type { CardStr, NextCardResult, Suit } from "../types.ts";
import { SUITS, SC, SBG, SS, PC } from "../constants.ts";
import { useT } from "../i18n.ts";

interface NextCardPanelProps {
  data: NextCardResult[];
  playerCards: CardStr[][];
  boardLen: number;
  onCardClick?: (card: CardStr) => void;
}

export default function NextCardPanel({
  data,
  playerCards: _playerCards,
  boardLen,
  onCardClick,
}: NextCardPanelProps) {
  const t = useT();
  const [sortBy, setSortBy] = useState(0);
  const [viewMode, setViewMode] = useState<"chart" | "grid">("chart");
  const [suitFilter, setSuitFilter] = useState<string>("all");

  // suppress unused warning
  void _playerCards;

  if (!data || data.length === 0) return null;

  const label =
    boardLen === 3 ? t.board.turn : boardLen === 4 ? t.board.river : "";
  const numPlayers = data[0].equities.length;

  const filtered =
    suitFilter === "all" ? data : data.filter((d) => d.card[1] === suitFilter);
  const sorted = [...filtered].sort(
    (a, b) => b.equities[sortBy] - a.equities[sortBy]
  );

  const avgEq =
    data.reduce((s, d) => s + d.equities[sortBy], 0) / data.length;

  // Layout: 2-column if >25 cards and no suit filter
  const useDoubleColumn = suitFilter === "all" && sorted.length > 25;

  let leftCol: NextCardResult[] = [];
  let rightCol: NextCardResult[] = [];
  if (useDoubleColumn) {
    const mid = Math.ceil(sorted.length / 2);
    leftCol = sorted.slice(0, mid);
    rightCol = sorted.slice(mid);
  }

  const renderBarItem = (item: NextCardResult) => {
    const eq = item.equities[sortBy];
    const isGood = eq > avgEq + 5;
    const isBad = eq < avgEq - 5;
    const suit = item.card[1] as Suit;

    return (
      <div key={item.card} className="flex items-center gap-1.5 mb-0.5 py-0.5">
        <div
          onClick={() => onCardClick?.(item.card)}
          style={{
            border: `1.5px solid ${SC[suit]}44`,
            background: `linear-gradient(135deg, white, ${SBG[suit]})`,
          }}
          className={`w-[34px] h-7 rounded flex flex-col items-center justify-center shrink-0 transition-transform duration-150 ${
            onCardClick ? "cursor-pointer hover:scale-110" : "cursor-default"
          }`}
        >
          <span
            style={{ color: SC[suit] }}
            className="text-[10px] font-bold leading-none"
          >
            {item.card[0]}
          </span>
          <span
            style={{ color: SC[suit] }}
            className="text-[8px] leading-none"
          >
            {SS[suit]}
          </span>
        </div>
        <div className="flex-1 relative h-4 bg-slate-700 rounded overflow-hidden">
          <div
            style={{
              width: `${eq}%`,
              background: `linear-gradient(90deg, ${PC[sortBy]}, ${
                isGood ? "#2ecc71" : isBad ? "#e74c3c" : PC[sortBy]
              }aa)`,
            }}
            className="h-full rounded transition-[width] duration-300 ease-out"
          />
        </div>
        <div className="w-[46px] text-right shrink-0">
          <span
            className={`text-[11px] font-extrabold font-mono ${
              isGood
                ? "text-emerald-400"
                : isBad
                  ? "text-red-400"
                  : "text-slate-300"
            }`}
          >
            {eq.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-800 rounded border border-slate-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="m-0 text-sm font-bold text-slate-300">
          {t.nextCard.title(label)}
        </h3>
        <div className="flex gap-1">
          <div className="flex gap-0.5 bg-slate-700 rounded p-0.5">
            {(
              [
                { id: "chart" as const, label: t.nextCard.chart },
                { id: "grid" as const, label: t.nextCard.grid },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                className={`py-1 px-2 rounded border-none text-[11px] font-semibold cursor-pointer ${
                  viewMode === m.id
                    ? "bg-blue-600 text-white"
                    : "bg-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex gap-3 mb-3 flex-wrap items-center">
        {/* Sort by player */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500">
            {t.nextCard.sortBy}:
          </span>
          <div className="flex gap-0.5">
            {Array.from({ length: numPlayers }).map((_, i) => (
              <button
                key={i}
                onClick={() => setSortBy(i)}
                style={{
                  border:
                    sortBy === i
                      ? `2px solid ${PC[i]}`
                      : "1px solid rgba(255,255,255,0.1)",
                  background: sortBy === i ? `${PC[i]}22` : "transparent",
                  color: sortBy === i ? PC[i] : "#888",
                }}
                className="py-0.5 px-2.5 rounded text-[11px] font-bold cursor-pointer"
              >
                P{i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Suit filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500">
            {t.nextCard.suit}:
          </span>
          <div className="flex gap-0.5">
            <button
              onClick={() => setSuitFilter("all")}
              className={`py-0.5 px-2 rounded text-[11px] font-semibold cursor-pointer ${
                suitFilter === "all"
                  ? "border-2 border-blue-500 bg-blue-500/15 text-blue-300"
                  : "border border-slate-600 bg-transparent text-slate-500"
              }`}
            >
              {t.nextCard.all}
            </button>
            {SUITS.map((s) => (
              <button
                key={s}
                onClick={() => setSuitFilter(s)}
                style={{
                  border:
                    suitFilter === s
                      ? `2px solid ${SC[s]}`
                      : "1px solid rgba(255,255,255,0.1)",
                  background:
                    suitFilter === s ? `${SC[s]}22` : "transparent",
                  color: SC[s],
                }}
                className="py-0.5 px-2 rounded text-[13px] font-bold cursor-pointer"
              >
                {SS[s]}
              </button>
            ))}
          </div>
        </div>

        <span className="text-[11px] text-slate-500 font-mono">
          {filtered.length}
          {t.nextCard.cards}
        </span>
      </div>

      {/* CHART VIEW */}
      {viewMode === "chart" && (
        <div className="overflow-y-auto max-h-[520px] pr-1">
          {useDoubleColumn ? (
            <div className="flex gap-3">
              <div className="flex-1 min-w-0">
                {leftCol.map((item) => renderBarItem(item))}
              </div>
              <div className="flex-1 min-w-0">
                {rightCol.map((item) => renderBarItem(item))}
              </div>
            </div>
          ) : (
            sorted.map((item) => renderBarItem(item))
          )}
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1.5 max-h-[520px] overflow-y-auto">
          {sorted.map((item) => {
            const eq = item.equities[sortBy];
            const isGood = eq > avgEq + 5;
            const isBad = eq < avgEq - 5;
            const suit = item.card[1] as Suit;

            return (
              <div
                key={item.card}
                onClick={() => onCardClick?.(item.card)}
                className={`rounded p-2 flex flex-col items-center gap-1 transition-transform duration-150 ${
                  onCardClick
                    ? "cursor-pointer hover:scale-105"
                    : "cursor-default"
                } ${
                  isGood
                    ? "bg-emerald-500/15 border border-emerald-500/30"
                    : isBad
                      ? "bg-red-500/15 border border-red-500/30"
                      : "bg-slate-700 border border-slate-600"
                }`}
              >
                <div className="flex items-center gap-0.5">
                  <span
                    style={{ color: SC[suit] }}
                    className="text-[13px] font-bold"
                  >
                    {item.card[0]}
                  </span>
                  <span style={{ color: SC[suit] }} className="text-xs">
                    {SS[suit]}
                  </span>
                </div>
                <span
                  className={`text-xs font-extrabold font-mono ${
                    isGood
                      ? "text-emerald-400"
                      : isBad
                        ? "text-red-400"
                        : "text-slate-300"
                  }`}
                >
                  {eq.toFixed(1)}%
                </span>
                <div className="w-full flex flex-col gap-px">
                  {item.equities.map((peq, pi) => (
                    <div
                      key={pi}
                      className="h-[3px] bg-slate-600 rounded-sm overflow-hidden"
                    >
                      <div
                        style={{
                          width: `${peq}%`,
                          background: PC[pi],
                        }}
                        className="h-full rounded-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary stats */}
      <div className="mt-3 py-2 px-3 bg-slate-900 rounded flex gap-5 flex-wrap justify-center">
        {Array.from({ length: numPlayers }).map((_, pi) => {
          const eqs = data.map((d) => d.equities[pi]);
          const best = Math.max(...eqs).toFixed(1);
          const worst = Math.min(...eqs).toFixed(1);
          const avg = (eqs.reduce((a, b) => a + b, 0) / eqs.length).toFixed(1);
          const goodCards = data.filter((d) => d.equities[pi] > 60).length;
          return (
            <div key={pi} className="text-center">
              <div
                style={{ color: PC[pi] }}
                className="text-[11px] font-bold mb-1"
              >
                Player {pi + 1}
              </div>
              <div className="text-[10px] text-slate-500 font-mono leading-relaxed">
                {t.nextCard.best}:{" "}
                <span className="text-emerald-400">{best}%</span> ·{" "}
                {t.nextCard.worst}:{" "}
                <span className="text-red-400">{worst}%</span>
                <br />
                {t.nextCard.avg}: {avg}% · {t.nextCard.favorable}
                ({">"}60%):{" "}
                <span className="text-emerald-300">
                  {goodCards}
                  {t.nextCard.cards}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
