import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useAppContext } from '../context/AppContext';
import { api } from '../api/client';
import { ACTION_MAP } from '../constants/poker';

interface HandData {
  hand: string;
  frequency: number;
  ev: number;
}

/** Per-hand action breakdown */
export interface HandActionEntry {
  hand: string;
  actions: Record<string, { frequency: number; ev: number }>;
  primaryAction: string;
  primaryFreq: number;
  /** Weighted average EV across all actions */
  totalEv: number;
}

function actionCategory(code: string): 'fold' | 'call' | 'raise' {
  if (code === '0') return 'fold';
  if (code === '1') return 'call';
  return 'raise';
}

function getNodeCode(node: { next_code?: string; filename: string }): string {
  return node.next_code || node.filename.replace('.rng', '').split('.').pop() || '';
}

/** Sort action codes: Fold(0) first, Call(1) second, then raises ascending */
function sortActionCodes(codes: string[]): string[] {
  return [...codes].sort((a, b) => {
    const priority = (c: string) => {
      if (c === '0') return 0;
      if (c === '1') return 1;
      return 2;
    };
    const pa = priority(a);
    const pb = priority(b);
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  });
}

interface RangeDataValue {
  handActionMap: Map<string, HandActionEntry>;
  handFreqMap: Map<string, { fold: number; call: number; raise: number }>;
  allHands: HandData[];
  actionOrder: string[];
  loading: boolean;
  /** true when the current path has no frequency data in any .rng file */
  noData: boolean;
  /** Action names that have at least one hand with data */
  actionsWithHands: Set<string>;
  /** true when availableActions changed but range data hasn't loaded yet */
  isStale: boolean;
}

const RangeDataContext = createContext<RangeDataValue | null>(null);

/**
 * Provider that loads range data once and shares it between tabs.
 */
export function RangeDataProvider({ children }: { children: ReactNode }) {
  const { state } = useAppContext();
  const { currentSimId, availableActions } = state;
  const actionPrefix = state.actionCodes.join('.');

  const [handActionMap, setHandActionMap] = useState<Map<string, HandActionEntry>>(new Map());
  const [handFreqMap, setHandFreqMap] = useState<Map<string, { fold: number; call: number; raise: number }>>(new Map());
  const [allHands, setAllHands] = useState<HandData[]>([]);
  const [actionOrder, setActionOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [noData, setNoData] = useState(false);
  const [actionsWithHands, setActionsWithHands] = useState<Set<string>>(new Set());
  const [loadedForActions, setLoadedForActions] = useState<typeof availableActions>([]);

  const requestRef = useRef(0);

  useEffect(() => {
    if (!currentSimId || availableActions.length === 0) {
      setHandActionMap(new Map());
      setHandFreqMap(new Map());
      setAllHands([]);
      setActionOrder([]);
      setNoData(false);
      setActionsWithHands(new Set());
      setLoadedForActions([]);
      return;
    }

    const requestId = ++requestRef.current;
    setLoading(true);
    setNoData(false);

    // Collect and sort all action codes: Fold, Call, Raise order
    const codeSet = new Set<string>();
    for (const node of availableActions) {
      codeSet.add(getNodeCode(node));
    }
    const allCodes = sortActionCodes(Array.from(codeSet));

    // Use minimum depth from available actions to find direct nodes
    const depths = availableActions.map((n) => n.depth);
    const minDepth = Math.min(...depths);

    const directNodes = availableActions.filter((n) => n.depth === minDepth);
    const derivedCodes = availableActions
      .filter((n) => n.depth !== minDepth)
      .map((n) => getNodeCode(n));

    const promises = directNodes.map((node) => {
      const code = getNodeCode(node);
      return api.getRange(currentSimId, node.filename)
        .then((res) => ({ code, hands: res.hands }))
        .catch(() => ({ code, hands: [] as HandData[] }));
    });

    Promise.all(promises).then(async (results) => {
      if (requestId !== requestRef.current) return;

      const actionMap = new Map<string, HandActionEntry>();
      const freqMap = new Map<string, { fold: number; call: number; raise: number }>();

      // Separate results into those with data vs empty (Monker empty file = derived)
      const resultsWithData = results.filter((r) => r.hands.length > 0);
      const emptyResultCodes = results.filter((r) => r.hands.length === 0).map((r) => r.code);

      // Combine pre-existing derivedCodes with empty-file codes
      const allDerivedCodes = [...derivedCodes, ...emptyResultCodes];

      // If ALL results are empty, this path has no solver data
      if (resultsWithData.length === 0) {
        const actionNameOrder = allCodes.map((c) => ACTION_MAP[c] || c);
        setActionOrder(actionNameOrder);
        setHandActionMap(new Map());
        setHandFreqMap(new Map());
        setAllHands([]);
        setNoData(true);
        setLoadedForActions(availableActions);
        setLoading(false);
        return;
      }

      for (const { code, hands } of resultsWithData) {
        const actionName = ACTION_MAP[code] || code;
        const cat = actionCategory(code);

        for (const h of hands) {
          let actionEntry = actionMap.get(h.hand);
          if (!actionEntry) {
            actionEntry = { hand: h.hand, actions: {}, primaryAction: '', primaryFreq: 0, totalEv: 0 };
            actionMap.set(h.hand, actionEntry);
          }
          actionEntry.actions[actionName] = { frequency: h.frequency, ev: h.ev };

          let freqEntry = freqMap.get(h.hand);
          if (!freqEntry) {
            freqEntry = { fold: 0, call: 0, raise: 0 };
            freqMap.set(h.hand, freqEntry);
          }
          freqEntry[cat] += h.frequency;
        }
      }

      // Derive missing actions (from deeper-depth nodes + empty-file nodes)
      if (allDerivedCodes.length > 0 && actionMap.size > 0) {
        const sortedDerived = sortActionCodes(allDerivedCodes);
        const derivedCat = sortedDerived.map(actionCategory);

        for (const [, actionEntry] of actionMap) {
          let existingSum = 0;
          for (const act of Object.values(actionEntry.actions)) existingSum += act.frequency;
          const remaining = Math.max(0, 1 - existingSum);
          if (remaining > 0.001) {
            const perDerived = remaining / sortedDerived.length;
            for (const code of sortedDerived) {
              const actionName = ACTION_MAP[code] || code;
              if (!actionEntry.actions[actionName]) {
                actionEntry.actions[actionName] = { frequency: perDerived, ev: 0 };
              } else {
                actionEntry.actions[actionName].frequency += perDerived;
              }
            }
          }
        }

        for (const [, freqEntry] of freqMap) {
          const existingSum = freqEntry.fold + freqEntry.call + freqEntry.raise;
          const remaining = Math.max(0, 1 - existingSum);
          if (remaining > 0) {
            const perCat = remaining / derivedCat.length;
            for (const cat of derivedCat) freqEntry[cat] += perCat;
          }
        }
      }

      // Filter out hands not in range (all actions sum to ~0)
      for (const [hand, entry] of actionMap) {
        let totalFreq = 0;
        for (const data of Object.values(entry.actions)) totalFreq += data.frequency;
        if (totalFreq < 0.001) {
          actionMap.delete(hand);
          freqMap.delete(hand);
        }
      }

      // Primary action — iterate in Fold, Call, Raise order for stable tiebreaking
      const actionNameOrder = allCodes.map((c) => ACTION_MAP[c] || c);
      for (const [, entry] of actionMap) {
        let maxFreq = -1;
        let maxAction = '';
        for (const actionName of actionNameOrder) {
          const data = entry.actions[actionName];
          if (data && data.frequency > maxFreq) {
            maxFreq = data.frequency;
            maxAction = actionName;
          }
        }
        entry.primaryAction = maxAction;
        entry.primaryFreq = Math.max(0, maxFreq);

        // Compute weighted average EV
        let weightedEv = 0;
        for (const data of Object.values(entry.actions)) {
          weightedEv += data.frequency * data.ev;
        }
        entry.totalEv = weightedEv;
      }

      // Compute which actions are meaningful (primary for at least one hand)
      const actionsWithHandsSet = new Set<string>();
      for (const [, entry] of actionMap) {
        if (entry.primaryAction) {
          actionsWithHandsSet.add(entry.primaryAction);
        }
      }

      setActionOrder(actionNameOrder);
      setHandActionMap(actionMap);
      setHandFreqMap(freqMap);
      setAllHands(resultsWithData[0].hands);
      setActionsWithHands(actionsWithHandsSet);
      setNoData(false);
      setLoadedForActions(availableActions);
      setLoading(false);
    }).catch(() => {
      if (requestId === requestRef.current) setLoading(false);
    });
  }, [currentSimId, availableActions, actionPrefix]);

  const isStale = availableActions !== loadedForActions && availableActions.length > 0;
  const value = { handActionMap, handFreqMap, allHands, actionOrder, loading, noData, actionsWithHands, isStale };

  return <RangeDataContext.Provider value={value}>{children}</RangeDataContext.Provider>;
}

export function useRangeData(): RangeDataValue {
  const ctx = useContext(RangeDataContext);
  if (!ctx) throw new Error('useRangeData must be used within RangeDataProvider');
  return ctx;
}
