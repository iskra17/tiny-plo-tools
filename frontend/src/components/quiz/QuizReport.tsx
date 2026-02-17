import { renderHandCompact } from '../../utils/cardDisplay';
import { TIER_CONFIG, type SessionStats, type HistoryEntry, type TierName } from './quizUtils';

interface Props {
  stats: SessionStats;
  history: HistoryEntry[];
  onRestart: () => void;
  onExit: () => void;
}

const TIER_ORDER: TierName[] = ['Perfect', 'Correct', 'Inaccuracy', 'Mistake', 'Blunder'];

export function QuizReport({ stats, history, onRestart, onExit }: Props) {
  // Top 5 worst hands by EV loss
  const worstHands = [...history]
    .filter(h => h.evLoss > 0)
    .sort((a, b) => b.evLoss - a.evLoss)
    .slice(0, 5);

  return (
    <div className="flex flex-col items-center gap-5 py-6 px-4">
      <div className="text-lg font-bold text-white">Session Report</div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-[10px] text-slate-400">Total Hands</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${stats.accuracy >= 0.7 ? 'text-emerald-400' : stats.accuracy >= 0.4 ? 'text-yellow-400' : 'text-red-400'}`}>
            {(stats.accuracy * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] text-slate-400">Accuracy</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-400">
            {stats.avgEvLoss > 0.001 ? `-${stats.avgEvLoss.toFixed(2)}` : '0.00'}
          </div>
          <div className="text-[10px] text-slate-400">Avg EV Loss (bb)</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">
            {'\uD83D\uDD25'}{stats.bestStreak}
          </div>
          <div className="text-[10px] text-slate-400">Best Streak</div>
        </div>
      </div>

      {/* Tier distribution bar */}
      <div className="w-full max-w-sm">
        <div className="text-xs text-slate-400 mb-1.5 font-medium">Tier Distribution</div>
        {stats.total > 0 && (
          <div className="flex h-7 rounded overflow-hidden">
            {TIER_ORDER.map(tier => {
              const count = stats.tiers[tier];
              if (count === 0) return null;
              const pct = (count / stats.total) * 100;
              const cfg = TIER_CONFIG[tier];
              return (
                <div
                  key={tier}
                  className={`${cfg.bgColor} ${cfg.color} flex items-center justify-center text-[10px] font-medium border-r border-slate-900/20 last:border-r-0`}
                  style={{ width: `${Math.max(pct, 4)}%` }}
                  title={`${cfg.labelKo}: ${count} (${pct.toFixed(0)}%)`}
                >
                  {pct > 10 && `${count}`}
                </div>
              );
            })}
          </div>
        )}
        {/* Tier legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
          {TIER_ORDER.map(tier => {
            const count = stats.tiers[tier];
            if (count === 0) return null;
            const cfg = TIER_CONFIG[tier];
            return (
              <span key={tier} className={`text-[10px] ${cfg.color}`}>
                {cfg.labelKo} {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Worst hands */}
      {worstHands.length > 0 && (
        <div className="w-full max-w-sm">
          <div className="text-xs text-slate-400 mb-1.5 font-medium">Most EV Lost</div>
          <div className="space-y-1">
            {worstHands.map((entry, i) => {
              const cfg = TIER_CONFIG[entry.tier];
              return (
                <div key={i} className="flex items-center gap-2 bg-slate-800 rounded px-2.5 py-1.5 text-xs">
                  <span className="text-slate-500 w-3">{i + 1}</span>
                  <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${cfg.bgColor} ${cfg.color}`}>{cfg.labelKo.slice(0, 2)}</span>
                  <span>{renderHandCompact(entry.hand)}</span>
                  <span className="text-slate-500">{entry.chosenAction}</span>
                  <span className="text-red-400 ml-auto font-medium">-{entry.evLoss.toFixed(2)}bb</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mt-2">
        <button
          onClick={onRestart}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-colors"
        >
          다시 시작
        </button>
        <button
          onClick={onExit}
          className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg text-sm transition-colors"
        >
          나가기
        </button>
      </div>
    </div>
  );
}
