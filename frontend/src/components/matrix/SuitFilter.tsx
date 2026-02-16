import { useAppContext } from '../../context/AppContext';
import { SUIT_FILTERS, type SuitFilterType } from '../../constants/poker';

const SUIT_FILTER_LABELS: Record<SuitFilterType, string> = {
  all: 'All',
  double: 'Double Suited',
  single: 'Single Suited',
  triple: 'Triple Suited',
  rainbow: 'Rainbow',
};

export function SuitFilter() {
  const { state, dispatch } = useAppContext();
  const current = state.matrixState.suitFilter;

  return (
    <div className="flex flex-wrap gap-1 px-3 py-2 bg-slate-800 border-b border-slate-700">
      <span className="text-xs text-slate-500 mr-1 self-center">Suit:</span>
      {SUIT_FILTERS.map((filter) => (
        <button
          key={filter}
          onClick={() => dispatch({ type: 'SET_MATRIX_STATE', payload: { suitFilter: filter } })}
          className={`px-2 py-0.5 text-xs rounded transition-colors ${
            current === filter
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
          }`}
        >
          {SUIT_FILTER_LABELS[filter]}
        </button>
      ))}
    </div>
  );
}
