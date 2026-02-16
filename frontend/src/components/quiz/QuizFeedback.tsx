import { useEffect } from 'react';
import { ACTION_COLORS } from '../../constants/poker';
import { renderMonkerHand } from '../../utils/cardDisplay';
import { TIER_CONFIG, type TierName } from './quizUtils';

interface Props {
  hand: string;
  chosenAction: string;
  tier: TierName;
  evLoss: number;
  actions: Record<string, { frequency: number; ev: number }>;
  actionOrder: string[];
  onNext: () => void;
}

export function QuizFeedback({ hand, chosenAction, tier, evLoss, actions, actionOrder, onNext }: Props) {
  const tierCfg = TIER_CONFIG[tier];

  // Find max EV action (exclude NaN from derived actions)
  let maxEvAction = '';
  let maxEv = -Infinity;
  for (const name of actionOrder) {
    const data = actions[name];
    if (data && !isNaN(data.ev) && data.ev > maxEv) {
      maxEv = data.ev;
      maxEvAction = name;
    }
  }

  // Keyboard: Enter/Space → next hand
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onNext();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onNext]);

  // Total frequency for percentage calculation
  const totalFreq = Object.values(actions).reduce((s, a) => s + a.frequency, 0);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Tier badge */}
      <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${tierCfg.bgColor} ${tierCfg.color} border ${tierCfg.borderColor}`}>
        {tierCfg.label}
      </div>

      {/* Hand */}
      <div className="flex gap-2">{renderMonkerHand(hand)}</div>

      {/* Chosen action summary */}
      <div className="text-sm text-slate-300">
        You chose <span className="font-semibold text-white">{chosenAction}</span>
        {' '}({totalFreq > 0 ? ((actions[chosenAction]?.frequency || 0) / totalFreq * 100).toFixed(1) : '0'}%)
      </div>

      {/* EV Loss */}
      {evLoss > 0.001 && (
        <div className="text-xs text-red-400">
          EV Loss: -{evLoss.toFixed(2)}bb
        </div>
      )}

      {/* Strategy breakdown bar */}
      <div className="w-full max-w-md px-4">
        <div className="flex h-7 rounded overflow-hidden">
          {actionOrder.map((name) => {
            const data = actions[name];
            if (!data) return null;
            const pct = totalFreq > 0 ? (data.frequency / totalFreq) * 100 : 0;
            if (pct < 0.5) return null;
            const color = ACTION_COLORS[name];
            const isChosen = name === chosenAction;
            return (
              <div
                key={name}
                className={`${color?.bg || 'bg-slate-500'} flex items-center justify-center text-[10px] text-white font-medium
                  ${isChosen ? 'ring-2 ring-white/60 ring-inset' : ''}`}
                style={{ width: `${Math.max(pct, 3)}%` }}
              >
                {pct > 12 && `${name} ${pct.toFixed(0)}%`}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action details */}
      <div className="w-full max-w-md px-4 space-y-1">
        {actionOrder.map((name) => {
          const data = actions[name];
          if (!data) return null;
          const pct = totalFreq > 0 ? (data.frequency / totalFreq) * 100 : 0;
          const color = ACTION_COLORS[name];
          const isChosen = name === chosenAction;
          const isBest = name === maxEvAction && !isNaN(data.ev) && data.ev !== 0;
          return (
            <div
              key={name}
              className={`flex items-center gap-2 px-2 py-1 rounded text-xs
                ${isChosen ? 'bg-slate-700 ring-1 ring-white/20' : 'bg-slate-800'}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color?.bg || 'bg-slate-400'}`} />
              <span className="text-slate-200 font-medium w-16">{name}</span>
              <div className="flex-1 h-1.5 bg-slate-700 rounded overflow-hidden">
                <div className={`h-full ${color?.bg || 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-slate-400 w-12 text-right">{pct.toFixed(1)}%</span>
              <span className={`w-14 text-right font-medium ${
                isNaN(data.ev) || data.ev === 0 ? 'text-slate-500' : data.ev >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {isNaN(data.ev) || data.ev === 0 ? '-' : `${data.ev >= 0 ? '+' : ''}${(data.ev / 1000).toFixed(2)}bb`}
              </span>
              {isBest && <span className="text-emerald-500 text-[10px]">★</span>}
              {isChosen && <span className="text-white text-[10px]">◄</span>}
            </div>
          );
        })}
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-colors"
      >
        Next Hand <span className="opacity-50 text-xs ml-1">Enter</span>
      </button>
    </div>
  );
}
