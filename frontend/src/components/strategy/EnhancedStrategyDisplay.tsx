import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useRangeData } from '../../hooks/useRangeData';
import { ACTION_COLORS } from '../../constants/poker';
import { renderHandCompact } from '../../utils/cardDisplay';

interface DisplayAction {
  action: string;
  actionCode: string;
  frequency: number;
  ev: number;
}

export function EnhancedStrategyDisplay() {
  const { state } = useAppContext();
  const { selectedHands, actionCodes } = state;
  const { handActionMap, actionOrder, loading } = useRangeData();

  const actionPrefix = actionCodes.join('.');
  const hand = selectedHands.length > 0 ? selectedHands[0] : '';

  // Derive strategy actions from handActionMap
  const strategyActions = useMemo<DisplayAction[]>(() => {
    if (!hand) return [];
    const entry = handActionMap.get(hand);
    if (!entry) return [];

    return actionOrder
      .filter((actionName) => entry.actions[actionName])
      .map((actionName) => ({
        action: actionName,
        actionCode: actionName,
        frequency: entry.actions[actionName].frequency,
        ev: entry.actions[actionName].ev,
      }));
  }, [hand, handActionMap, actionOrder]);

  if (!hand) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm">
        Select a hand from the matrix or enter a range to view strategy
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm">
        Loading strategy...
      </div>
    );
  }

  if (strategyActions.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm">
        No strategy data for <span className="font-mono text-slate-300">{hand}</span>
      </div>
    );
  }

  const totalFreq = strategyActions.reduce((sum, a) => sum + a.frequency, 0);
  const visibleActions = strategyActions.filter((a) => {
    const pct = totalFreq > 0 ? (a.frequency / totalFreq) * 100 : 0;
    return pct >= 0.5;
  });

  // Compute maxEV for highlighting
  const actionsWithEv = strategyActions.filter(a => a.ev !== 0);
  const maxEv = actionsWithEv.length > 0 ? Math.max(...actionsWithEv.map(a => a.ev)) : 0;

  return (
    <div className="p-3">
      {/* Hand display with suit colors */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">{renderHandCompact(hand)}</span>
        <span className="text-xs text-slate-500">@ {actionPrefix || 'root'}</span>
        {maxEv !== 0 && (
          <span className={`text-xs font-medium ml-auto ${maxEv >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            maxEV: {maxEv >= 0 ? '+' : ''}{(maxEv / 1000).toFixed(2)}bb
          </span>
        )}
      </div>

      {/* Action frequency bar with hover tooltips */}
      <div className="flex h-8 rounded overflow-hidden mb-3 relative">
        {visibleActions.map((a) => {
          const pct = totalFreq > 0 ? (a.frequency / totalFreq) * 100 : 0;
          const color = ACTION_COLORS[a.action];
          return (
            <div
              key={a.actionCode}
              className={`${color?.bg || 'bg-slate-500'} flex items-center justify-center text-xs text-white font-medium cursor-pointer hover:brightness-125 transition-all relative group`}
              style={{ width: `${Math.max(pct, 3)}%` }}
            >
              {pct > 10 && `${a.action} ${pct.toFixed(0)}%`}
              {/* Hover tooltip */}
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block
                              bg-gray-900 text-white text-xs rounded px-2 py-1.5 whitespace-nowrap z-50 shadow-lg
                              border border-slate-600 pointer-events-none">
                <div className="font-semibold">{a.action}</div>
                <div className="text-slate-300">Freq: {pct.toFixed(1)}%</div>
                {a.ev !== 0 && (
                  <div className={a.ev >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    EV: {a.ev >= 0 ? '+' : ''}{(a.ev / 1000).toFixed(2)}bb
                  </div>
                )}
                {a.ev !== 0 && maxEv !== 0 && a.ev !== maxEv && (
                  <div className="text-amber-400">
                    Diff: {((a.ev - maxEv) / 1000).toFixed(2)}bb
                  </div>
                )}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Action details table */}
      <div className="space-y-1">
        {strategyActions.map((a) => {
          const pct = totalFreq > 0 ? (a.frequency / totalFreq) * 100 : 0;
          const color = ACTION_COLORS[a.action];
          const isMaxEv = a.ev !== 0 && a.ev === maxEv;
          return (
            <div
              key={a.actionCode}
              className={`flex items-center gap-2 px-2 py-1 rounded ${isMaxEv ? 'bg-slate-700 ring-1 ring-emerald-500/30' : 'bg-slate-800'}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color?.bg || 'bg-slate-400'}`} />
              <span className="text-xs text-slate-200 font-medium w-20">{a.action}</span>
              <div className="flex-1 h-2 bg-slate-700 rounded overflow-hidden">
                <div
                  className={`h-full ${color?.bg || 'bg-slate-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-12 text-right">
                {pct.toFixed(1)}%
              </span>
              <span className={`text-xs w-14 text-right font-medium ${
                a.ev === 0 ? 'text-slate-500' : a.ev >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {a.ev !== 0 ? `${a.ev >= 0 ? '+' : ''}${(a.ev / 1000).toFixed(2)}bb` : '-'}
              </span>
              {isMaxEv && <span className="text-[10px] text-emerald-500">★</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
