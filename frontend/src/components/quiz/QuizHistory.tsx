import { useState } from 'react';
import { renderHandCompact } from '../../utils/cardDisplay';
import { TIER_CONFIG, type HistoryEntry } from './quizUtils';

interface Props {
  history: HistoryEntry[];
}

export function QuizHistory({ history }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (history.length === 0) return null;

  const displayed = expanded ? history : history.slice(-5);

  return (
    <div className="border-t border-slate-700 px-3 py-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-slate-400 hover:text-slate-200 mb-1"
      >
        History ({history.length}) {expanded ? '▲' : '▼'}
      </button>

      <div className="space-y-0.5">
        {displayed.map((entry, i) => {
          const cfg = TIER_CONFIG[entry.tier];
          const globalIdx = expanded ? i : history.length - 5 + i;
          return (
            <div key={globalIdx} className="flex items-center gap-2 text-xs py-0.5">
              <span className="text-slate-500 w-4 text-right">{globalIdx + 1}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.bgColor} ${cfg.color}`}>
                {cfg.label.slice(0, 3)}
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
