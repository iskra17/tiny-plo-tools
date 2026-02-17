import { useReducer, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useRangeData, type HandActionEntry } from '../../hooks/useRangeData';
import { useAppContext } from '../../context/AppContext';
import {
  shuffle,
  getFeedbackTier,
  calculateEvLoss,
  computeSessionStats,
  filterByDifficulty,
  filterByCategory,
  DIFFICULTY_OPTIONS,
  TIMER_OPTIONS,
  type HistoryEntry,
  type TierName,
  type DifficultyLevel,
  type TimerSeconds,
} from './quizUtils';
import { QuizHeader } from './QuizHeader';
import { QuizQuestion } from './QuizQuestion';
import { QuizFeedback } from './QuizFeedback';
import { QuizHistory } from './QuizHistory';
import { QuizReport } from './QuizReport';
import { DifficultySelector } from './DifficultySelector';
import { ALL_CATEGORIES, CATEGORY_LABELS, type HandCategory } from '../../utils/handCategories';

// ---------- State ----------
type Phase = 'question' | 'feedback';

interface QuizState {
  phase: Phase;
  pool: string[];         // shuffled hand keys
  poolIndex: number;
  currentHand: string;
  chosenAction: string;
  tier: TierName;
  evLoss: number;
  currentActions: Record<string, { frequency: number; ev: number }>;
  history: HistoryEntry[];
}

type QuizAction =
  | { type: 'START'; pool: string[]; hand: string }
  | { type: 'ANSWER'; action: string; entry: HandActionEntry; actionOrder: string[] }
  | { type: 'NEXT'; hand: string; pool: string[]; poolIndex: number };

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        phase: 'question',
        pool: action.pool,
        poolIndex: 1,
        currentHand: action.hand,
        chosenAction: '',
        tier: 'Blunder',
        evLoss: 0,
        currentActions: {},
        history: [],
      };

    case 'ANSWER': {
      const { entry, actionOrder } = action;
      const totalFreq = Object.values(entry.actions).reduce((s, a) => s + a.frequency, 0);
      const chosenData = entry.actions[action.action];
      const chosenFreq = chosenData ? chosenData.frequency / (totalFreq || 1) : 0;

      // Is this the primary (highest freq) action?
      let maxFreq = 0;
      for (const name of actionOrder) {
        const d = entry.actions[name];
        if (d && d.frequency > maxFreq) maxFreq = d.frequency;
      }
      const isPrimary = chosenData ? chosenData.frequency >= maxFreq - 0.0001 : false;

      const tier = getFeedbackTier(chosenFreq, isPrimary);

      // EV loss (exclude NaN from derived actions)
      let maxEv = -Infinity;
      for (const d of Object.values(entry.actions)) {
        if (!isNaN(d.ev) && d.ev > maxEv) maxEv = d.ev;
      }
      const chosenEv = chosenData && !isNaN(chosenData.ev) ? chosenData.ev : NaN;
      const evLoss = !isNaN(chosenEv) && maxEv > -Infinity ? calculateEvLoss(maxEv, chosenEv) : 0;

      const historyEntry: HistoryEntry = {
        hand: state.currentHand,
        chosenAction: action.action,
        tier,
        evLoss,
        actions: entry.actions,
      };

      return {
        ...state,
        phase: 'feedback',
        chosenAction: action.action,
        tier,
        evLoss,
        currentActions: entry.actions,
        history: [...state.history, historyEntry],
      };
    }

    case 'NEXT':
      return {
        ...state,
        phase: 'question',
        currentHand: action.hand,
        pool: action.pool,
        poolIndex: action.poolIndex,
        chosenAction: '',
        tier: 'Blunder',
        evLoss: 0,
        currentActions: {},
      };

    default:
      return state;
  }
}

const INITIAL_STATE: QuizState = {
  phase: 'question',
  pool: [],
  poolIndex: 0,
  currentHand: '',
  chosenAction: '',
  tier: 'Blunder',
  evLoss: 0,
  currentActions: {},
  history: [],
};

// ---------- Helpers ----------
function buildPool(
  handActionMap: Map<string, HandActionEntry>,
  difficulty: DifficultyLevel,
  category: HandCategory | null,
): string[] {
  const allKeys = Array.from(handActionMap.keys());
  let filtered = filterByDifficulty(allKeys, difficulty, handActionMap);
  filtered = filterByCategory(filtered, category);
  return shuffle(filtered.length > 0 ? filtered : allKeys);
}

// ---------- Component ----------
interface Props {
  onExit: () => void;
}

export function QuizPanel({ onExit }: Props) {
  const { handActionMap, actionOrder, loading, noData } = useRangeData();
  const { dispatch } = useAppContext();
  const [state, quizDispatch] = useReducer(quizReducer, INITIAL_STATE);
  const initialized = useRef(false);

  // Settings state
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('normal');
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<TimerSeconds>(15);
  const [categoryFilter, setCategoryFilter] = useState<HandCategory | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Compute pool counts for each difficulty level
  const poolCounts = useMemo(() => {
    const allKeys = Array.from(handActionMap.keys());
    const counts: Record<DifficultyLevel, number> = { easy: 0, normal: 0, hard: 0, expert: 0 };
    for (const level of Object.keys(DIFFICULTY_OPTIONS) as DifficultyLevel[]) {
      let filtered = filterByDifficulty(allKeys, level, handActionMap);
      filtered = filterByCategory(filtered, categoryFilter);
      counts[level] = filtered.length;
    }
    return counts;
  }, [handActionMap, categoryFilter]);

  // Category counts for current difficulty
  const categoryCounts = useMemo(() => {
    const allKeys = Array.from(handActionMap.keys());
    const filtered = filterByDifficulty(allKeys, difficulty, handActionMap);
    const counts: Record<string, number> = {};
    for (const cat of ALL_CATEGORIES) {
      counts[cat] = filterByCategory(filtered, cat).length;
    }
    return counts;
  }, [handActionMap, difficulty]);

  // Initialize pool when data is ready
  useEffect(() => {
    if (loading || noData || handActionMap.size === 0 || initialized.current) return;
    initialized.current = true;
    const pool = buildPool(handActionMap, difficulty, categoryFilter);
    const hand = pool[0];
    quizDispatch({ type: 'START', pool, hand });
    dispatch({ type: 'SET_SELECTED_HANDS', payload: [hand] });
  }, [loading, noData, handActionMap, dispatch, difficulty, categoryFilter]);

  // Reset init flag if data source changes
  useEffect(() => {
    initialized.current = false;
  }, [actionOrder]);

  // Restart quiz with current settings (shared logic)
  const restartQuiz = useCallback((overrideDifficulty?: DifficultyLevel, overrideCategory?: HandCategory | null) => {
    if (handActionMap.size === 0) return;
    const d = overrideDifficulty ?? difficulty;
    const c = overrideCategory !== undefined ? overrideCategory : categoryFilter;
    const pool = buildPool(handActionMap, d, c);
    const hand = pool[0];
    setReviewMode(false);
    setShowReport(false);
    quizDispatch({ type: 'START', pool, hand });
    dispatch({ type: 'SET_SELECTED_HANDS', payload: [hand] });
  }, [handActionMap, dispatch, difficulty, categoryFilter]);

  // Re-shuffle pool when difficulty changes
  const handleDifficultyChange = useCallback((level: DifficultyLevel) => {
    setDifficulty(level);
    setReviewMode(false);
    restartQuiz(level);
  }, [restartQuiz]);

  // Category filter change
  const handleCategoryChange = useCallback((cat: HandCategory | null) => {
    setCategoryFilter(cat);
    setReviewMode(false);
    if (handActionMap.size === 0) return;
    const pool = buildPool(handActionMap, difficulty, cat);
    const hand = pool[0];
    quizDispatch({ type: 'START', pool, hand });
    dispatch({ type: 'SET_SELECTED_HANDS', payload: [hand] });
  }, [handActionMap, dispatch, difficulty]);

  const handleAnswer = useCallback((action: string) => {
    const entry = handActionMap.get(state.currentHand);
    if (!entry) return;
    quizDispatch({ type: 'ANSWER', action, entry, actionOrder });
  }, [handActionMap, state.currentHand, actionOrder]);

  // Timer timeout: pick the lowest-frequency action (Blunder)
  const handleTimeout = useCallback(() => {
    const entry = handActionMap.get(state.currentHand);
    if (!entry || state.phase !== 'question') return;
    // Find lowest frequency action
    let minFreq = Infinity;
    let worstAction = actionOrder[0];
    for (const name of actionOrder) {
      const d = entry.actions[name];
      if (d && d.frequency < minFreq) {
        minFreq = d.frequency;
        worstAction = name;
      }
    }
    quizDispatch({ type: 'ANSWER', action: worstAction, entry, actionOrder });
  }, [handActionMap, state.currentHand, state.phase, actionOrder]);

  const handleNext = useCallback(() => {
    let { pool, poolIndex } = state;

    // Review mode: if pool exhausted, end review
    if (reviewMode && poolIndex >= pool.length) {
      setReviewMode(false);
      // Resume normal quiz with fresh pool
      const newPool = buildPool(handActionMap, difficulty, categoryFilter);
      const hand = newPool[0];
      quizDispatch({ type: 'NEXT', hand, pool: newPool, poolIndex: 1 });
      dispatch({ type: 'SET_SELECTED_HANDS', payload: [hand] });
      return;
    }

    // If pool exhausted, reshuffle with current filters
    if (poolIndex >= pool.length) {
      pool = buildPool(handActionMap, difficulty, categoryFilter);
      poolIndex = 0;
    }
    const hand = pool[poolIndex];
    quizDispatch({ type: 'NEXT', hand, pool, poolIndex: poolIndex + 1 });
    dispatch({ type: 'SET_SELECTED_HANDS', payload: [hand] });
  }, [state, handActionMap, dispatch, difficulty, categoryFilter, reviewMode]);

  // Start review mode
  const handleStartReview = useCallback(() => {
    const wrongHands = state.history
      .filter(h => h.tier !== 'Perfect' && h.tier !== 'Correct')
      .map(h => h.hand);
    // Deduplicate
    const unique = [...new Set(wrongHands)];
    if (unique.length === 0) return;
    const pool = shuffle([...unique]);
    const hand = pool[0];
    setReviewMode(true);
    quizDispatch({ type: 'NEXT', hand, pool, poolIndex: 1 });
    dispatch({ type: 'SET_SELECTED_HANDS', payload: [hand] });
  }, [state.history, dispatch]);

  // Show report
  const handleShowReport = useCallback(() => setShowReport(true), []);
  const handleRestart = useCallback(() => restartQuiz(), [restartQuiz]);

  const stats = computeSessionStats(state.history);

  // Loading / no data states
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <QuizHeader stats={stats} onExit={onExit} />
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Loading range data...</div>
      </div>
    );
  }

  if (noData || handActionMap.size === 0) {
    return (
      <div className="flex flex-col h-full">
        <QuizHeader stats={stats} onExit={onExit} />
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          No hands available for this node. Navigate to a node with data first.
        </div>
      </div>
    );
  }

  // Report view
  if (showReport) {
    return (
      <div className="flex flex-col h-full">
        <QuizHeader stats={stats} onExit={onExit} />
        <div className="flex-1 overflow-y-auto">
          <QuizReport stats={stats} history={state.history} onRestart={handleRestart} onExit={onExit} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <QuizHeader stats={stats} reviewMode={reviewMode} onExit={onExit} />

      {/* Settings bar: difficulty + category + timer */}
      <div className="px-3 py-2 border-b border-slate-700 space-y-2">
        {/* Difficulty + Timer row */}
        <div className="flex items-center gap-3">
          <DifficultySelector
            selected={difficulty}
            poolCounts={poolCounts}
            onChange={handleDifficultyChange}
          />
          <div className="ml-auto flex items-center gap-1.5">
            {/* Report button */}
            {stats.total >= 5 && (
              <button
                onClick={handleShowReport}
                className="text-[10px] px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              >
                Report
              </button>
            )}
            {/* Timer toggle */}
            <button
              onClick={() => setTimerEnabled(!timerEnabled)}
              className={`text-[10px] px-2 py-1 rounded transition-colors ${
                timerEnabled ? 'bg-blue-600/30 text-blue-400 ring-1 ring-blue-500/40' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {'\u23F1'} {timerEnabled ? 'ON' : 'OFF'}
            </button>
            {/* Timer seconds selector */}
            {timerEnabled && (
              <select
                value={timerSeconds}
                onChange={(e) => setTimerSeconds(Number(e.target.value) as TimerSeconds)}
                className="text-[10px] bg-slate-700 text-slate-300 rounded px-1.5 py-1 border-none outline-none"
              >
                {TIMER_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}s</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Category filter chips */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              categoryFilter === null
                ? 'bg-slate-600 text-white ring-1 ring-slate-400/40'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            All
          </button>
          {ALL_CATEGORIES.map(cat => {
            const count = categoryCounts[cat] || 0;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat === categoryFilter ? null : cat)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  cat === categoryFilter
                    ? 'bg-slate-600 text-white ring-1 ring-slate-400/40'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {CATEGORY_LABELS[cat]} <span className="opacity-50">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Review mode indicator */}
        {reviewMode && (
          <div className="flex items-center gap-2 text-[10px] text-orange-400 bg-orange-500/10 rounded px-2 py-1">
            <span>복습 모드: 틀린 핸드 {state.pool.length - state.poolIndex + 1}개 남음</span>
            <button onClick={() => { setReviewMode(false); restartQuiz(); }} className="ml-auto text-slate-400 hover:text-white">취소</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {state.phase === 'question' && state.currentHand && (
          <QuizQuestion
            hand={state.currentHand}
            actionOrder={actionOrder}
            timerEnabled={timerEnabled}
            timerSeconds={timerSeconds}
            onAnswer={handleAnswer}
            onTimeout={handleTimeout}
          />
        )}

        {state.phase === 'feedback' && (
          <QuizFeedback
            hand={state.currentHand}
            chosenAction={state.chosenAction}
            tier={state.tier}
            evLoss={state.evLoss}
            actions={state.currentActions}
            actionOrder={actionOrder}
            streak={stats.streak}
            onNext={handleNext}
          />
        )}

        <QuizHistory
          history={state.history}
          reviewMode={reviewMode}
          onStartReview={handleStartReview}
        />
      </div>
    </div>
  );
}
