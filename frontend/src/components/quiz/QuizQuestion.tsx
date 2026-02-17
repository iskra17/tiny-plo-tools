import { useEffect, useState, useRef, useCallback } from 'react';
import { renderMonkerHand } from '../../utils/cardDisplay';
import { ACTION_COLORS } from '../../constants/poker';

interface Props {
  hand: string;
  actionOrder: string[];
  timerEnabled: boolean;
  timerSeconds: number;
  onAnswer: (action: string) => void;
  onTimeout: () => void;
}

export function QuizQuestion({ hand, actionOrder, timerEnabled, timerSeconds, onAnswer, onTimeout }: Props) {
  const [remaining, setRemaining] = useState(timerSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutFired = useRef(false);

  // Reset timer when hand changes
  useEffect(() => {
    setRemaining(timerSeconds);
    timeoutFired.current = false;
  }, [hand, timerSeconds]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!timerEnabled) { clearTimer(); return; }
    clearTimer();
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearTimer();
          if (!timeoutFired.current) {
            timeoutFired.current = true;
            setTimeout(onTimeout, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [timerEnabled, hand, clearTimer, onTimeout]);

  // Keyboard shortcuts: 1, 2, 3... for actions
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < actionOrder.length) {
        clearTimer();
        onAnswer(actionOrder[idx]);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [actionOrder, onAnswer, clearTimer]);

  const pct = timerEnabled ? (remaining / timerSeconds) * 100 : 100;
  const barColor = pct > 50 ? 'bg-blue-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {/* Timer bar */}
      {timerEnabled && (
        <div className="w-full max-w-md px-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-700 rounded overflow-hidden">
              <div className={`h-full ${barColor} transition-all duration-1000 ease-linear`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-xs font-mono w-6 text-right ${remaining <= 5 ? 'text-red-400 font-bold' : 'text-slate-400'}`}>{remaining}</span>
          </div>
        </div>
      )}

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
              onClick={() => { clearTimer(); onAnswer(action); }}
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
