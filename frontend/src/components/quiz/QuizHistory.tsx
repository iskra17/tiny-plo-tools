import { useState } from 'react';
import { renderHandCompact } from '../../utils/cardDisplay';
import { TIER_CONFIG, type HistoryEntry } from './quizUtils';

interface Props {
  history: HistoryEntry[];
  reviewMode: boolean;
  onStartReview: () => void;
}

export function QuizHistory({ history, reviewMode, onStartReview }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (history.length === 0) return null;

  const wrongCount = history.filter(h => h.tier !== 'Perfect' && h.tier !== 'Correct').length;
  const displayed = expanded ? history : history.slice(-5);

  return (
    <div className="border-t border-slate-700 px-3 py-2">
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          History ({history.length}) {expanded ? '\u25B2' : '\u25BC'}
        </button>

        {/* Review button */}
        {!reviewMode && wrongCount > 0 && (
          <button
            onClick={onStartReview}
            className="ml-auto text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 transition-colors"
          >
            오답 복습 ({wrongCount})
          </button>
        )}
      </div>

      <div className="space-y-0.5">
        {displayed.map((entry, i) => {
          const cfg = TIER_CONFIG[entry.tier];
          const globalIdx = expanded ? i : history.length - 5 + i;
          return (
            <div key={globalIdx} className="flex items-center gap-2 text-xs py-0.5">
              <span className="text-slate-500 w-4 text-right">{globalIdx + 1}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.bgColor} ${cfg.color}`} title={cfg.label}>
                {cfg.labelKo.slice(0, 2)}
              </span>
              <span>{renderHandCompact(entry.hand)}</span>
              <span className="text-slate-400">{entry.chosenAction}</span>
              {entry.evLoss > 0.001 && (
                <span className="text-red-400 ml-auto">-{entry.evLoss.toFixed(2)}bb</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
