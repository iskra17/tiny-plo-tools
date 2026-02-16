import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { ACTION_COLORS } from '../constants/poker';
import { renderMonkerHand } from '../utils/cardDisplay';
import { calculateBetState } from '../utils/betCalculator';

const TABLE_POSITIONS = [
  { name: 'UTG', x: 25, y: 18, stackDefault: 100 },
  { name: 'MP', x: 75, y: 18, stackDefault: 100 },
  { name: 'CO', x: 92, y: 50, stackDefault: 100 },
  { name: 'BU', x: 75, y: 82, stackDefault: 100 },
  { name: 'SB', x: 25, y: 82, stackDefault: 100 },
  { name: 'BB', x: 8, y: 50, stackDefault: 100 },
];

// Bet chip: direction toward table center, far enough to avoid overlap
const BET_POSITIONS: Record<string, { dx: number; dy: number }> = {
  UTG: { dx: 18, dy: 42 },
  MP: { dx: -18, dy: 42 },
  CO: { dx: -48, dy: 0 },
  BU: { dx: -18, dy: -42 },
  SB: { dx: 18, dy: -42 },
  BB: { dx: 48, dy: 0 },
};

function formatBet(amount: number): string {
  if (amount === Math.floor(amount)) return amount.toString();
  return amount.toFixed(1);
}

/** 4 face-down cards in a horizontal row */
function FaceDownCards() {
  return (
    <div className="flex flex-row gap-[1px]">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-[10px] h-[14px] bg-slate-500 rounded-[1px] border border-slate-400/50"
        />
      ))}
    </div>
  );
}

export function PokerTable() {
  const { state } = useAppContext();
  const { actionHistory, currentPosition, selectedHands } = state;

  const betState = useMemo(() => calculateBetState(actionHistory), [actionHistory]);

  const displayHand = selectedHands.length > 0 ? selectedHands[0] : null;

  return (
    <div className="relative w-full max-w-[420px] mx-auto aspect-[16/10] bg-slate-800 rounded-xl overflow-hidden">
      {/* Table felt */}
      <div className="absolute inset-4 bg-emerald-800 rounded-[40%] border-4 border-emerald-900 shadow-inner" />

      {/* Pot info */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
        {displayHand ? (
          <div className="flex gap-1 mb-2 justify-center">
            {renderMonkerHand(displayHand)}
          </div>
        ) : (
          <div className="text-emerald-300/50 text-xs mb-1">Select a hand</div>
        )}
        <div className="text-white text-sm font-semibold">
          Pot: {formatBet(betState.pot)} BB
        </div>
      </div>

      {/* Position seats */}
      {TABLE_POSITIONS.map((pos) => {
        const posActions = actionHistory.filter((h) => h.position === pos.name);
        const historyItem = posActions.length > 0 ? posActions[posActions.length - 1] : undefined;
        const isCurrent = currentPosition === pos.name;
        const actionColor = historyItem ? ACTION_COLORS[historyItem.action] : null;
        const posState = betState.positions[pos.name];
        const betAmount = posState?.currentBet || 0;
        const isFolded = posState?.folded || false;
        const betPos = BET_POSITIONS[pos.name];

        return (
          <div
            key={pos.name}
            className="absolute z-20 flex flex-col items-center"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {/* Face-down cards ABOVE seat (only if not folded) */}
            {!isFolded && (
              <div className="mb-0.5">
                <FaceDownCards />
              </div>
            )}

            {/* Seat */}
            <div
              className={`
                flex items-center gap-1 px-2 py-1 rounded text-xs font-bold
                ${isCurrent
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-800'
                  : isFolded
                    ? 'bg-slate-700/80 text-slate-500'
                    : 'bg-slate-700 text-slate-200'
                }
              `}
            >
              <span>{pos.name}</span>
              <span className="text-slate-400 font-normal">{formatBet(pos.stackDefault - (posState?.currentBet || 0))}</span>
            </div>

            {/* Action badge BELOW seat */}
            {historyItem && (
              <div className={`text-xs px-1.5 py-0.5 rounded mt-0.5 font-medium ${actionColor?.bg || 'bg-slate-600'} text-white`}>
                {historyItem.action}
              </div>
            )}

            {/* Bet amount chip — toward center (show even if folded: dead money) */}
            {betAmount > 0 && (
              <div
                className="absolute text-[11px] font-bold text-yellow-300 bg-slate-900/80 px-1.5 py-0.5 rounded-full border border-yellow-500/40"
                style={{
                  left: `calc(50% + ${betPos.dx}px)`,
                  top: `calc(50% + ${betPos.dy}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {formatBet(betAmount)}
              </div>
            )}

            {/* Dealer button */}
            {pos.name === 'BU' && (
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] font-black text-slate-900">
                D
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
