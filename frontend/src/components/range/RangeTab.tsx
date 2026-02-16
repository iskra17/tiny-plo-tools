import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ACTION_COLORS } from '../../constants/poker';
import { renderHandCompact } from '../../utils/cardDisplay';
import { useRangeData, type HandActionEntry } from '../../hooks/useRangeData';
import { matchesMonkerFilter } from '../../utils/monkerFilter';

const MAX_VISIBLE_HANDS = 200;

const RANK_CHARS = new Set(['A','K','Q','J','T','9','8','7','6','5','4','3','2']);
const SUIT_CHARS = new Set(['s','h','d','c']);
const SUIT_KEYWORDS = new Set(['xx','ss','ds','rb']);

/** Uppercase ranks, preserve lowercase suit chars, $, !, and PPT patterns */
function smartUpperCase(input: string): string {
  const colonIdx = input.lastIndexOf(':');
  if (colonIdx >= 0 && colonIdx < input.length - 1) {
    const before = input.substring(0, colonIdx);
    const after = input.substring(colonIdx + 1);
    if (after.startsWith('(')) {
      return smartUpperCase(before) + ':' + after;
    }
    if (SUIT_KEYWORDS.has(after.toLowerCase())) {
      return smartUpperCase(before) + ':' + after.toLowerCase();
    }
    return smartUpperCase(before) + ':' + uppercasePreserveSuits(after);
  }
  return uppercasePreserveSuits(input);
}

function uppercasePreserveSuits(s: string): string {
  let result = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const upper = ch.toUpperCase();
    // Preserve special chars: $, !, (, ), *, >, <, =, ','
    if ('$!()><=,'.includes(ch)) {
      result += ch;
    } else if (RANK_CHARS.has(upper)) {
      result += upper;
    } else if (SUIT_CHARS.has(ch.toLowerCase()) && i > 0 && RANK_CHARS.has(result[result.length - 1])) {
      result += ch.toLowerCase();
    } else {
      // Keep x,y,w,z lowercase for suit patterns (xxyy etc.)
      const lower = ch.toLowerCase();
      if ('xywz'.includes(lower)) {
        result += lower;
      } else {
        result += ch;
      }
    }
  }
  return result;
}

function FilterHelp({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute left-0 right-0 top-full mt-1 z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-3 text-xs text-slate-300 max-h-[400px] overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-white">Filter Syntax (PPT)</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-sm px-1">&times;</button>
      </div>
      <table className="w-full">
        <thead>
          <tr className="text-slate-500 text-xs border-b border-slate-700">
            <th className="text-left py-1 pr-2">Syntax</th>
            <th className="text-left py-1">Description</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          <tr><td colSpan={2} className="pt-1 pb-1 text-xs text-slate-500 font-sans font-semibold">Rank Matching</td></tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">AA</td>
            <td className="py-1 text-slate-400">Pair of Aces + any 2</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">AAKK</td>
            <td className="py-1 text-slate-400">Two specific pairs</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">(AK)xx</td>
            <td className="py-1 text-slate-400">AK suited + any 2</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">&gt;=T, A:T</td>
            <td className="py-1 text-slate-400">Rank range (T+, A thru T)</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">AA,KK</td>
            <td className="py-1 text-slate-400">OR (comma separated)</td>
          </tr>

          <tr><td colSpan={2} className="pt-2 pb-1 text-xs text-slate-500 font-sans font-semibold">Suit Patterns (PPT)</td></tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">xxyy</td>
            <td className="py-1 text-slate-400">Double suited</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">xxyw</td>
            <td className="py-1 text-slate-400">Single suited</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">xxxy</td>
            <td className="py-1 text-slate-400">Triple suited (3 same)</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">xxxx</td>
            <td className="py-1 text-slate-400">Monotone (all 4 same)</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">xywz</td>
            <td className="py-1 text-slate-400">Rainbow (all different)</td>
          </tr>

          <tr><td colSpan={2} className="pt-2 pb-1 text-xs text-slate-500 font-sans font-semibold">Rank Meta-patterns</td></tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">RR</td>
            <td className="py-1 text-slate-400">Any pair</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">RROO</td>
            <td className="py-1 text-slate-400">Double paired</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">!RR</td>
            <td className="py-1 text-slate-400">No pair</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">RR!RROO</td>
            <td className="py-1 text-slate-400">Exactly one pair</td>
          </tr>

          <tr><td colSpan={2} className="pt-2 pb-1 text-xs text-slate-500 font-sans font-semibold">$ Categories (per card)</td></tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">$B</td>
            <td className="py-1 text-slate-400">Big (A-J)</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">$M</td>
            <td className="py-1 text-slate-400">Middle (T-7)</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">$Z</td>
            <td className="py-1 text-slate-400">Small (6-2)</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">$R</td>
            <td className="py-1 text-slate-400">Broadway (A-T)</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">$F, $W, $L, $N</td>
            <td className="py-1 text-slate-400">Face, Wheel, Low, Non-low</td>
          </tr>

          <tr><td colSpan={2} className="pt-2 pb-1 text-xs text-slate-500 font-sans font-semibold">$ Modifiers</td></tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">$ds, $ss</td>
            <td className="py-1 text-slate-400">Double / Single suited</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">$np, $rb</td>
            <td className="py-1 text-slate-400">No pair / Rainbow</td>
          </tr>

          <tr><td colSpan={2} className="pt-2 pb-1 text-xs text-slate-500 font-sans font-semibold">Bracket & Operators</td></tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">(A,K,Q)</td>
            <td className="py-1 text-slate-400">Has A or K or Q</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">(AA-TT)</td>
            <td className="py-1 text-slate-400">Pair range AA thru TT</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">!</td>
            <td className="py-1 text-slate-400">NOT (prefix, e.g. !RR)</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">AA:ss, :ds, :rb</td>
            <td className="py-1 text-slate-400">Suit condition (ss=single, ds=double, rb=rainbow)</td>
          </tr>
          <tr className="border-b border-slate-700/50">
            <td className="py-1 pr-2 text-blue-400">A:(87,76)</td>
            <td className="py-1 text-slate-400">Prefix expand: A87 or A76</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

type ColumnSort = { by: 'ev' | 'frequency'; order: 'asc' | 'desc' };

export function RangeTab() {
  const { state, dispatch } = useAppContext();
  const { rangeInput } = state;
  const { handActionMap, actionOrder, loading, noData } = useRangeData();
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [showHelp, setShowHelp] = useState(false);
  const [columnSorts, setColumnSorts] = useState<Record<string, ColumnSort>>({});

  // Filter and group hands by action
  const { groupedHands, totalFiltered } = useMemo(() => {
    const groups: Record<string, HandActionEntry[]> = {};

    for (const action of actionOrder) {
      groups[action] = [];
    }

    let filtered = 0;
    for (const [, entry] of handActionMap) {
      if (!matchesMonkerFilter(entry.hand, rangeInput)) continue;
      filtered++;

      if (entry.primaryAction && groups[entry.primaryAction]) {
        groups[entry.primaryAction].push(entry);
      }
    }

    // Sort each group independently
    for (const action of actionOrder) {
      const sort = columnSorts[action] || { by: 'ev', order: 'desc' };
      groups[action].sort((a, b) => {
        if (sort.by === 'ev') {
          return sort.order === 'desc' ? b.totalEv - a.totalEv : a.totalEv - b.totalEv;
        } else {
          return sort.order === 'desc' ? b.primaryFreq - a.primaryFreq : a.primaryFreq - b.primaryFreq;
        }
      });
    }

    return { groupedHands: groups, totalFiltered: filtered };
  }, [handActionMap, actionOrder, rangeInput, columnSorts]);

  const toggleExpand = (action: string) => {
    setExpandedActions((prev) => {
      const next = new Set(prev);
      if (next.has(action)) next.delete(action);
      else next.add(action);
      return next;
    });
  };

  const toggleColumnSort = (action: string, by: 'ev' | 'frequency') => {
    setColumnSorts(prev => {
      const current = prev[action] || { by: 'ev', order: 'desc' as const };
      if (current.by === by) {
        return { ...prev, [action]: { by, order: current.order === 'desc' ? 'asc' as const : 'desc' as const } };
      }
      return { ...prev, [action]: { by, order: 'desc' as const } };
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter input */}
      <div className="p-2 border-b border-slate-700 relative">
        <div className="flex gap-1">
          <input
            value={rangeInput}
            onChange={(e) => dispatch({ type: 'SET_RANGE_INPUT', payload: smartUpperCase(e.target.value) })}
            placeholder="Filter: AA, xxyy, RR, $B$M, (AA-TT)..."
            className="flex-1 bg-slate-700 text-white text-sm px-3 py-1.5 rounded border border-slate-600 focus:border-blue-500 focus:outline-none font-mono"
          />
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`px-2 py-1.5 text-xs font-bold rounded border transition-colors flex-shrink-0
              ${showHelp
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white hover:border-slate-400'
              }`}
          >
            ?
          </button>
        </div>
        {showHelp && <FilterHelp onClose={() => setShowHelp(false)} />}
        <div className="mt-1 px-1">
          <span className="text-xs text-slate-500">
            {rangeInput
              ? `${totalFiltered} / ${handActionMap.size} hands (${handActionMap.size > 0 ? ((totalFiltered / handActionMap.size) * 100).toFixed(1) : '0.0'}%)`
              : `${handActionMap.size} hands`}
          </span>
        </div>
      </div>

      {loading && (
        <div className="p-4 text-center text-slate-500 text-sm">Loading range data...</div>
      )}

      {!loading && handActionMap.size === 0 && !noData && (
        <div className="p-4 text-center text-slate-500 text-sm">
          Select a decision point to view range
        </div>
      )}

      {!loading && noData && (
        <div className="p-4 text-center">
          <div className="text-amber-400 text-sm font-medium mb-2">
            No solver data for this action path
          </div>
          <div className="text-slate-500 text-xs leading-relaxed">
            Monker solver did not generate frequency data for this branch.<br />
            This typically means the path was not fully solved.<br />
            Try a different action sequence.
          </div>
        </div>
      )}

      {/* Action columns */}
      {!loading && handActionMap.size > 0 && (
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full">
            {actionOrder.filter((action) => {
              const hands = groupedHands[action] || [];
              return hands.length > 0;
            }).map((action) => {
              const color = ACTION_COLORS[action];
              const hands = groupedHands[action] || [];
              const denominator = rangeInput ? totalFiltered : handActionMap.size;
              const pct = denominator > 0
                ? ((hands.length / denominator) * 100).toFixed(1)
                : '0.0';
              const isExpanded = expandedActions.has(action);
              const visibleHands = isExpanded ? hands : hands.slice(0, MAX_VISIBLE_HANDS);
              const hasMore = hands.length > MAX_VISIBLE_HANDS && !isExpanded;

              const sort = columnSorts[action] || { by: 'ev', order: 'desc' };

              return (
                <div key={action} className="flex-1 flex flex-col min-w-0 border-r border-slate-700 last:border-r-0">
                  {/* Column header */}
                  <div className={`${color?.bg || 'bg-slate-600'} px-2 py-1.5 flex-shrink-0`}>
                    <div className="text-[11px] font-bold text-white truncate text-center">{action}</div>
                    <div className="text-xs text-white/80 text-center">{pct}% ({hands.length})</div>
                    <div className="flex justify-center gap-1 mt-0.5">
                      <button
                        onClick={() => toggleColumnSort(action, 'ev')}
                        className={`text-[9px] px-1 rounded transition-colors ${
                          sort.by === 'ev' ? 'bg-white/20 text-white font-bold' : 'text-white/50 hover:text-white/80'
                        }`}
                      >
                        EV{sort.by === 'ev' ? (sort.order === 'desc' ? '↓' : '↑') : ''}
                      </button>
                      <button
                        onClick={() => toggleColumnSort(action, 'frequency')}
                        className={`text-[9px] px-1 rounded transition-colors ${
                          sort.by === 'frequency' ? 'bg-white/20 text-white font-bold' : 'text-white/50 hover:text-white/80'
                        }`}
                      >
                        %{sort.by === 'frequency' ? (sort.order === 'desc' ? '↓' : '↑') : ''}
                      </button>
                    </div>
                  </div>

                  {/* Hand list */}
                  <div className="flex-1 overflow-y-auto">
                    {visibleHands.map((entry) => (
                      <button
                        key={entry.hand}
                        onClick={() => {
                          dispatch({ type: 'SET_SELECTED_HANDS', payload: [entry.hand] });
                        }}
                        className="w-full flex items-center gap-1 px-1.5 py-[3px] hover:bg-slate-700/50 transition-colors text-left border-b border-slate-800/50"
                      >
                        <div className="flex-1 min-w-0">
                          {renderHandCompact(entry.hand)}
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                          {entry.totalEv !== 0 && (
                            <span className={`text-[11px] ${entry.totalEv > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {entry.totalEv > 0 ? '+' : ''}{(entry.totalEv / 1000).toFixed(2)}bb
                            </span>
                          )}
                          {entry.primaryFreq < 0.995 && (
                            <span className="text-[11px] text-slate-500">
                              {(entry.primaryFreq * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                    {hasMore && (
                      <button
                        onClick={() => toggleExpand(action)}
                        className="w-full py-1.5 text-xs text-blue-400 hover:text-blue-300 text-center"
                      >
                        +{hands.length - MAX_VISIBLE_HANDS} more...
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
