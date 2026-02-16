/* ═══ ResultsPanel — Equity results display with bars ═══ */

import type { CardStr, PlayerResult, Suit } from "../types.ts";
import { PC, SC, SBG, SS } from "../constants.ts";
import { useT } from "../i18n.ts";

interface ResultsPanelProps {
  results: PlayerResult[] | null;
  playerCards: CardStr[][];
  boardCards: CardStr[];
}

export default function ResultsPanel({
  results,
  playerCards,
  boardCards,
}: ResultsPanelProps) {
  const t = useT();
  if (!results) return null;

  const method = results[0]?.method;
  const total = results[0]?.total;

  return (
    <div className="bg-white/[0.06] backdrop-blur-md rounded-xl p-5 border border-white/10 animate-fadeIn">
      {/* Header */}
      <h3 className="m-0 mb-4 text-base font-extrabold text-slate-300 flex items-center gap-2 flex-wrap">
        <span>{t.results.title}</span>
        {boardCards && boardCards.length > 0 ? (
          <div className="flex gap-0.5 items-center">
            {boardCards.map((c, i) => {
              const suit = c[1] as Suit;
              return (
                <div
                  key={i}
                  style={{
                    border: `1.5px solid ${SC[suit]}44`,
                    background: `linear-gradient(135deg, white, ${SBG[suit]})`,
                  }}
                  className="w-6 h-8 rounded flex flex-col items-center justify-center"
                >
                  <span
                    style={{ color: SC[suit] }}
                    className="text-[9px] font-bold leading-none"
                  >
                    {c[0]}
                  </span>
                  <span
                    style={{ color: SC[suit] }}
                    className="text-[8px] leading-none"
                  >
                    {SS[suit]}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 font-normal">
            {t.settings.preflop}
          </span>
        )}
        {method === "exact" && (
          <span className="text-[11px] text-emerald-400 font-semibold">
            {t.results.exact}
          </span>
        )}
      </h3>

      {/* Player results */}
      <div className="grid gap-2.5">
        {results.map((r, i) => {
          const color = PC[i % PC.length];
          const eq = parseFloat(r.equity);
          return (
            <div
              key={i}
              style={{ border: `1px solid ${color}33` }}
              className="bg-white/[0.04] rounded-[10px] p-3.5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    style={{ background: color }}
                    className="w-6 h-6 rounded-full text-white flex items-center justify-center font-extrabold text-[11px] font-mono"
                  >
                    {i + 1}
                  </div>
                  <span className="font-bold text-[13px] text-slate-300">
                    P{i + 1}
                  </span>
                  <div className="flex gap-0.5 ml-1">
                    {(playerCards[i] || []).map((c, j) => {
                      const suit = c[1] as Suit;
                      return (
                        <div
                          key={j}
                          style={{
                            border: `2px solid ${SC[suit]}33`,
                            background: `linear-gradient(135deg, white, ${SBG[suit]})`,
                          }}
                          className="w-7 h-[38px] rounded-md flex flex-col items-center justify-center shadow-sm"
                        >
                          <span
                            style={{ color: SC[suit] }}
                            className="text-[10px] font-bold leading-none"
                          >
                            {c[0]}
                          </span>
                          <span
                            style={{ color: SC[suit] }}
                            className="text-[9px] leading-none mt-px"
                          >
                            {SS[suit]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <span
                  style={{ color }}
                  className="text-[22px] font-black font-mono"
                >
                  {r.equity}%
                </span>
              </div>
              {/* Equity bar */}
              <div className="bg-white/[0.06] rounded-md h-2 overflow-hidden mb-1.5">
                <div
                  style={{
                    width: `${eq}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                  }}
                  className="h-full rounded-md transition-[width] duration-500 ease-out"
                />
              </div>
              {/* Stats */}
              <div className="flex gap-4 text-[11px] text-slate-500 font-mono">
                <span>
                  {t.results.win}: {r.win}%
                </span>
                <span>
                  {t.results.tie}: {r.tie}%
                </span>
                <span>
                  {t.results.equity}: {r.equity}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-3.5 text-[11px] text-slate-500 text-center font-mono">
        {method === "exact"
          ? t.results.totalExact(total.toLocaleString())
          : t.results.totalMC(total.toLocaleString())}
      </div>
    </div>
  );
}
