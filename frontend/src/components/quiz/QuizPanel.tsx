import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useRangeData, type HandActionEntry } from '../../hooks/useRangeData';
import { useAppContext } from '../../context/AppContext';
import {
  shuffle,
  getFeedbackTier,
  calculateEvLoss,
  computeSessionStats,
  type HistoryEntry,
  type TierName,
} from './quizUtils';
import { QuizHeader } from './QuizHeader';
import { QuizQuestion } from './QuizQuestion';
import { QuizFeedback } from './QuizFeedback';
import { QuizHistory } from './QuizHistory';

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

      // EV loss
      let maxEv = -Infinity;
      for (const d of Object.values(entry.actions)) {
        if (d.ev > maxEv) maxEv = d.ev;
      }
      const evLoss = chosenData ? calculateEvLoss(maxEv, chosenData.ev) : 0;

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

  // Initialize pool when data is ready
  useEffect(() => {
    if (loading || noData || handActionMap.size === 0 || initialized.current) return;
    initialized.current = true;
    const keys = Array.from(handActionMap.keys());
    const pool = shuffle(keys);
    const hand = pool[0];
    quizDispatch({ type: 'START', pool, hand });
    dispatch({ type: 'SET_SELECTED_HANDS', payload: [hand] });
  }, [loading, noData, handActionMap, dispatch]);

  // Reset init flag if data source changes
  useEffect(() => {
    initialized.current = false;
  }, [actionOrder]);

  const handleAnswer = useCallback((action: string) => {
    const entry = handActionMap.get(state.currentHand);
    if (!entry) return;
    quizDispatch({ type: 'ANSWER', action, entry, actionOrder });
  }, [handActionMap, state.currentHand, actionOrder]);

  const handleNext = useCallback(() => {
    let { pool, poolIndex } = state;
    // If pool exhausted, reshuffle
    if (poolIndex >= pool.length) {
      const keys = Array.from(handActionMap.keys());
      pool = shuffle(keys);
      poolIndex = 0;
    }
    const hand = pool[poolIndex];
    quizDispatch({ type: 'NEXT', hand, pool, poolIndex: poolIndex + 1 });
    dispatch({ type: 'SET_SELECTED_HANDS', payload: [hand] });
  }, [state, handActionMap, dispatch]);

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
