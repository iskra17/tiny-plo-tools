import { useAppContext } from '../context/AppContext';

export function ActionBreadcrumb() {
  const { state, dispatch } = useAppContext();
  const { actionHistory, currentPosition } = state;

  if (actionHistory.length === 0) return null;

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-800/50 border-t border-slate-700 text-xs flex-wrap">
      <span className="text-slate-500 mr-1">Path:</span>
      {actionHistory.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <button
            onClick={() => dispatch({ type: 'SET_ACTION_CODES', payload: state.actionCodes.slice(0, i) })}
            className="text-slate-400 hover:text-blue-400 transition-colors"
          >
            {item.position}
          </button>
          <span className="text-blue-400 font-medium">{item.action}</span>
          <span className="text-slate-600">›</span>
        </span>
      ))}
      <span className="text-yellow-400 font-medium">{currentPosition} ?</span>
    </div>
  );
}
