import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAppContext } from '../../context/AppContext';
import { ACTION_COLORS } from '../../constants/poker';
import { renderHandCompact } from '../../utils/cardDisplay';

interface HandStrategy {
  hand: string;
  frequency: number;
  ev: number;
  actions?: { action: string; frequency: number }[];
}

interface HandListProps {
  hands: HandStrategy[];
  loading?: boolean;
}

type SortKey = 'hand' | 'frequency' | 'ev';
type SortDir = 'asc' | 'desc';

export function HandList({ hands, loading }: HandListProps) {
  const { dispatch } = useAppContext();
  const [sortKey, setSortKey] = useState<SortKey>('frequency');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const parentRef = useRef<HTMLDivElement>(null);

  const sortedHands = useMemo(() => {
    const sorted = [...hands];
    sorted.sort((a, b) => {
      let cmp: number;
      if (sortKey === 'hand') {
        cmp = a.hand.localeCompare(b.hand);
      } else {
        const aVal = isNaN(a[sortKey]) ? -Infinity : a[sortKey];
        const bVal = isNaN(b[sortKey]) ? -Infinity : b[sortKey];
        cmp = aVal - bVal;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [hands, sortKey, sortDir]);

  const virtualizer = useVirtualizer({
    count: sortedHands.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 20,
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    virtualizer.scrollToOffset(0);
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortDir === 'desc' ? ' \u25BC' : ' \u25B2';
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm">
        Loading hands...
      </div>
    );
  }

  if (hands.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm">
        Select cards from the matrix to view hands
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs text-slate-400 px-3 py-1.5 border-b border-slate-700 bg-slate-800/50">
        {hands.length} hands
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_70px_70px_1fr] gap-1 px-3 py-1 text-xs text-slate-500 font-medium border-b border-slate-700">
        <button onClick={() => toggleSort('hand')} className="text-left hover:text-white transition-colors">
          Hand{sortIndicator('hand')}
        </button>
        <button onClick={() => toggleSort('frequency')} className="text-right hover:text-white transition-colors">
          Freq{sortIndicator('frequency')}
        </button>
        <button onClick={() => toggleSort('ev')} className="text-right hover:text-white transition-colors">
          EV{sortIndicator('ev')}
        </button>
        <div>Actions</div>
      </div>

      {/* Virtual scrolled hand rows */}
      <div ref={parentRef} className="flex-1 overflow-y-auto">
        <div
          style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const h = sortedHands[virtualRow.index];
            return (
              <button
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                onClick={() => dispatch({ type: 'SET_SELECTED_HANDS', payload: [h.hand] })}
                className="grid grid-cols-[1fr_70px_70px_1fr] gap-1 px-3 py-1 text-sm hover:bg-slate-700/50 transition-colors w-full text-left border-b border-slate-800 absolute left-0"
                style={{ top: `${virtualRow.start}px` }}
              >
                <div className="text-slate-200 truncate">{renderHandCompact(h.hand)}</div>
                <div className="text-right text-slate-300">
                  {(h.frequency * 100).toFixed(0)}%
                </div>
                <div className={`text-right ${isNaN(h.ev) ? 'text-slate-500' : h.ev >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isNaN(h.ev) ? '-' : (h.ev / 2000).toFixed(2)}
                </div>
                <div className="flex h-3 rounded overflow-hidden self-center">
                  {h.actions ? (
                    h.actions.map((a, i) => {
                      const color = ACTION_COLORS[a.action];
                      return (
                        <div
                          key={i}
                          className={color?.bg || 'bg-slate-500'}
                          style={{ width: `${a.frequency * 100}%` }}
                          title={`${a.action}: ${(a.frequency * 100).toFixed(0)}%`}
                        />
                      );
                    })
                  ) : (
                    <div
                      className="bg-emerald-600"
                      style={{ width: `${h.frequency * 100}%` }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
