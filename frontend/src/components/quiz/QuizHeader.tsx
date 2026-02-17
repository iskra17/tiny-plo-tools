import { TIER_CONFIG, type SessionStats } from './quizUtils';

interface Props {
  stats: SessionStats;
  reviewMode?: boolean;
  onExit: () => void;
}

export function QuizHeader({ stats, reviewMode, onExit }: Props) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-slate-800 border-b border-slate-700">
      {/* Title */}
      <span className="text-sm font-semibold text-white">Quiz</span>

      {/* Review mode badge */}
      {reviewMode && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-medium">
          복습 모드
        </span>
      )}

      {/* Stats */}
      {stats.total > 0 && (
        <>
          <span className="text-xs text-slate-400">#{stats.total}</span>
          <span className={`text-xs font-medium ${stats.accuracy >= 0.7 ? 'text-emerald-400' : stats.accuracy >= 0.4 ? 'text-yellow-400' : 'text-red-400'}`}>
            {(stats.accuracy * 100).toFixed(0)}%
          </span>
          {stats.avgEvLoss > 0.001 && (
            <span className="text-xs text-red-400">
              -{stats.avgEvLoss.toFixed(2)}bb/hand
            </span>
          )}
          {/* Streak */}
          {stats.streak > 0 && (
            <span className={`text-xs font-bold ${stats.streak >= 5 ? 'text-orange-400' : 'text-yellow-400'}`} title={`Best: ${stats.bestStreak}`}>
              {'\uD83D\uDD25'}{stats.streak}
            </span>
          )}
          {stats.bestStreak > 0 && stats.streak === 0 && (
            <span className="text-[10px] text-slate-500" title="Best streak">
              Best {'\uD83D\uDD25'}{stats.bestStreak}
            </span>
          )}
          {/* Tier mini badges */}
          <div className="flex gap-1 ml-auto mr-2">
            {(['Perfect', 'Correct', 'Inaccuracy', 'Mistake', 'Blunder'] as const).map((tier) => {
              const count = stats.tiers[tier];
              if (count === 0) return null;
              const cfg = TIER_CONFIG[tier];
              return (
                <span key={tier} className={`text-[10px] px-1.5 py-0.5 rounded ${cfg.bgColor} ${cfg.color}`} title={`${cfg.label} (${cfg.labelKo})`}>
                  {cfg.labelKo.slice(0, 2)} {count}
                </span>
              );
            })}
          </div>
        </>
      )}

      {/* Exit */}
      <button
        onClick={onExit}
        className="ml-auto text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors"
      >
        Exit Quiz
      </button>
    </div>
  );
}
