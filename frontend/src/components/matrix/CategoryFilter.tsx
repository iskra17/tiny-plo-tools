import { useMemo } from 'react';
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  getCachedCategories,
  type HandCategory,
} from '../../utils/handCategories';

interface CategoryFilterProps {
  /** All hands in current range (for computing counts) */
  hands: { hand: string }[];
  /** Currently active category filters */
  activeCategories: Set<HandCategory>;
  /** Toggle a category on/off */
  onToggle: (category: HandCategory) => void;
  /** Clear all filters */
  onClear: () => void;
}

export function CategoryFilter({ hands, activeCategories, onToggle, onClear }: CategoryFilterProps) {
  // Count hands per category
  const categoryCounts = useMemo(() => {
    const counts = new Map<HandCategory, number>();
    for (const cat of ALL_CATEGORIES) counts.set(cat, 0);

    for (const h of hands) {
      const cats = getCachedCategories(h.hand);
      for (const cat of cats) {
        counts.set(cat, (counts.get(cat) || 0) + 1);
      }
    }
    return counts;
  }, [hands]);

  const hasActive = activeCategories.size > 0;

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-slate-700 flex-wrap">
      <span className="text-[10px] text-slate-500 mr-1 flex-shrink-0">Category:</span>
      {ALL_CATEGORIES.map((cat) => {
        const count = categoryCounts.get(cat) || 0;
        const isActive = activeCategories.has(cat);
        if (count === 0) return null;
        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all flex-shrink-0 ${
              isActive
                ? `${CATEGORY_COLORS[cat]} text-white ring-1 ring-white/30`
                : 'bg-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {CATEGORY_LABELS[cat]}
            <span className={`ml-0.5 ${isActive ? 'text-white/70' : 'text-slate-500'}`}>
              {count}
            </span>
          </button>
        );
      })}
      {hasActive && (
        <button
          onClick={onClear}
          className="text-[10px] text-slate-500 hover:text-slate-300 ml-1 flex-shrink-0"
        >
          Clear
        </button>
      )}
    </div>
  );
}
