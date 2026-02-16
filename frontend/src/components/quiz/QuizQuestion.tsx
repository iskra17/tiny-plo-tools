import { useEffect } from 'react';
import { renderMonkerHand } from '../../utils/cardDisplay';
import { ACTION_COLORS } from '../../constants/poker';

interface Props {
  hand: string;
  actionOrder: string[];
  onAnswer: (action: string) => void;
}

export function QuizQuestion({ hand, actionOrder, onAnswer }: Props) {
  // Keyboard shortcuts: 1, 2, 3... for actions
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < actionOrder.length) {
        onAnswer(actionOrder[idx]);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [actionOrder, onAnswer]);

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {/* Hand display */}
      <div className="text-sm text-slate-400 font-medium">What is the correct action?</div>
      <div className="flex gap-2">{renderMonkerHand(hand)}</div>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap justify-center">
        {actionOrder.map((action, i) => {
          const color = ACTION_COLORS[action];
          return (
            <button
              key={action}
              onClick={() => onAnswer(action)}
              className={`${color?.bg || 'bg-slate-600'} ${color?.hover || 'hover:bg-slate-500'}
                text-white font-semibold px-6 py-3 rounded-lg text-sm transition-all
                active:scale-95 shadow-md min-w-[90px]`}
            >
              <span className="opacity-50 text-xs mr-1">{i + 1}</span>
              {action}
            </button>
          );
        })}
      </div>
    </div>
  );
}
