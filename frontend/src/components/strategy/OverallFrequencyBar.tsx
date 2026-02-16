import { useMemo } from 'react';
import { ACTION_COLORS } from '../../constants/poker';
import { useRangeData } from '../../hooks/useRangeData';

/**
 * Aggregate action frequency bar for the current decision point.
 * Shows overall Fold/Call/Raise percentages across ALL hands as a single stacked bar.
 */
export function OverallFrequencyBar() {
  const { handActionMap, actionOrder, loading, noData } = useRangeData();

  const segments = useMemo(() => {
    if (handActionMap.size === 0) return [];

    // Count hands per primary action
    const counts: Record<string, number> = {};
    for (const action of actionOrder) counts[action] = 0;

    for (const [, entry] of handActionMap) {
      if (entry.primaryAction && counts[entry.primaryAction] !== undefined) {
        counts[entry.primaryAction]++;
      }
    }

    const total = handActionMap.size;
    return actionOrder
      .map((action) => ({
        action,
        count: counts[action] || 0,
        pct: total > 0 ? ((counts[action] || 0) / total) * 100 : 0,
        color: ACTION_COLORS[action],
      }))
      .filter((s) => s.pct > 0);
  }, [handActionMap, actionOrder]);

  if (loading || noData || segments.length === 0) return null;

  return (
    <div className="px-3 py-2">
      {/* Stacked bar */}
      <div className="flex h-5 rounded overflow-hidden mb-1.5">
        {segments.map((seg) => (
          <div
            key={seg.action}
            className={`${seg.color?.bg || 'bg-slate-500'} flex items-center justify-center text-[11px] text-white font-semibold transition-all`}
            style={{ width: `${seg.pct}%` }}
          >
            {seg.pct > 8 && `${seg.pct.toFixed(0)}%`}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {segments.map((seg) => (
          <div key={seg.action} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${seg.color?.bg || 'bg-slate-400'}`} />
            <span className="text-xs text-slate-400">
              {seg.action} {seg.pct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
