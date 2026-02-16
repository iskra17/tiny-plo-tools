import { useStrategy } from '../hooks/useStrategy';

interface StrategyDisplayProps {
  simId: number | null;
  hand: string;
  actionPrefix: string;
}

const ACTION_COLORS: Record<string, string> = {
  Fold: 'bg-slate-600',
  Call: 'bg-green-600',
  RaisePot: 'bg-red-600',
  AllIn: 'bg-red-800',
  Raise100: 'bg-orange-600',
  Raise75: 'bg-amber-600',
  Raise50: 'bg-yellow-600',
  Raise33: 'bg-lime-600',
};

export function StrategyDisplay({ simId, hand, actionPrefix }: StrategyDisplayProps) {
  const { actions, loading, error } = useStrategy(simId, hand, actionPrefix);

  if (!simId || !hand) {
    return (
      <div className="text-slate-500 text-sm">
        Select a hand and navigate the action tree to see strategy.
      </div>
    );
  }

  if (loading) return <div className="text-slate-400 text-sm">Loading strategy...</div>;
  if (error) return <div className="text-red-400 text-sm">Error: {error}</div>;
  if (actions.length === 0) {
    return <div className="text-slate-500 text-sm">No strategy data found for this hand at this node.</div>;
  }

  // Sort by frequency descending
  const sorted = [...actions].sort((a, b) => b.frequency - a.frequency);
  const totalFreq = sorted.reduce((sum, a) => sum + a.frequency, 0);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
        Strategy for <span className="text-white">{hand}</span>
      </h3>

      {/* Frequency bar */}
      <div className="flex h-8 rounded overflow-hidden">
        {sorted
          .filter((a) => a.frequency > 0)
          .map((a) => (
            <div
              key={a.action}
              className={`${ACTION_COLORS[a.action] || 'bg-slate-500'} flex items-center justify-center text-xs font-bold text-white`}
              style={{ width: `${(a.frequency / (totalFreq || 1)) * 100}%` }}
              title={`${a.action}: ${(a.frequency * 100).toFixed(1)}%`}
            >
              {a.frequency >= 0.1 && a.action}
            </div>
          ))}
      </div>

      {/* Detail table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-left">
            <th className="py-1 pr-4">Action</th>
            <th className="py-1 pr-4 text-right">Frequency</th>
            <th className="py-1 text-right">EV (mSB)</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr key={a.action} className="border-t border-slate-700">
              <td className="py-1.5 pr-4 flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-sm ${
                    ACTION_COLORS[a.action] || 'bg-slate-500'
                  }`}
                />
                <span className="text-white font-medium">{a.action}</span>
              </td>
              <td className="py-1.5 pr-4 text-right text-slate-300">
                {(a.frequency * 100).toFixed(1)}%
              </td>
              <td className="py-1.5 text-right">
                <span className={a.ev >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {a.ev >= 0 ? '+' : ''}
                  {a.ev.toFixed(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
