import { useEffect, useState } from 'react';
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
  streak: number;
  onNext: () => void;
}

export function QuizFeedback({ hand, chosenAction, tier, evLoss, actions, actionOrder, streak, onNext }: Props) {
  const tierCfg = TIER_CONFIG[tier];
  const [showHelp, setShowHelp] = useState(false);

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
      {/* Tier badge with Korean label */}
      <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${tierCfg.bgColor} ${tierCfg.color} border ${tierCfg.borderColor}`}>
        {tierCfg.label} <span className="opacity-70 text-xs ml-1">({tierCfg.labelKo})</span>
        {streak >= 2 && (tier === 'Perfect' || tier === 'Correct') && (
          <span className="ml-2 text-orange-400">{'\uD83D\uDD25'}{streak}</span>
        )}
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

      {/* Action details — show EV for ALL actions */}
      <div className="w-full max-w-md px-4 space-y-1">
        {actionOrder.map((name) => {
          const data = actions[name];
          if (!data) return null;
          const pct = totalFreq > 0 ? (data.frequency / totalFreq) * 100 : 0;
          const color = ACTION_COLORS[name];
          const isChosen = name === chosenAction;
          const isBest = name === maxEvAction && !isNaN(data.ev) && data.ev !== 0;
          const evDisplay = isNaN(data.ev)
            ? '-'
            : data.ev === 0
              ? '0'
              : `${data.ev >= 0 ? '+' : ''}${(data.ev / 2000).toFixed(2)}bb`;
          const evColor = isNaN(data.ev) ? 'text-slate-500' : data.ev === 0 ? 'text-slate-400' : data.ev > 0 ? 'text-emerald-400' : 'text-red-400';
          return (
            <div
              key={name}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs
                ${isChosen ? 'bg-blue-950/60 ring-1 ring-blue-500/40' : 'bg-slate-800'}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color?.bg || 'bg-slate-400'}`} />
              <span className="text-slate-200 font-medium w-14">{name}</span>
              <div className="flex-1 h-1.5 bg-slate-600 rounded overflow-hidden">
                <div className={`h-full ${color?.bg || 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-slate-400 w-10 text-right">{pct.toFixed(1)}%</span>
              <span className={`w-14 text-right font-medium ${evColor}`}>
                {evDisplay}
              </span>
              <span className="w-14 flex-shrink-0 flex items-center justify-end gap-0.5">
                {isChosen && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">{'선택'}</span>}
                {isBest && <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">{'최적'}</span>}
              </span>
            </div>
          );
        })}
      </div>

      {/* Help toggle */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
      >
        <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px]">?</span>
        {showHelp ? '판정 기준 숨기기' : '판정 기준 보기'}
      </button>

      {/* Help content */}
      {showHelp && (
        <div className="w-full max-w-md px-4">
          <div className="bg-slate-800 rounded border border-slate-700 p-3 text-[11px] text-slate-400 space-y-2">
            <div className="font-bold text-slate-300 text-xs mb-1">{'GTO 빈도 해석 가이드'}</div>
            <p className="m-0">
              {'GTO 솔버는 하나의 핸드에 대해 여러 액션을 '}
              <strong className="text-slate-300">{'빈도(Frequency)'}</strong>
              {'로 섞어서 사용합니다. 예: Call 34% / Pot 66%라면, 이 핸드로 66%는 Pot, 34%는 Call하는 것이 최적입니다.'}
            </p>
            <p className="m-0">
              <strong className="text-slate-300">EV</strong>
              {'는 각 액션의 기대값(Expected Value)입니다. ★표시된 액션이 최고 EV입니다.'}
            </p>
            <div className="border-t border-slate-700 pt-2 mt-2">
              <div className="font-bold text-slate-300 mb-1">{'판정 기준'}</div>
              <div className="space-y-0.5">
                <div><span className="text-emerald-400 font-bold">{'Perfect (퍼펙트)'}</span>{' — 최고 빈도 액션 선택 + 70% 초과'}</div>
                <div><span className="text-green-400 font-bold">{'Correct (정답)'}</span>{' — 빈도 30% 초과 액션 선택'}</div>
                <div><span className="text-yellow-400 font-bold">{'Inaccuracy (부정확)'}</span>{' — 빈도 10~30% 액션 선택'}</div>
                <div><span className="text-orange-400 font-bold">{'Mistake (실수)'}</span>{' — 빈도 3~10% 액션 선택'}</div>
                <div><span className="text-red-400 font-bold">{'Blunder (대악수)'}</span>{' — 빈도 3% 미만 액션 선택'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

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
