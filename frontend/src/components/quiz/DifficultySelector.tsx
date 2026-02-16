import { DIFFICULTY_OPTIONS, type DifficultyLevel } from './quizUtils';

const LEVELS: DifficultyLevel[] = ['easy', 'normal', 'hard', 'expert'];

interface Props {
  selected: DifficultyLevel;
  poolCounts: Record<DifficultyLevel, number>;
  onChange: (level: DifficultyLevel) => void;
}

export function DifficultySelector({ selected, poolCounts, onChange }: Props) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {LEVELS.map((level) => {
        const cfg = DIFFICULTY_OPTIONS[level];
        const isActive = level === selected;
        const count = poolCounts[level];
        return (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer
              ${isActive
                ? `${cfg.color} bg-slate-700 ring-1 ring-current`
                : 'text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-slate-200'
              }`}
          >
            {cfg.labelEn}
            <span className="ml-1 opacity-60">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
