import { useMemo, type ReactNode } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useRangeData } from '../../hooks/useRangeData';
import { ACTION_COLORS } from '../../constants/poker';
import { renderHandCompact } from '../../utils/cardDisplay';
import { matchesMonkerFilter } from '../../utils/monkerFilter';

/**
 * Context-aware hand list below the poker table.
 * - Matrix tab + hover: shows hands matching the hovered cell
 * - Range tab + filter: shows top hands matching the range filter
 */
export function HoveredHandList() {
  const { state, dispatch } = useAppContext();
  const { hoveredCell, matrixState, activeTab, rangeInput } = state;
  const { handActionMap, allHands } = useRangeData();

  const isStage2 = matrixState.stage === 2 && matrixState.firstTwo !== null;
  const firstTwo = matrixState.firstTwo;

  // Range tab: show filtered hands sorted by totalEv
  const rangeFilteredHands = useMemo(() => {
    if (activeTab !== 'range' || !rangeInput.trim() || handActionMap.size === 0) return [];

    const results: { hand: string; ev: number }[] = [];
    for (const [hand, entry] of handActionMap) {
      if (matchesMonkerFilter(hand, rangeInput)) {
        results.push({ hand, ev: entry.totalEv });
      }
    }
    results.sort((a, b) => {
      const aEv = isNaN(a.ev) ? -Infinity : a.ev;
      const bEv = isNaN(b.ev) ? -Infinity : b.ev;
      return bEv - aEv;
    });
    return results.slice(0, 30);
  }, [activeTab, rangeInput, handActionMap]);

  // Matrix tab: show hovered cell hands
  const hoveredHands = useMemo(() => {
    if (activeTab !== 'matrix' || !hoveredCell || allHands.length === 0) return [];

    const { rank1, rank2, suited } = hoveredCell;

    const matched = allHands.filter((h) => {
      const ranks = extractRanks(h.hand);
      if (ranks.length < 4) return false;

      if (isStage2 && firstTwo) {
        const needed = [firstTwo.rank1, firstTwo.rank2, rank1, rank2];
        const available = [...ranks];
        for (const r of needed) {
          const idx = available.indexOf(r);
          if (idx === -1) return false;
          available.splice(idx, 1);
        }

        const groups = parseSuitGroups(h.hand);
        if (firstTwo.suited) {
          if (!groups.some((g) => g.includes(firstTwo.rank1) && g.includes(firstTwo.rank2))) return false;
        }
        if (suited) {
          if (!groups.some((g) => g.includes(rank1) && g.includes(rank2))) return false;
        }
        return true;
      }

      const temp = [...ranks];
      const idx1 = temp.indexOf(rank1);
      if (idx1 === -1) return false;
      temp.splice(idx1, 1);
      const idx2 = temp.indexOf(rank2);
      if (idx2 === -1) return false;

      if (suited) {
        const groups = parseSuitGroups(h.hand);
        return groups.some((g) => g.includes(rank1) && g.includes(rank2));
      }
      return true;
    });

    // Use totalEv from handActionMap for correct weighted EV
    return matched
      .map((h) => {
        const entry = handActionMap.get(h.hand);
        return { hand: h.hand, ev: entry ? entry.totalEv : h.ev };
      })
      .sort((a, b) => {
        const aEv = isNaN(a.ev) ? -Infinity : a.ev;
        const bEv = isNaN(b.ev) ? -Infinity : b.ev;
        return bEv - aEv;
      })
      .slice(0, 30);
  }, [hoveredCell, allHands, handActionMap, isStage2, firstTwo, activeTab]);

  // Determine which list to show
  const isRangeMode = activeTab === 'range' && rangeInput.trim().length > 0;
  const displayHands = isRangeMode ? rangeFilteredHands : hoveredHands;

  if (displayHands.length === 0) return null;

  // Label
  let label: string;
  let countLabel: string;
  if (isRangeMode) {
    label = `Filter: ${rangeInput.length > 20 ? rangeInput.slice(0, 20) + '...' : rangeInput}`;
    countLabel = `${displayHands.length}${displayHands.length >= 30 ? '+' : ''} combos`;
  } else {
    const { rank1, rank2 } = hoveredCell!;
    label = isStage2 && firstTwo
      ? `${firstTwo.rank1}${firstTwo.rank2}+${rank1}${rank2}`
      : `${rank1}${rank2}`;
    countLabel = `${displayHands.length}${displayHands.length >= 30 ? '+' : ''} combos`;
  }

  // Build suit badge for matrix hover mode
  let suitBadge: ReactNode = null;
  if (!isRangeMode && hoveredCell) {
    const parts: ReactNode[] = [];
    if (isStage2 && firstTwo) {
      parts.push(
        <span key="s1" className={firstTwo.suited ? 'text-blue-400' : 'text-slate-500'}>
          {firstTwo.suited ? 's' : 'o'}
        </span>
      );
      parts.push(<span key="sep" className="text-slate-600">+</span>);
    }
    parts.push(
      <span key="s2" className={hoveredCell.suited ? 'text-blue-400' : 'text-slate-500'}>
        {hoveredCell.suited ? 's' : 'o'}
      </span>
    );
    suitBadge = <span className="text-[10px] font-medium flex gap-0.5">{parts}</span>;
  }

  const handleClickHand = (hand: string) => {
    dispatch({ type: 'SET_SELECTED_HANDS', payload: [hand] });
  };

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
          {label}
        </span>
        {suitBadge}
        <span className="text-[10px] text-slate-400 uppercase">Hands</span>
        <span className="text-[10px] text-slate-600">
          {countLabel}
        </span>
      </div>
      <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
        {displayHands.map((h) => {
          const entry = handActionMap.get(h.hand);
          return (
            <button
              key={h.hand}
              onClick={() => handleClickHand(h.hand)}
              className="w-full flex items-center gap-1.5 py-0.5 hover:bg-slate-700/50 transition-colors text-left rounded px-0.5"
            >
              <span className="flex-shrink-0">{renderHandCompact(h.hand)}</span>
              {entry && (
                <div className="flex h-2.5 rounded overflow-hidden flex-1 min-w-0">
                  {Object.entries(entry.actions).map(([action, data]) => {
                    const color = ACTION_COLORS[action];
                    if (data.frequency < 0.005) return null;
                    return (
                      <div
                        key={action}
                        className={color?.bg || 'bg-slate-500'}
                        style={{ width: `${data.frequency * 100}%` }}
                      />
                    );
                  })}
                </div>
              )}
              <span className={`text-[10px] flex-shrink-0 w-14 text-right font-medium ${
                isNaN(h.ev) ? 'text-slate-500' : h.ev >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {isNaN(h.ev) ? '-' : `${h.ev >= 0 ? '+' : ''}${(h.ev / 2000).toFixed(2)}bb`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function extractRanks(hand: string): string[] {
  const ranks: string[] = [];
  for (const ch of hand) {
    if (ch !== '(' && ch !== ')') ranks.push(ch);
  }
  return ranks;
}

function parseSuitGroups(hand: string): string[][] {
  const groups: string[][] = [];
  let currentGroup: string[] | null = null;
  for (const ch of hand) {
    if (ch === '(') currentGroup = [];
    else if (ch === ')') {
      if (currentGroup && currentGroup.length > 0) groups.push(currentGroup);
      currentGroup = null;
    } else if (currentGroup) currentGroup.push(ch);
  }
  return groups;
}
