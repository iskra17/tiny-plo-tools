import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { parseRangeExpression, validateMonkerHand, normalizeMonkerHand } from '../../utils/rangeParser';

export function RangeInput() {
  const { state, dispatch } = useAppContext();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const patterns = parseRangeExpression(state.rangeInput);
    if (patterns.length === 0) {
      setError('Enter at least one hand pattern');
      return;
    }

    const invalid = patterns.filter((p) => !validateMonkerHand(p));
    if (invalid.length > 0) {
      setError(`Invalid patterns: ${invalid.join(', ')}`);
      return;
    }

    setError(null);
    // Normalize each hand to canonical Monker order (e.g. JJTT → TTJJ)
    // but keep wildcards as-is
    const normalized = patterns.map((p) => p.includes('*') ? p : normalizeMonkerHand(p));
    dispatch({ type: 'SET_SELECTED_HANDS', payload: normalized });
    dispatch({ type: 'SET_SELECTION_MODE', payload: 'range' });
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'range' });
  };

  return (
    <div className="p-3 space-y-2">
      <div className="text-xs text-slate-400 mb-1">
        Enter hands in Monker notation (comma-separated)
      </div>
      <textarea
        value={state.rangeInput}
        onChange={(e) => {
          dispatch({ type: 'SET_RANGE_INPUT', payload: e.target.value });
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="AAAA, (KA)Q2, AA**, (AK)(**)"
        className="w-full bg-slate-700 text-white text-sm px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none resize-none font-mono"
        rows={3}
      />
      {error && (
        <div className="text-red-400 text-xs">{error}</div>
      )}
      <button
        onClick={handleSubmit}
        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
      >
        Search
      </button>
    </div>
  );
}
