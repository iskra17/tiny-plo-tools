import { useMemo } from 'react';
import { useRangeData } from '../../hooks/useRangeData';
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  getCachedCategories,
  type HandCategory,
} from '../../utils/handCategories';
import { ACTION_COLORS } from '../../constants/poker';

interface CategoryStats {
  category: HandCategory;
  count: number;
  fold: number;
  call: number;
  raise: number;
}

/**
 * Shows per-category strategy distribution as stacked bars.
 * Displays how each hand category (Pairs, Rundowns, etc.) distributes across actions.
 */
export function CategoryChart() {
  const { handActionMap, actionOrder, loading, noData } = useRangeData();

  const stats = useMemo(() => {
    if (handActionMap.size === 0) return [];

    // Determine which actions are fold/call/raise
    const foldActions = new Set<string>();
    const callActions = new Set<string>();
    const raiseActions = new Set<string>();
    for (const name of actionOrder) {
      if (name === 'Fold') foldActions.add(name);
      else if (name === 'Call') callActions.add(name);
      else raiseActions.add(name);
    }

    const catMap = new Map<HandCategory, { count: number; fold: number; call: number; raise: number }>();
    for (const cat of ALL_CATEGORIES) {
      catMap.set(cat, { count: 0, fold: 0, call: 0, raise: 0 });
    }

    for (const [hand, entry] of handActionMap) {
      const cats = getCachedCategories(hand);
      for (const cat of cats) {
        const s = catMap.get(cat)!;
        s.count++;

        for (const [actionName, data] of Object.entries(entry.actions)) {
          if (foldActions.has(actionName)) s.fold += data.frequency;
          else if (callActions.has(actionName)) s.call += data.frequency;
          else s.raise += data.frequency;
        }
      }
    }

    // Normalize and filter
    const result: CategoryStats[] = [];
    for (const [cat, s] of catMap) {
      if (s.count === 0) continue;
      result.push({
        category: cat,
        count: s.count,
        fold: (s.fold / s.count) * 100,
        call: (s.call / s.count) * 100,
        raise: (s.raise / s.count) * 100,
      });
    }

    // Sort by raise% descending (most aggressive first)
    result.sort((a, b) => b.raise - a.raise);
    return result;
  }, [handActionMap, actionOrder]);

  if (loading || noData || stats.length === 0) return null;

  return (
    <div className="px-3 pb-2">
      <div className="space-y-1">
        {stats.map((s) => (
          <div key={s.category} className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${CATEGORY_COLORS[s.category]}`} />
            <span className="text-[10px] text-slate-400 w-[52px] truncate flex-shrink-0">
              {CATEGORY_LABELS[s.category]}
            </span>
            <div className="flex h-3 rounded overflow-hidden flex-1 min-w-0">
              {s.fold > 0.5 && (
                <div
                  className={ACTION_COLORS['Fold']?.bg || 'bg-blue-500'}
                  style={{ width: `${s.fold}%` }}
                  title={`Fold ${s.fold.toFixed(1)}%`}
                />
              )}
              {s.call > 0.5 && (
                <div
                  className={ACTION_COLORS['Call']?.bg || 'bg-emerald-600'}
                  style={{ width: `${s.call}%` }}
                  title={`Call ${s.call.toFixed(1)}%`}
                />
              )}
              {s.raise > 0.5 && (
                <div
                  className={ACTION_COLORS['Pot']?.bg || 'bg-rose-600'}
                  style={{ width: `${s.raise}%` }}
                  title={`Raise ${s.raise.toFixed(1)}%`}
                />
              )}
            </div>
            <span className="text-[9px] text-slate-500 w-[28px] text-right flex-shrink-0">
              {s.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
