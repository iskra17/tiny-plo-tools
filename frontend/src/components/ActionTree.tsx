import { useEffect, useState } from 'react';
import { api, type TreeNode } from '../api/client';

const ACTION_MAP: Record<string, string> = {
  '0': 'Fold',
  '1': 'Call',
  '2': 'RaisePot',
  '3': 'AllIn',
  '40100': 'Raise100',
  '40075': 'Raise75',
  '40050': 'Raise50',
  '40033': 'Raise33',
};

const POSITIONS = ['UTG', 'MP', 'CO', 'BU', 'SB', 'BB'];

const ACTION_COLORS: Record<string, string> = {
  Fold: 'bg-slate-600 hover:bg-slate-500',
  Call: 'bg-green-700 hover:bg-green-600',
  RaisePot: 'bg-red-700 hover:bg-red-600',
  AllIn: 'bg-red-900 hover:bg-red-800',
  Raise100: 'bg-orange-700 hover:bg-orange-600',
  Raise75: 'bg-amber-700 hover:bg-amber-600',
  Raise50: 'bg-yellow-700 hover:bg-yellow-600',
  Raise33: 'bg-lime-700 hover:bg-lime-600',
};

interface ActionTreeProps {
  simId: number | null;
  actionCodes: string[];
  onPushAction: (code: string) => void;
  onPopAction: () => void;
  onReset: () => void;
}

interface ActionOption {
  code: string;
  label: string;
  filename: string;
}

export function ActionTree({ simId, actionCodes, onPushAction, onPopAction, onReset }: ActionTreeProps) {
  const [availableActions, setAvailableActions] = useState<ActionOption[]>([]);
  const [loading, setLoading] = useState(false);

  const actionPrefix = actionCodes.join('.');
  const currentPosition = POSITIONS[actionCodes.length % POSITIONS.length];

  useEffect(() => {
    if (!simId) return;

    setLoading(true);
    api
      .getAvailableActions(simId, actionPrefix)
      .then((nodes: TreeNode[]) => {
        const options = nodes.map((node) => {
          const base = node.filename.replace(/\.rng$/, '');
          const parts = base.split('.');
          const lastCode = parts[parts.length - 1];
          return {
            code: lastCode,
            label: ACTION_MAP[lastCode] || lastCode,
            filename: node.filename,
          };
        });
        // Deduplicate and sort
        const unique = Array.from(new Map(options.map((o) => [o.code, o])).values());
        setAvailableActions(unique);
      })
      .finally(() => setLoading(false));
  }, [simId, actionPrefix]);

  // Build history display
  const history = actionCodes.map((code, i) => ({
    position: POSITIONS[i % POSITIONS.length],
    action: ACTION_MAP[code] || code,
    code,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Action Tree
        </h3>
        {actionCodes.length > 0 && (
          <div className="flex gap-1.5">
            <button
              onClick={onPopAction}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded border border-slate-600 hover:border-slate-400"
            >
              Undo
            </button>
            <button
              onClick={onReset}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded border border-slate-600 hover:border-slate-400"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Action history */}
      {history.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {history.map((h, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-xs text-slate-400">{h.position}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded text-white ${
                  ACTION_COLORS[h.action] || 'bg-slate-600'
                }`}
              >
                {h.action}
              </span>
              {i < history.length - 1 && <span className="text-slate-600 mx-0.5">&rarr;</span>}
            </span>
          ))}
        </div>
      )}

      {/* Current position and available actions */}
      <div>
        <div className="text-sm text-slate-400 mb-2">
          <span className="font-semibold text-white">{currentPosition}</span> to act:
        </div>
        {loading ? (
          <div className="text-slate-500 text-sm">Loading...</div>
        ) : availableActions.length === 0 ? (
          <div className="text-slate-500 text-sm">
            {simId ? 'No further actions (terminal node)' : 'Select a simulation first'}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableActions.map((opt) => (
              <button
                key={opt.code}
                onClick={() => onPushAction(opt.code)}
                className={`
                  px-4 py-2 rounded text-sm font-semibold text-white
                  transition-all ${ACTION_COLORS[opt.label] || 'bg-slate-600 hover:bg-slate-500'}
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
