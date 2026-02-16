import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { MatrixGrid, type CellColorData } from './MatrixGrid';
import { SuitFilter } from './SuitFilter';
import { HandList } from './HandList';
import { CategoryFilter } from './CategoryFilter';
import { RANKS, type SuitFilterType } from '../../constants/poker';
import { useRangeData } from '../../hooks/useRangeData';
import { getCachedCategories, type HandCategory } from '../../utils/handCategories';

export function MatrixTab() {
  const { state, dispatch } = useAppContext();
  const { matrixState, availableActions } = state;
  const { handFreqMap, allHands, loading } = useRangeData();
  const [filteredHands, setFilteredHands] = useState<typeof allHands>([]);
  const [activeCategories, setActiveCategories] = useState<Set<HandCategory>>(new Set());

  // Compute per-cell color data from hand frequencies
  const cellColorData = useMemo(() => {
    if (handFreqMap.size === 0) return new Map<string, CellColorData>();

    const cellMap = new Map<string, { fold: number; call: number; raise: number; count: number }>();

    for (const [hand, freqs] of handFreqMap) {
      const ranks = extractRanks(hand);
      if (ranks.length < 4) continue;

      const suitGroups = parseSuitGroups(hand);
      const pairs = new Set<string>();

      for (let i = 0; i < ranks.length; i++) {
        for (let j = i + 1; j < ranks.length; j++) {
          const r1 = ranks[i];
          const r2 = ranks[j];
          const isSuited = suitGroups.some((g) => g.includes(r1) && g.includes(r2));

          const ri = RANKS.indexOf(r1 as typeof RANKS[number]);
          const ci = RANKS.indexOf(r2 as typeof RANKS[number]);
          if (ri < 0 || ci < 0) continue;

          const [rowIdx, colIdx] = ri <= ci ? [ri, ci] : [ci, ri];
          let cellKey: string;
          if (rowIdx === colIdx) {
            cellKey = `${rowIdx}-${colIdx}`;
          } else if (isSuited) {
            cellKey = `${rowIdx}-${colIdx}`;
          } else {
            cellKey = `${colIdx}-${rowIdx}`;
          }

          if (!pairs.has(cellKey)) {
            pairs.add(cellKey);
            let entry = cellMap.get(cellKey);
            if (!entry) {
              entry = { fold: 0, call: 0, raise: 0, count: 0 };
              cellMap.set(cellKey, entry);
            }
            entry.fold += freqs.fold;
            entry.call += freqs.call;
            entry.raise += freqs.raise;
            entry.count += 1;
          }
        }
      }
    }

    const result = new Map<string, CellColorData>();
    for (const [key, data] of cellMap) {
      if (data.count === 0) continue;
      result.set(key, {
        fold: data.fold / data.count,
        call: data.call / data.count,
        raise: data.raise / data.count,
      });
    }
    return result;
  }, [handFreqMap]);

  // Stage 2: compute valid cells and color data from actual hand data
  const { stage2ValidCells, stage2ColorData } = useMemo(() => {
    if (matrixState.stage !== 2 || !matrixState.firstTwo || allHands.length === 0) {
      return { stage2ValidCells: null, stage2ColorData: null };
    }

    const { rank1: r1, rank2: r2, suited: firstSuited } = matrixState.firstTwo;
    const { suitFilter } = matrixState;

    // Filter hands that match the first two cards
    const matchingHands = allHands.filter((h) => {
      if (!handMatchesRanks(h.hand, r1, r2, firstSuited)) return false;
      if (suitFilter !== 'all' && classifySuitType(h.hand) !== suitFilter) return false;
      return true;
    });

    const validCells = new Set<string>();
    const cellMap = new Map<string, { fold: number; call: number; raise: number; count: number }>();

    for (const h of matchingHands) {
      const ranks = extractRanks(h.hand);
      if (ranks.length < 4) continue;

      const suitGroups = parseSuitGroups(h.hand);

      // Find the remaining two ranks after removing the first pair
      const remaining = [...ranks];
      const idx1 = remaining.indexOf(r1);
      if (idx1 === -1) continue;
      remaining.splice(idx1, 1);
      const idx2 = remaining.indexOf(r2);
      if (idx2 === -1) continue;
      remaining.splice(idx2, 1);

      if (remaining.length !== 2) continue;

      const [rem1, rem2] = remaining;
      const remSuited = suitGroups.some((g) => g.includes(rem1) && g.includes(rem2));

      const ri = RANKS.indexOf(rem1 as typeof RANKS[number]);
      const ci = RANKS.indexOf(rem2 as typeof RANKS[number]);
      if (ri < 0 || ci < 0) continue;

      const [rowIdx, colIdx] = ri <= ci ? [ri, ci] : [ci, ri];
      let cellKey: string;
      if (rowIdx === colIdx) {
        cellKey = `${rowIdx}-${colIdx}`;
      } else if (remSuited) {
        cellKey = `${rowIdx}-${colIdx}`;
      } else {
        cellKey = `${colIdx}-${rowIdx}`;
      }

      validCells.add(cellKey);

      // Accumulate color data from handFreqMap
      const freqs = handFreqMap.get(h.hand);
      if (freqs) {
        let entry = cellMap.get(cellKey);
        if (!entry) {
          entry = { fold: 0, call: 0, raise: 0, count: 0 };
          cellMap.set(cellKey, entry);
        }
        entry.fold += freqs.fold;
        entry.call += freqs.call;
        entry.raise += freqs.raise;
        entry.count += 1;
      }
    }

    const colorData = new Map<string, CellColorData>();
    for (const [key, data] of cellMap) {
      if (data.count === 0) continue;
      colorData.set(key, {
        fold: data.fold / data.count,
        call: data.call / data.count,
        raise: data.raise / data.count,
      });
    }

    return { stage2ValidCells: validCells, stage2ColorData: colorData };
  }, [matrixState.stage, matrixState.firstTwo, matrixState.suitFilter, allHands, handFreqMap]);

  // Category filter helpers
  const handleCategoryToggle = useCallback((cat: HandCategory) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleCategoryClear = useCallback(() => {
    setActiveCategories(new Set());
  }, []);

  // Helper: check if hand passes category filter
  const passesCategory = useCallback((hand: string) => {
    if (activeCategories.size === 0) return true;
    const cats = getCachedCategories(hand);
    return cats.some(c => activeCategories.has(c));
  }, [activeCategories]);

  // Reset matrix state when available actions change
  useEffect(() => {
    dispatch({
      type: 'SET_MATRIX_STATE',
      payload: { stage: 1, firstTwo: null },
    });
    setFilteredHands([]);
    setActiveCategories(new Set());
  }, [availableActions, dispatch]);

  // Filter hands when matrix selection, suit filter, or category filter changes
  useEffect(() => {
    if (matrixState.stage === 1 || !matrixState.firstTwo) {
      setFilteredHands([]);
      return;
    }

    const { rank1, rank2, suited } = matrixState.firstTwo;
    const { suitFilter } = matrixState;
    const filtered = allHands.filter((h) => {
      if (!handMatchesRanks(h.hand, rank1, rank2, suited)) return false;
      if (suitFilter !== 'all' && classifySuitType(h.hand) !== suitFilter) return false;
      if (!passesCategory(h.hand)) return false;
      return true;
    });
    setFilteredHands(filtered);
  }, [allHands, matrixState.firstTwo, matrixState.stage, matrixState.suitFilter, passesCategory]);

  // Sync selectedHands when filteredHands changes (e.g. suit filter change)
  useEffect(() => {
    if (matrixState.stage === 2 && filteredHands.length > 0) {
      const currentSelected = state.selectedHands[0];
      const stillValid = currentSelected && filteredHands.some((h) => h.hand === currentSelected);
      if (!stillValid) {
        dispatch({ type: 'SET_SELECTED_HANDS', payload: [filteredHands[0].hand] });
      }
    } else if (matrixState.stage === 2 && filteredHands.length === 0) {
      dispatch({ type: 'SET_SELECTED_HANDS', payload: [] });
    }
  }, [filteredHands, matrixState.stage]);

  const handleCellClick = (rank1: string, rank2: string, suited: boolean) => {
    if (matrixState.stage === 1) {
      dispatch({
        type: 'SET_MATRIX_STATE',
        payload: { stage: 2, firstTwo: { rank1, rank2, suited } },
      });
    } else {
      const { rank1: r1, rank2: r2 } = matrixState.firstTwo!;
      const { suitFilter } = matrixState;
      const matchingHands = allHands.filter((h) => {
        const ranks = extractRanks(h.hand);
        if (ranks.length < 4) return false;

        const needed = [r1, r2, rank1, rank2];
        const available = [...ranks];
        for (const r of needed) {
          const idx = available.indexOf(r);
          if (idx === -1) return false;
          available.splice(idx, 1);
        }

        if (suitFilter !== 'all' && classifySuitType(h.hand) !== suitFilter) return false;
        if (!passesCategory(h.hand)) return false;
        return true;
      });

      setFilteredHands(matchingHands);
      if (matchingHands.length > 0) {
        dispatch({ type: 'SET_SELECTED_HANDS', payload: [matchingHands[0].hand] });
      }
    }
  };

  const handleCellHover = useCallback((rank1: string, rank2: string, suited: boolean) => {
    dispatch({ type: 'SET_HOVERED_CELL', payload: { rank1, rank2, suited } });
  }, [dispatch]);

  const handleCellLeave = useCallback(() => {
    dispatch({ type: 'SET_HOVERED_CELL', payload: null });
  }, [dispatch]);

  const handleBack = () => {
    dispatch({
      type: 'SET_MATRIX_STATE',
      payload: { stage: 1, firstTwo: null },
    });
    setFilteredHands([]);
  };

  return (
    <div className="flex flex-col h-full">
      <SuitFilter />
      <CategoryFilter
        hands={allHands}
        activeCategories={activeCategories}
        onToggle={handleCategoryToggle}
        onClear={handleCategoryClear}
      />

      {matrixState.stage === 2 && matrixState.firstTwo && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border-b border-slate-700">
          <button
            onClick={handleBack}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            &larr; Back
          </button>
          <div className="flex gap-1">
            <span className="px-1.5 py-0.5 bg-blue-600/30 rounded text-xs text-blue-300 font-bold">
              {matrixState.firstTwo.rank1}
            </span>
            <span className="px-1.5 py-0.5 bg-blue-600/30 rounded text-xs text-blue-300 font-bold">
              {matrixState.firstTwo.rank2}
            </span>
            {matrixState.firstTwo.suited && (
              <span className="text-xs text-slate-500">suited</span>
            )}
          </div>
          <span className="text-xs text-slate-500 ml-auto">
            {filteredHands.length} hands
          </span>
        </div>
      )}

      <MatrixGrid
        onCellClick={handleCellClick}
        onCellHover={handleCellHover}
        onCellLeave={handleCellLeave}
        cellColorData={matrixState.stage === 2 && stage2ColorData ? stage2ColorData : cellColorData}
        stage2ValidCells={stage2ValidCells}
      />

      <div className="border-t border-slate-700 flex-1 overflow-hidden">
        <HandList hands={filteredHands} loading={loading} />
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
    if (ch === '(') {
      currentGroup = [];
    } else if (ch === ')') {
      if (currentGroup && currentGroup.length > 0) groups.push(currentGroup);
      currentGroup = null;
    } else if (currentGroup) {
      currentGroup.push(ch);
    }
  }
  return groups;
}

function classifySuitType(hand: string): SuitFilterType {
  const groups = parseSuitGroups(hand);
  if (groups.length === 0) return 'rainbow';
  if (groups.length === 2 && groups[0].length === 2 && groups[1].length === 2) return 'double';
  if (groups.some((g) => g.length >= 3)) return 'triple';
  if (groups.length === 1 && groups[0].length === 2) return 'single';
  return 'rainbow';
}

function handMatchesRanks(hand: string, rank1: string, rank2: string, suited: boolean): boolean {
  const ranks = extractRanks(hand);
  if (ranks.length < 4) return false;

  const hasRank1 = ranks.includes(rank1);
  const tempRanks = [...ranks];
  if (hasRank1) {
    tempRanks.splice(tempRanks.indexOf(rank1), 1);
  }
  const hasRank2 = tempRanks.includes(rank2);

  if (!hasRank1 || !hasRank2) return false;

  if (suited) {
    const groups = parseSuitGroups(hand);
    return groups.some((g) => g.includes(rank1) && g.includes(rank2));
  }
  return true;
}
