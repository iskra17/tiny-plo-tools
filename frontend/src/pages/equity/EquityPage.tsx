/* ═══ EquityPage — Main PLO Equity Calculator page ═══ */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { CardStr, GameType, PlayerResult, NextCardResult, ScenarioResult, Lang } from "./types.ts";
import { LangContext, translations } from "./i18n.ts";
import { FD, shuf } from "./logic/deck.ts";
import { runCalc } from "./logic/poker.ts";
import { calcNextCardEquities } from "./logic/nextCard.ts";

import ScenarioBuilder from "./components/ScenarioBuilder.tsx";
import SettingsBar from "./components/SettingsBar.tsx";
import BoardPanel from "./components/BoardPanel.tsx";
import PlayerPanel from "./components/PlayerPanel.tsx";
import ResultsPanel from "./components/ResultsPanel.tsx";
import NextCardPanel from "./components/NextCardPanel.tsx";
import LoadingSpinner from "./components/LoadingSpinner.tsx";
import LangToggle from "./components/LangToggle.tsx";

export default function EquityPage() {
  /* ── Language ── */
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem("plo-lang") as Lang) || "ko";
    } catch {
      return "ko";
    }
  });
  const changeLang = useCallback((l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem("plo-lang", l);
    } catch {
      /* no-op */
    }
  }, []);

  const t = translations[lang];

  /* ── Core state ── */
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [gt, setGt] = useState<GameType>(4);
  const [np, setNp] = useState(2);
  const [pc, setPc] = useState<CardStr[][]>([[], []]);
  const [bc, setBc] = useState<CardStr[]>([]);
  const [res, setRes] = useState<PlayerResult[] | null>(null);
  const [calc, setCalc] = useState(false);
  const [cm, setCm] = useState<"exact" | "montecarlo">("exact");
  const [pt, setPt] = useState<string | null>(null);
  const [sc, setSc] = useState(30000);
  const [nextCardData, setNextCardData] = useState<NextCardResult[] | null>(null);
  const [nextCardCalc, setNextCardCalc] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Derived ── */
  const allUsed = useMemo(() => {
    const s = new Set<string>();
    for (const p of pc) for (const c of p) s.add(c);
    for (const c of bc) s.add(c);
    return s;
  }, [pc, bc]);

  const ap = pc.slice(0, np);
  const canCalc = ap.every((p) => p.length === gt) && np >= 2;

  /* ── Auto-calc equity ── */
  const apStr = JSON.stringify(ap);
  useEffect(() => {
    if (!canCalc || bc.length < 3) return;
    if (timer.current) clearTimeout(timer.current);
    setCalc(true);
    setCm(5 - bc.length <= 2 ? "exact" : "montecarlo");
    timer.current = setTimeout(() => {
      setRes(runCalc(ap, bc, sc));
      setCalc(false);
    }, 80);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bc, canCalc, apStr, sc]);

  /* ── Auto-calc next card ── */
  useEffect(() => {
    if (!canCalc || bc.length < 3 || bc.length > 4) {
      setNextCardData(null);
      return;
    }
    if (ncTimer.current) clearTimeout(ncTimer.current);
    setNextCardCalc(true);
    ncTimer.current = setTimeout(() => {
      const data = calcNextCardEquities(ap, bc);
      setNextCardData(data);
      setNextCardCalc(false);
    }, 150);
    return () => {
      if (ncTimer.current) clearTimeout(ncTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bc, canCalc, apStr]);

  /* ── Handlers ── */
  const chGt = useCallback((n: GameType) => {
    setGt(n);
    setPc((p) => p.map((x) => x.slice(0, n)));
    setRes(null);
    setNextCardData(null);
  }, []);

  const chNp = useCallback((n: number) => {
    setNp(n);
    setPc((p) => {
      const x = [...p];
      while (x.length < n) x.push([]);
      return x.slice(0, n);
    });
    setRes(null);
    setNextCardData(null);
  }, []);

  const chPc = useCallback(
    (i: number, cards: CardStr[]) => {
      setPc((p) => {
        const x = [...p];
        x[i] = cards;
        return x;
      });
      if (bc.length < 3) {
        setRes(null);
        setNextCardData(null);
      }
    },
    [bc.length]
  );

  const chBc = useCallback((b: CardStr[]) => {
    setBc(b);
    if (b.length < 3) {
      setRes(null);
      setNextCardData(null);
    }
  }, []);

  const rFillP = useCallback(
    (i: number) => {
      const cur = pc[i] || [];
      const need = gt - cur.length;
      if (need <= 0) return;
      const av = FD.filter((c) => !allUsed.has(c));
      chPc(i, [...cur, ...shuf(av).slice(0, need)]);
    },
    [pc, gt, allUsed, chPc]
  );

  const rFillB = useCallback(
    (tgt: number) => {
      const av = FD.filter((c) => !allUsed.has(c));
      const need = tgt - bc.length;
      if (need <= 0) return;
      chBc([...bc, ...shuf(av).slice(0, need)]);
    },
    [allUsed, bc, chBc]
  );

  const manCalc = useCallback(() => {
    if (!canCalc) return;
    setCalc(true);
    setCm(5 - bc.length <= 2 ? "exact" : "montecarlo");
    setTimeout(() => {
      setRes(runCalc(ap, bc, sc));
      setCalc(false);
    }, 50);
  }, [canCalc, bc, ap, sc]);

  const clearAll = useCallback(() => {
    setPc(Array.from({ length: np }, () => []));
    setBc([]);
    setRes(null);
    setPt(null);
    setNextCardData(null);
  }, [np]);

  const applyScenario = useCallback(
    (scenario: ScenarioResult) => {
      setNp(2);
      setBc(scenario.board);
      setPc((prev) => {
        const next = [...prev];
        next[0] = scenario.players[0];
        next[1] = scenario.players[1];
        while (next.length < 2) next.push([]);
        return next.slice(0, Math.max(np, 2));
      });
      setRes(null);
      setPt(null);
      setNextCardData(null);
    },
    [np]
  );

  const handleNextCardClick = useCallback(
    (card: CardStr) => {
      if (bc.length < 5 && !allUsed.has(card)) {
        chBc([...bc, card]);
      }
    },
    [bc, allUsed, chBc]
  );

  return (
    <LangContext.Provider value={lang}>
      <div className="h-full bg-slate-900 flex flex-col">
        {/* Header — matches Solver header style */}
        <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-bold text-white">PLO Equity Calculator</h1>
          <LangToggle lang={lang} setLang={changeLang} />
        </header>

        {/* Main 2-column layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel: inputs */}
          <div className="w-2/5 flex flex-col overflow-y-auto border-r border-slate-700">
            <div className="p-3 space-y-3">
              <ScenarioBuilder
                onApply={applyScenario}
                gameType={gt}
                open={scenarioOpen}
                setOpen={setScenarioOpen}
              />

              <SettingsBar
                gt={gt}
                np={np}
                sc={sc}
                onGtChange={chGt}
                onNpChange={chNp}
                onScChange={setSc}
              />

              <BoardPanel
                bc={bc}
                onBcChange={chBc}
                allUsed={allUsed}
                pickerTarget={pt}
                setPickerTarget={setPt}
                onRandomFill={rFillB}
                canCalc={canCalc}
              />

              {/* Players */}
              <div className="space-y-2">
                {Array.from({ length: np }).map((_, i) => (
                  <PlayerPanel
                    key={i}
                    index={i}
                    cards={pc[i] || []}
                    gameType={gt}
                    onChange={(c) => chPc(i, c)}
                    allUsed={allUsed}
                    pickerTarget={pt}
                    setPickerTarget={setPt}
                    onRandom={() => rFillP(i)}
                    boardCards={bc}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={manCalc}
                  disabled={!canCalc || calc}
                  className={`flex-1 py-2 px-4 border-none rounded text-sm font-bold ${
                    canCalc && !calc
                      ? "bg-blue-600 text-white cursor-pointer hover:bg-blue-500"
                      : "bg-slate-700 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {calc
                    ? t.calc.calculating
                    : bc.length >= 3
                      ? t.calc.recalc
                      : t.calc.calcEquity}
                </button>
                <button
                  onClick={clearAll}
                  className="py-2 px-3 bg-red-500/15 text-red-400 border border-red-500/20 rounded text-xs font-bold cursor-pointer hover:bg-red-500/25"
                >
                  {t.calc.clearAll}
                </button>
              </div>

              {/* Help */}
              <div className="p-3 bg-slate-800 rounded border border-slate-700">
                <h4 className="m-0 mb-2 text-xs font-bold text-slate-400">
                  {t.usage.title}
                </h4>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  <p className="m-0 mb-1">
                    <strong className="text-slate-400">{t.usage.scenario}</strong>{" "}
                    {t.usage.scenarioDesc}
                  </p>
                  <p className="m-0 mb-1">
                    <strong className="text-slate-400">{t.usage.input}</strong>{" "}
                    {t.usage.inputDesc}
                  </p>
                  <p className="m-0 mb-1">
                    <strong className="text-slate-400">{t.usage.autoCalc}</strong>{" "}
                    {t.usage.autoCalcDesc}
                  </p>
                  <p className="m-0 mb-1">
                    <strong className="text-emerald-400">{t.usage.cardClick}</strong>{" "}
                    {t.usage.cardClickDesc}
                  </p>
                  <p className="m-0 mb-1">
                    <strong className="text-emerald-400">
                      {t.usage.flopTurnRiver}
                    </strong>{" "}
                    {t.usage.exactDesc} ·{" "}
                    <strong className="text-red-400">{t.usage.preflopLabel}</strong>{" "}
                    {t.usage.mcDesc}
                  </p>
                  <p className="m-0">
                    <strong className="text-slate-400">{t.usage.notation}</strong>{" "}
                    {t.usage.notationDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: results */}
          <div className="w-3/5 flex flex-col overflow-y-auto">
            <div className="p-3 space-y-3">
              {calc && <LoadingSpinner method={cm} />}
              {!calc && res && (
                <ResultsPanel
                  results={res}
                  playerCards={pc}
                  boardCards={bc}
                />
              )}

              {nextCardCalc && <LoadingSpinner method="exact" />}
              {!nextCardCalc && nextCardData && (
                <NextCardPanel
                  data={nextCardData}
                  playerCards={pc}
                  boardLen={bc.length}
                  onCardClick={handleNextCardClick}
                />
              )}

              {!calc && !res && !nextCardCalc && !nextCardData && (
                <div className="bg-slate-800 rounded border border-slate-700 py-16 px-5 text-center">
                  <div className="text-4xl mb-3 opacity-30">&#x1F4CA;</div>
                  <p className="text-slate-500 text-sm m-0 whitespace-pre-line">
                    {t.emptyState}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LangContext.Provider>
  );
}
