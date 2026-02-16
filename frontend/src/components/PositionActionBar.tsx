import { useMemo } from 'react';
import { useAppContext, type ActionOption } from '../context/AppContext';
import { POSITIONS_6MAX, ACTION_MAP, ACTION_COLORS } from '../constants/poker';
import { useRangeData } from '../hooks/useRangeData';
import { getPositionStatuses } from '../utils/positionCycle';
import { ActionTimeline } from './ActionTimeline';

/** Sort options: Fold(0) first, Call(1) second, then raises */
function sortOptions(options: ActionOption[]): ActionOption[] {
  return [...options].sort((a, b) => {
    const priority = (code: string) => (code === '0' ? 0 : code === '1' ? 1 : 2);
    const pa = priority(a.code);
    const pb = priority(b.code);
    return pa !== pb ? pa - pb : a.code.localeCompare(b.code);
  });
}

export function PositionActionBar() {
  const { state, dispatch } = useAppContext();
  const {
    actionCodes,
    actionHistory,
    availableActions,
    actionsLoading,
    currentSimId,
    currentPosition,
  } = state;
  const { actionsWithHands, loading: rangeLoading, noData, isStale } = useRangeData();

  const positionStatuses = useMemo(() => getPositionStatuses(actionCodes), [actionCodes]);

  // Parse current position's available actions, only show meaningful actions
  const currentOptions = useMemo<ActionOption[]>(() => {
    if (rangeLoading || actionsLoading || isStale) return [];

    const seen = new Set<string>();
    const options: ActionOption[] = [];
    for (const node of availableActions) {
      const code = node.next_code || node.filename.replace(/\.rng$/, '').split('.').pop() || '';
      if (!seen.has(code)) {
        seen.add(code);
        const label = ACTION_MAP[code] || code;
        if (noData || actionsWithHands.size === 0 || actionsWithHands.has(label)) {
          options.push({ code, label });
        }
      }
    }
    return sortOptions(options);
  }, [availableActions, actionsWithHands, rangeLoading, actionsLoading, noData, isStale]);

  const handleSelectAction = (code: string) => {
    dispatch({ type: 'PUSH_ACTION', payload: { code, options: currentOptions } });
  };

  const handleUndo = () => {
    dispatch({ type: 'POP_ACTION' });
  };

  // Find the latest action for each position
  const latestActionByPos = useMemo(() => {
    const map: Record<string, { action: string; code: string }> = {};
    for (const item of actionHistory) {
      map[item.position] = { action: item.action, code: item.code };
    }
    return map;
  }, [actionHistory]);

  const isTerminal = currentPosition === '';

  return (
    <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700">
      {/* Row 1: 6 position boxes */}
      <div className="flex items-stretch gap-0.5 px-2 py-1.5 overflow-x-auto">
        {POSITIONS_6MAX.map((pos, i) => {
          const isCurrent = currentPosition === pos;
          const isFolded = positionStatuses[pos].folded;
          const isAllIn = positionStatuses[pos].isAllIn;
          const latestAction = latestActionByPos[pos];
          const hasActed = !!latestAction;

          return (
            <div key={pos} className="flex-shrink-0 flex items-center">
              <div
                className={`flex flex-col items-center justify-start rounded px-2 py-1 min-w-[60px] h-[86px] transition-all ${
                  isCurrent
                    ? 'bg-blue-600/20 border border-blue-500'
                    : isFolded
                      ? 'bg-slate-800/50 border border-slate-700/50 opacity-50'
                      : hasActed
                        ? 'bg-slate-750 border border-slate-600'
                        : 'bg-slate-800/50 border border-slate-700/50'
                }`}
              >
                {/* Position name */}
                <span
                  className={`text-[10px] font-bold mb-0.5 ${
                    isCurrent ? 'text-blue-400' : isFolded ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {pos}
                </span>

                {/* Latest action badge (for past positions) */}
                {!isCurrent && hasActed && (
                  <div className={`px-1.5 py-0.5 rounded text-[10px] font-semibold text-white ${
                    ACTION_COLORS[latestAction.action]?.bg || 'bg-slate-500'
                  }`}>
                    {latestAction.action}
                  </div>
                )}

                {/* AllIn badge */}
                {isAllIn && !isCurrent && (
                  <span className="text-[9px] text-red-400 font-bold mt-0.5">All-In</span>
                )}

                {/* Current position: action buttons */}
                {isCurrent && currentOptions.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    {sortOptions(currentOptions).map((opt) => {
                      const color = ACTION_COLORS[opt.label];
                      const bgClass = color?.bg || 'bg-slate-500';
                      return (
                        <button
                          key={opt.code}
                          onClick={() => handleSelectAction(opt.code)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all
                            ${bgClass} ${color?.hover || 'hover:brightness-125'} text-white`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Loading state */}
                {isCurrent && (actionsLoading || rangeLoading || isStale) && (
                  <span className="text-[10px] text-blue-400 animate-pulse">Loading...</span>
                )}

                {/* Terminal on current position box */}
                {isCurrent && !actionsLoading && !rangeLoading && !isStale && currentSimId && currentOptions.length === 0 && (
                  <span className="text-[10px] text-slate-500">Terminal</span>
                )}

                {/* Global terminal (no current position) */}
                {isTerminal && !hasActed && !isFolded && (
                  <span className="text-[10px] text-slate-700">-</span>
                )}
              </div>

              {/* Arrow separator */}
              {i < POSITIONS_6MAX.length - 1 && (
                <span className={`mx-0.5 text-[10px] ${hasActed || isCurrent ? 'text-slate-500' : 'text-slate-700'}`}>
                  ›
                </span>
              )}
            </div>
          );
        })}

        {/* Undo / Reset buttons */}
        <div className="ml-1 flex-shrink-0 self-center flex flex-col gap-1">
          {actionHistory.length > 0 && (
            <button
              onClick={handleUndo}
              className="px-2 py-1 text-[10px] text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded transition-colors"
            >
              Undo
            </button>
          )}
          {actionHistory.length > 1 && (
            <button
              onClick={() => dispatch({ type: 'RESET_ACTIONS' })}
              className="px-2 py-1 text-[10px] text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Action Timeline */}
      {actionHistory.length > 0 && <ActionTimeline />}
    </div>
  );
}
