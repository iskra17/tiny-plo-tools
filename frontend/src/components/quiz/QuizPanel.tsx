import { useReducer, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useRangeData, type HandActionEntry } from '../../hooks/useRangeData';
import { useAppContext } from '../../context/AppContext';
import {
  shuffle,
  getFeedbackTier,
  calculateEvLoss,
  computeSessionStats,
  filterByDifficulty,
  DIFFICULTY_OPTIONS,
  type HistoryEntry,
  type TierName,
  type DifficultyLevel,
} from './quizUtils';
import { QuizHeader } from './QuizHeader';
import { QuizQuestion } from './QuizQuestion';
import { QuizFeedback } from './QuizFeedback';
import { QuizHistory } from './QuizHistory';
import { DifficultySelector } from './DifficultySelector';

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

// ---------- Component ----------
interface Props {
  onExit: () => void;
}

export function QuizPanel({ onExit }: Props) {
  const { handActionMap, actionOrder, loading, noData } = useRangeData();
  const { dispatch } = useAppContext();
  const [state, quizDispatch] = useReducer(quizReducer, INITIAL_STATE);
  const initialized = useRef(false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');

  // Compute pool counts for each difficulty level
  const poolCounts = useMemo(() => {
    const allKeys = Array.from(handActionMap.keys());
    const counts: Record<DifficultyLevel, number> = { easy: 0, normal: 0, hard: 0, expert: 0 };
    for (const level of Object.keys(DIFFICULTY_OPTIONS) as DifficultyLevel[]) {
      counts[level] = filterByDifficulty(allKeys, level, handActionMap).length;
    }
    return counts;
  }, [handActionMap]);

  // Initialize pool when data is ready
  useEffect(() => {
    if (loading || noData || handActionMap.size === 0 || initialized.current) return;
    initialized.current = true;
    const allKeys = Array.from(handActionMap.keys());
    const filtered = filterByDifficulty(allKeys, difficulty, handActionMap);
    const pool = shuffle(filtered.length > 0 ? filtered : allKeys);
    const hand = pool[0];
    quizDispatch({ type: 'START', pool, hand });
    dispatch({ type: 'SET_SELECTED_HANDS', payload: [hand] });
  }, [loading, noData, handActionMap, dispatch, difficulty]);

  // Reset init flag if data source changes
  useEffect(() => {
    initialized.current = false;
  }, [actionOrder]);

  // Re-shuffle pool when difficulty changes (if already initialized)
  const handleDifficultyChange = useCallback((level: DifficultyLevel) => {
    setDifficulty(level);
    if (handActionMap.size === 0) return;
    const allKeys = Array.from(handActionMap.keys());
    const filtered = filterByDifficulty(allKeys, level, handActionMap);
    const pool = shuffle(filtered.length > 0 ? filtered : allKeys);
    const hand = pool[0];
    quizDispatch({ type: 'START', pool, hand });
    dispatch({ type: 'SET_SELECTED_HANDS', payload: [hand] });
  }, [handActionMap, dispatch]);

  const handleAnswer = useCallback((action: string) => {
    const entry = handActionMap.get(state.currentHand);
    if (!entry) return;
    quizDispatch({ type: 'ANSWER', action, entry, actionOrder });
  }, [handActionMap, state.currentHand, actionOrder]);

  const handleNext = useCallback(() => {
    let { pool, poolIndex } = state;
    // If pool exhausted, reshuffle with difficulty filter
    if (poolIndex >= pool.length) {
      const allKeys = Array.from(handActionMap.keys());
      const filtered = filterByDifficulty(allKeys, difficulty, handActionMap);
      pool = shuffle(filtered.length > 0 ? filtered : allKeys);
      poolIndex = 0;
    }
    const hand = pool[poolIndex];
    quizDispatch({ type: 'NEXT', hand, pool, poolIndex: poolIndex + 1 });
    dispatch({ type: 'SET_SELECTED_HANDS', payload: [hand] });
  }, [state, handActionMap, dispatch, difficulty]);

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

  return (
    <div className="flex flex-col h-full">
      <QuizHeader stats={stats} onExit={onExit} />

      {/* Difficulty selector */}
      <div className="px-3 py-2 border-b border-slate-700">
        <DifficultySelector
          selected={difficulty}
          poolCounts={poolCounts}
          onChange={handleDifficultyChange}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {state.phase === 'question' && state.currentHand && (
          <QuizQuestion
            hand={state.currentHand}
            actionOrder={actionOrder}
            onAnswer={handleAnswer}
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
            onNext={handleNext}
          />
        )}

        <QuizHistory history={state.history} />
      </div>
    </div>
  );
}
