import { createContext, useContext, useReducer, useEffect, useMemo, type ReactNode } from 'react';
import { api, type Simulation, type TreeNode } from '../api/client';
import { POSITIONS_6MAX, type ActionHistoryItem, type SuitFilterType } from '../constants/poker';
import { computeActionSteps, getNextPosition } from '../utils/positionCycle';

// --- State Types ---

interface MatrixState {
  stage: 1 | 2;
  firstTwo: { rank1: string; rank2: string; suited: boolean } | null;
  suitFilter: SuitFilterType;
}

export interface ActionOption {
  code: string;
  label: string;
}

interface AppState {
  simulations: Simulation[];
  currentSimId: number | null;
  simsLoading: boolean;

  actionCodes: string[];
  actionHistory: ActionHistoryItem[];
  actionOptionsHistory: ActionOption[][];
  currentPosition: string;
  availableActions: TreeNode[];
  actionsLoading: boolean;

  selectionMode: 'matrix' | 'range';
  selectedHands: string[];
  matrixState: MatrixState;
  rangeInput: string;
  rangeSortBy: 'ev' | 'frequency';
  rangeSortOrder: 'asc' | 'desc';

  activeTab: 'range' | 'matrix' | 'quiz';
  hoveredCell: { rank1: string; rank2: string; suited: boolean } | null;
}

// --- Actions ---

type AppAction =
  | { type: 'SET_SIMULATIONS'; payload: Simulation[] }
  | { type: 'SET_SIM_ID'; payload: number | null }
  | { type: 'SET_SIMS_LOADING'; payload: boolean }
  | { type: 'PUSH_ACTION'; payload: { code: string; options: ActionOption[] } }
  | { type: 'POP_ACTION' }
  | { type: 'RESET_ACTIONS' }
  | { type: 'SET_ACTION_CODES'; payload: string[] }
  | { type: 'SET_AVAILABLE_ACTIONS'; payload: TreeNode[] }
  | { type: 'SET_ACTIONS_LOADING'; payload: boolean }
  | { type: 'SET_SELECTED_HANDS'; payload: string[] }
  | { type: 'SET_MATRIX_STATE'; payload: Partial<MatrixState> }
  | { type: 'SET_RANGE_INPUT'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: 'range' | 'matrix' | 'quiz' }
  | { type: 'SET_SELECTION_MODE'; payload: 'matrix' | 'range' }
  | { type: 'SET_RANGE_SORT_BY'; payload: 'ev' | 'frequency' }
  | { type: 'SET_RANGE_SORT_ORDER'; payload: 'asc' | 'desc' }
  | { type: 'SET_HOVERED_CELL'; payload: { rank1: string; rank2: string; suited: boolean } | null };

// --- Reducer ---

const initialState: AppState = {
  simulations: [],
  currentSimId: null,
  simsLoading: true,

  actionCodes: [],
  actionHistory: [],
  actionOptionsHistory: [],
  currentPosition: POSITIONS_6MAX[0],
  availableActions: [],
  actionsLoading: false,

  selectionMode: 'matrix',
  selectedHands: [],
  matrixState: { stage: 1, firstTwo: null, suitFilter: 'all' },
  rangeInput: '',
  rangeSortBy: 'ev',
  rangeSortOrder: 'desc',

  activeTab: 'range',
  hoveredCell: null,
};

function computeActionHistory(codes: string[]): ActionHistoryItem[] {
  return computeActionSteps(codes).map((step) => ({
    position: step.position,
    action: step.action,
    code: step.code,
  }));
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SIMULATIONS':
      return { ...state, simulations: action.payload };
    case 'SET_SIM_ID':
      return {
        ...state,
        currentSimId: action.payload,
        actionCodes: [],
        actionHistory: [],
        actionOptionsHistory: [],
        currentPosition: POSITIONS_6MAX[0],
        selectedHands: [],
        matrixState: { stage: 1, firstTwo: null, suitFilter: state.matrixState.suitFilter },
      };
    case 'SET_SIMS_LOADING':
      return { ...state, simsLoading: action.payload };
    case 'PUSH_ACTION': {
      const { code: selectedCode, options: visibleOptions } = action.payload;
      const newCodes = [...state.actionCodes, selectedCode];
      return {
        ...state,
        actionCodes: newCodes,
        actionHistory: computeActionHistory(newCodes),
        actionOptionsHistory: [...state.actionOptionsHistory, visibleOptions],
        currentPosition: getNextPosition(newCodes) || '',
        selectedHands: [],
        matrixState: { ...state.matrixState, stage: 1, firstTwo: null },
      };
    }
    case 'POP_ACTION': {
      const newCodes = state.actionCodes.slice(0, -1);
      return {
        ...state,
        actionCodes: newCodes,
        actionHistory: computeActionHistory(newCodes),
        actionOptionsHistory: state.actionOptionsHistory.slice(0, -1),
        currentPosition: getNextPosition(newCodes) || (newCodes.length === 0 ? POSITIONS_6MAX[0] : ''),
        selectedHands: [],
        matrixState: { ...state.matrixState, stage: 1, firstTwo: null },
      };
    }
    case 'RESET_ACTIONS':
      return {
        ...state,
        actionCodes: [],
        actionHistory: [],
        actionOptionsHistory: [],
        currentPosition: POSITIONS_6MAX[0],
        selectedHands: [],
        matrixState: { ...state.matrixState, stage: 1, firstTwo: null },
      };
    case 'SET_ACTION_CODES': {
      const newCodes = action.payload;
      return {
        ...state,
        actionCodes: newCodes,
        actionHistory: computeActionHistory(newCodes),
        actionOptionsHistory: state.actionOptionsHistory.slice(0, newCodes.length),
        currentPosition: getNextPosition(newCodes) || (newCodes.length === 0 ? POSITIONS_6MAX[0] : ''),
        selectedHands: [],
        matrixState: { ...state.matrixState, stage: 1, firstTwo: null },
      };
    }
    case 'SET_AVAILABLE_ACTIONS':
      return { ...state, availableActions: action.payload };
    case 'SET_ACTIONS_LOADING':
      return { ...state, actionsLoading: action.payload };
    case 'SET_SELECTED_HANDS':
      return { ...state, selectedHands: action.payload };
    case 'SET_MATRIX_STATE':
      return { ...state, matrixState: { ...state.matrixState, ...action.payload } };
    case 'SET_RANGE_INPUT':
      return { ...state, rangeInput: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload, selectedHands: [], hoveredCell: null };
    case 'SET_SELECTION_MODE':
      return { ...state, selectionMode: action.payload };
    case 'SET_RANGE_SORT_BY':
      return { ...state, rangeSortBy: action.payload };
    case 'SET_RANGE_SORT_ORDER':
      return { ...state, rangeSortOrder: action.payload };
    case 'SET_HOVERED_CELL':
      return { ...state, hoveredCell: action.payload };
    default:
      return state;
  }
}

// --- Context ---

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actionPrefix: string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const actionPrefix = state.actionCodes.join('.');

  // Load simulations on mount
  useEffect(() => {
    dispatch({ type: 'SET_SIMS_LOADING', payload: true });
    api.getSimulations()
      .then((sims) => {
        dispatch({ type: 'SET_SIMULATIONS', payload: sims });
        if (sims.length > 0) {
          dispatch({ type: 'SET_SIM_ID', payload: sims[0].id });
        }
      })
      .finally(() => dispatch({ type: 'SET_SIMS_LOADING', payload: false }));
  }, []);

  // Load available actions when sim or action prefix changes
  useEffect(() => {
    if (!state.currentSimId) return;

    dispatch({ type: 'SET_ACTIONS_LOADING', payload: true });
    api.getAvailableActions(state.currentSimId, actionPrefix)
      .then((nodes) => dispatch({ type: 'SET_AVAILABLE_ACTIONS', payload: nodes }))
      .finally(() => dispatch({ type: 'SET_ACTIONS_LOADING', payload: false }));
  }, [state.currentSimId, actionPrefix]);

  const value = useMemo(() => ({ state, dispatch, actionPrefix }), [state, dispatch, actionPrefix]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
