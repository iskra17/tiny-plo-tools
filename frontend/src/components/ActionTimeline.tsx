import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { ACTION_COLORS } from '../constants/poker';
import { computeActionSteps } from '../utils/positionCycle';

export function ActionTimeline() {
  const { state, dispatch } = useAppContext();
  const { actionCodes, currentPosition } = state;

  const steps = useMemo(() => computeActionSteps(actionCodes), [actionCodes]);

  if (steps.length === 0) return null;

  const handleClickStep = (stepIndex: number) => {
    // Navigate to just before this step: slice actionCodes up to the original index
    const newCodes = actionCodes.slice(0, stepIndex);
    dispatch({ type: 'SET_ACTION_CODES', payload: newCodes });
  };

  const isTerminal = currentPosition === '';

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 overflow-x-auto border-t border-slate-700/50">
      <span className="text-[9px] text-slate-500 mr-1 flex-shrink-0">Action:</span>

      {steps.map((step, displayIdx) => {
        const color = ACTION_COLORS[step.action];
        const bgClass = color?.bg || 'bg-slate-600';
        // Show round marker when entering round 2+ (original index >= 6)
        const showRoundMarker = displayIdx > 0 && step.index >= 6 && steps[displayIdx - 1].index < 6;

        return (
          <div key={step.index} className="flex items-center flex-shrink-0">
            {/* Round 2 marker */}
            {showRoundMarker && (
              <>
                <span className="text-[9px] text-slate-600 mx-0.5">|</span>
                <span className="text-[9px] text-amber-400 font-bold mx-0.5">R2</span>
                <span className="text-[9px] text-slate-600 mx-0.5">|</span>
              </>
            )}

            {/* Arrow before chip (except first) */}
            {displayIdx > 0 && !showRoundMarker && (
              <span className="text-[9px] text-slate-600 mx-0.5">&rarr;</span>
            )}

            {/* Action chip */}
            <button
              onClick={() => handleClickStep(step.index)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold text-white ${bgClass} hover:brightness-125 transition-all cursor-pointer`}
              title={`Go back to before ${step.position}'s ${step.action}`}
            >
              {step.position}:{step.action}
            </button>
          </div>
        );
      })}

      {/* Current step or Terminal */}
      <span className="text-[9px] text-slate-600 mx-0.5 flex-shrink-0">&rarr;</span>
      {isTerminal ? (
        <span className="text-[9px] text-slate-400 font-bold px-1.5 py-0.5 bg-slate-700 rounded flex-shrink-0">
          Terminal
        </span>
      ) : (
        <span className="text-[9px] text-blue-400 font-bold px-1.5 py-0.5 bg-blue-600/20 border border-blue-500/50 rounded animate-pulse flex-shrink-0">
          {currentPosition}:?
        </span>
      )}
    </div>
  );
}
