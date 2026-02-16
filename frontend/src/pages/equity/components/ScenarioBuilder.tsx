/* ═══ ScenarioBuilder — Preset + Custom scenario generation ═══ */

import { useState, useEffect } from "react";
import type { GameType, HandOptionId, ScenarioResult } from "../types.ts";
import {
  MADE_HANDS,
  DRAWS,
  EXTRAS,
  MADE_STRENGTH,
  DRAW_PRODUCES,
  MADE_IDS,
  DRAW_IDS,
  PRESETS,
  PRESET_NAMES,
  PC,
} from "../constants.ts";
import { useT, useLang } from "../i18n.ts";
import { generateScenario } from "../logic/scenario.ts";

interface ScenarioBuilderProps {
  onApply: (scenario: ScenarioResult) => void;
  gameType: GameType;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function ScenarioBuilder({
  onApply,
  gameType,
  open,
  setOpen,
}: ScenarioBuilderProps) {
  const t = useT();
  const lang = useLang();
  const [tab, setTab] = useState<"presets" | "custom">("presets");
  const [p1s, setP1s] = useState<HandOptionId[]>([]);
  const [p2s, setP2s] = useState<HandOptionId[]>([]);
  const [err, setErr] = useState("");
  const [gen, setGen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const smartToggle = (
    sel: HandOptionId[],
    set: React.Dispatch<React.SetStateAction<HandOptionId[]>>,
    id: HandOptionId
  ) => {
    if (sel.includes(id)) {
      set(sel.filter((x) => x !== id));
      return;
    }
    let ns = [...sel];
    if (MADE_IDS.has(id)) {
      ns = ns.filter((x) => !MADE_IDS.has(x));
      const mr = MADE_STRENGTH[id as keyof typeof MADE_STRENGTH];
      ns = ns.filter((x) => {
        if (DRAW_IDS.has(x)) {
          const dp = DRAW_PRODUCES[x as keyof typeof DRAW_PRODUCES];
          return dp !== undefined && mr !== undefined && dp > mr;
        }
        return true;
      });
      ns.push(id);
    } else if (DRAW_IDS.has(id)) {
      const sm = ns.find((x) => MADE_IDS.has(x));
      if (sm) {
        const dp = DRAW_PRODUCES[id as keyof typeof DRAW_PRODUCES];
        const ms = MADE_STRENGTH[sm as keyof typeof MADE_STRENGTH];
        if (dp !== undefined && ms !== undefined && dp <= ms) return;
      }
      if (ns.length < 3) ns.push(id);
    } else {
      if (ns.length < 3) ns.push(id);
    }
    set(ns);
  };

  const isOptDisabled = (sel: HandOptionId[], id: HandOptionId): boolean => {
    if (sel.includes(id)) return false;
    if (DRAW_IDS.has(id)) {
      const sm = sel.find((x) => MADE_IDS.has(x));
      if (sm) {
        const dp = DRAW_PRODUCES[id as keyof typeof DRAW_PRODUCES];
        const ms = MADE_STRENGTH[sm as keyof typeof MADE_STRENGTH];
        if (dp !== undefined && ms !== undefined && dp <= ms) return true;
      }
    }
    return !MADE_IDS.has(id) && !DRAW_IDS.has(id) ? sel.length >= 3 : false;
  };

  const apply = (pr: { p1: HandOptionId[]; p2: HandOptionId[] }) => {
    setGen(true);
    setErr("");
    setTimeout(() => {
      const r = generateScenario(pr.p1, pr.p2, gameType);
      if (r) {
        onApply(r);
        setErr("");
      } else {
        setErr(t.scenario.failRetry);
      }
      setGen(false);
    }, 50);
  };

  const custom = () => {
    if (!p1s.length || !p2s.length) {
      setErr(t.scenario.selectAtLeast);
      return;
    }
    setGen(true);
    setErr("");
    setTimeout(() => {
      const r = generateScenario(p1s, p2s, gameType);
      if (r) {
        onApply(r);
        setErr("");
      } else {
        setErr(t.scenario.failHard);
      }
      setGen(false);
    }, 50);
  };

  // ESC key handler
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, setOpen]);

  const handName = (id: HandOptionId) => t.hands[id] || id;

  const renderOpts = (
    sel: HandOptionId[],
    setSel: React.Dispatch<React.SetStateAction<HandOptionId[]>>,
    label: "P1" | "P2"
  ) => (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2.5">
        <div
          style={{ background: PC[label === "P1" ? 0 : 1] }}
          className="w-6 h-6 rounded-full text-white flex items-center justify-center font-extrabold text-[11px]"
        >
          {label === "P1" ? 1 : 2}
        </div>
        <span className="font-bold text-[13px] text-slate-300">{label}</span>
        <span className="text-[11px] text-slate-500">({sel.length}/3)</span>
      </div>
      {[
        {
          key: "madeHands",
          label: t.categories.madeHands,
          items: MADE_HANDS,
          bg: "bg-emerald-500/[0.08]",
        },
        {
          key: "draws",
          label: t.categories.draws,
          items: DRAWS,
          bg: "bg-blue-500/[0.08]",
        },
        {
          key: "others",
          label: t.categories.others,
          items: EXTRAS,
          bg: "bg-purple-500/[0.08]",
        },
      ].map((g) => {
        const colKey = `${label}_${g.key}`;
        const isCollapsed = collapsed[colKey];
        return (
          <div key={g.key} className="mb-1.5">
            <div
              className={`px-3 py-2 mb-1 rounded-lg ${g.bg} flex items-center justify-between cursor-pointer select-none`}
              onClick={() => toggleCollapse(colKey)}
            >
              <span className="text-[11px] text-slate-400 font-bold tracking-wide">
                {g.label}
              </span>
              <span className="text-[10px] text-slate-500">
                {isCollapsed ? "\u25B6" : "\u25BC"}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex gap-1 flex-wrap px-1 py-1.5">
                {g.items.map((o) => {
                  const dis = isOptDisabled(sel, o.id);
                  const selected = sel.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => !dis && smartToggle(sel, setSel, o.id)}
                      disabled={dis}
                      className={`py-1 px-2.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all duration-150 ${
                        selected
                          ? "border-2 border-indigo-500 bg-indigo-500/20 text-indigo-300"
                          : dis
                            ? "border-[1.5px] border-white/10 bg-white/[0.02] text-slate-600 cursor-not-allowed opacity-40"
                            : "border-[1.5px] border-white/10 bg-white/[0.04] text-slate-400 cursor-pointer"
                      }`}
                    >
                      {handName(o.id)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full py-3.5 px-5 rounded-xl text-sm font-bold cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-200 ${
          open
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none"
            : "bg-gradient-to-br from-indigo-500/15 to-purple-600/15 text-indigo-300 border-[1.5px] border-indigo-500/30"
        }`}
      >
        {t.scenario.title}
        <span
          className={`text-[11px] font-normal ${
            open ? "text-white/70" : "text-indigo-400/60"
          }`}
        >
          {open ? t.scenario.close : t.scenario.presetAndCustom}
        </span>
      </button>

      {/* Overlay modal */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 z-[9999] animate-fadeIn"
          />
          {/* Modal */}
          <div className="absolute top-full left-0 right-0 mt-2 w-full max-h-[70vh] overflow-y-auto bg-[rgba(15,12,41,0.98)] backdrop-blur-xl rounded-xl border border-white/[0.12] z-[10000] animate-fadeIn shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            {/* Header */}
            <div className="px-4 py-4 border-b border-white/[0.06] flex items-center justify-between sticky top-0 bg-[rgba(15,12,41,0.98)] z-10 rounded-t-xl">
              <span className="text-[15px] font-extrabold text-slate-300">
                {t.scenario.title}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="bg-white/[0.08] border-none rounded-lg py-1.5 px-3 text-slate-500 text-xs cursor-pointer font-semibold"
              >
                {t.scenario.close}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-4 pt-3 gap-2">
              {(
                [
                  { id: "presets" as const, l: t.scenario.preset },
                  { id: "custom" as const, l: t.scenario.custom },
                ] as const
              ).map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className={`flex-1 py-2.5 px-4 rounded-[10px] cursor-pointer text-[13px] font-bold transition-all duration-200 ${
                    tab === tb.id
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-[0_4px_12px_rgba(102,126,234,0.3)]"
                      : "bg-white/10 text-slate-400 border border-white/20 hover:bg-white/[0.18] hover:-translate-y-px"
                  }`}
                >
                  {tb.l}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4">
              {tab === "presets" && (
                <div className="grid gap-2">
                  {PRESETS.map((pr, i) => (
                    <button
                      key={i}
                      onClick={() => apply(pr)}
                      disabled={gen}
                      className="p-3 px-4 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-slate-300 cursor-pointer text-left flex items-center gap-3 hover:bg-white/[0.08] disabled:cursor-wait"
                    >
                      <div className="flex-1">
                        <div className="text-[13px] font-bold mb-0.5">
                          {PRESET_NAMES[lang]?.[pr.id] || pr.id}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          P1: {pr.p1.map((id) => handName(id)).join("+")} vs
                          P2: {pr.p2.map((id) => handName(id)).join("+")}
                        </div>
                      </div>
                      <span className="text-lg opacity-40">{"\u2192"}</span>
                    </button>
                  ))}
                </div>
              )}

              {tab === "custom" && (
                <div>
                  {renderOpts(p1s, setP1s, "P1")}
                  <div className="h-px bg-white/[0.06] my-4" />
                  {renderOpts(p2s, setP2s, "P2")}

                  {/* Selection summary */}
                  {(p1s.length > 0 || p2s.length > 0) && (
                    <div className="bg-white/[0.04] rounded-[10px] p-3 mb-3 border border-white/[0.06]">
                      <div className="text-xs text-slate-400 mb-1">
                        <strong style={{ color: PC[0] }}>P1:</strong>{" "}
                        {p1s.map((id) => handName(id)).join(" + ") ||
                          t.scenario.unselected}
                      </div>
                      <div className="text-xs text-slate-400">
                        <strong style={{ color: PC[1] }}>P2:</strong>{" "}
                        {p2s.map((id) => handName(id)).join(" + ") ||
                          t.scenario.unselected}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={custom}
                      disabled={gen || !p1s.length || !p2s.length}
                      className={`flex-1 p-3 rounded-[10px] border-none text-sm font-bold cursor-pointer ${
                        p1s.length && p2s.length
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                          : "bg-white/[0.08] text-slate-500"
                      } disabled:cursor-not-allowed`}
                    >
                      {gen ? t.scenario.generating : t.scenario.generate}
                    </button>
                    <button
                      onClick={() => {
                        setP1s([]);
                        setP2s([]);
                        setErr("");
                      }}
                      className="p-3 px-4 rounded-[10px] border border-white/10 bg-transparent text-slate-500 text-xs font-semibold cursor-pointer"
                    >
                      {t.scenario.reset}
                    </button>
                  </div>
                </div>
              )}

              {err && (
                <div className="mt-3 py-2.5 px-3.5 rounded-lg bg-red-500/15 text-red-500 text-xs font-semibold">
                  {err}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
