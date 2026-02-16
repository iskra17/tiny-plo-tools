import { useState, useEffect } from 'react';
import { api, type RangeHand, type RangeResponse } from '../api/client';

interface RangeViewProps {
  simId: number | null;
  filename: string;
}

export function RangeView({ simId, filename }: RangeViewProps) {
  const [data, setData] = useState<RangeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [minFreq, setMinFreq] = useState(0);
  const [showCount, setShowCount] = useState(100);

  useEffect(() => {
    if (!simId || !filename) {
      setData(null);
      return;
    }

    setLoading(true);
    api
      .getRange(simId, filename, minFreq)
      .then(setData)
      .finally(() => setLoading(false));
  }, [simId, filename, minFreq]);

  if (!simId || !filename) return null;
  if (loading) return <div className="text-slate-400 text-sm">Loading range...</div>;
  if (!data) return null;

  const displayed = data.hands.slice(0, showCount);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Range View
          <span className="ml-2 text-slate-500 font-normal normal-case">
            ({data.totalHands} hands)
          </span>
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-slate-400">Min freq:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={minFreq}
            onChange={(e) => setMinFreq(parseFloat(e.target.value))}
            className="w-24"
          />
          <span className="text-slate-300 w-12 text-right">{(minFreq * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        {data.node.actionSequence || 'Root'} &mdash; {data.node.actingPosition} to act
      </div>

      {/* Hand list */}
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-800">
            <tr className="text-slate-400 text-left">
              <th className="py-1 pr-3">Hand</th>
              <th className="py-1 pr-3 text-right">Freq</th>
              <th className="py-1 text-right">EV</th>
              <th className="py-1 pl-3">Bar</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((h: RangeHand) => (
              <tr key={h.hand} className="border-t border-slate-700/50">
                <td className="py-0.5 pr-3 font-mono text-white">{h.hand}</td>
                <td className="py-0.5 pr-3 text-right text-slate-300">
                  {(h.frequency * 100).toFixed(1)}%
                </td>
                <td className="py-0.5 text-right">
                  <span className={h.ev >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {h.ev.toFixed(0)}
                  </span>
                </td>
                <td className="py-0.5 pl-3 w-24">
                  <div className="bg-slate-700 h-2 rounded overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded"
                      style={{ width: `${h.frequency * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.hands.length > showCount && (
        <button
          onClick={() => setShowCount((c) => c + 100)}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Show more ({data.hands.length - showCount} remaining)
        </button>
      )}
    </div>
  );
}
