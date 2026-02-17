/* ═══ SettingsBar — Game type, player count, simulation settings ═══ */

import type { GameType } from "../types.ts";
import { useT } from "../i18n.ts";

interface SettingsBarProps {
  gt: GameType;
  np: number;
  sc: number;
  onGtChange: (gt: GameType) => void;
  onNpChange: (np: number) => void;
  onScChange: (sc: number) => void;
}

function GBtn({
  label,
  selected,
  onClick,
  extraStyle,
}: {
  label: string | number;
  selected: boolean;
  onClick: () => void;
  extraStyle?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={extraStyle}
      className={`font-mono font-bold text-xs rounded cursor-pointer ${
        selected
          ? "bg-blue-600 text-white border border-blue-500"
          : "bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600"
      } ${!extraStyle?.width ? "px-3 py-1.5" : ""}`}
    >
      {label}
    </button>
  );
}

export default function SettingsBar({
  gt,
  np,
  sc,
  onGtChange,
  onNpChange,
  onScChange,
}: SettingsBarProps) {
  const t = useT();

  return (
    <div className="bg-slate-800 rounded border border-slate-700 p-3">
      <div className="flex gap-4 flex-wrap items-center">
        {/* Game Type */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 tracking-wider mb-1.5 block uppercase">
            {t.settings.gameType}
          </label>
          <div className="flex gap-1">
            {([4, 5, 6] as GameType[]).map((n) => (
              <GBtn
                key={n}
                label={`PLO${n}`}
                selected={gt === n}
                onClick={() => onGtChange(n)}
              />
            ))}
          </div>
        </div>

        {/* Players */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 tracking-wider mb-1.5 block uppercase">
            {t.settings.players}
          </label>
          <div className="flex gap-1">
            {[2, 3, 4, 5, 6].map((n) => (
              <GBtn
                key={n}
                label={n}
                selected={np === n}
                onClick={() => onNpChange(n)}
                extraStyle={{ width: 32, height: 30, padding: 0 }}
              />
            ))}
          </div>
        </div>

        {/* Simulation */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 tracking-wider mb-1.5 block uppercase">
            {t.settings.simulation}{" "}
            <span className="text-slate-600 font-normal">({t.settings.preflop})</span>
          </label>
          <div className="flex gap-1">
            {[10000, 30000, 100000].map((n) => (
              <GBtn
                key={n}
                label={n >= 1000 ? `${n / 1000}K` : String(n)}
                selected={sc === n}
                onClick={() => onScChange(n)}
                extraStyle={{ fontSize: 11, padding: "6px 10px" }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
