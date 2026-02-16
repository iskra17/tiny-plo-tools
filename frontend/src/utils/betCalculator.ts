import { ACTION_MAP, POSITIONS_6MAX, type ActionHistoryItem } from '../constants/poker';

interface PositionBetState {
  currentBet: number;
  folded: boolean;
}

interface BetState {
  positions: Record<string, PositionBetState>;
  pot: number;
}

/**
 * Calculate per-position bet amounts and pot from action history.
 * All values in BB units.
 */
export function calculateBetState(actionHistory: ActionHistoryItem[]): BetState {
  const positions: Record<string, PositionBetState> = {};
  for (const pos of POSITIONS_6MAX) {
    positions[pos] = { currentBet: 0, folded: false };
  }

  // Blinds
  positions['SB'].currentBet = 0.5;
  positions['BB'].currentBet = 1;

  let pot = 1.5; // SB + BB
  let currentBetToMatch = 1; // BB

  for (const item of actionHistory) {
    const pos = item.position;
    const actionName = ACTION_MAP[item.code] || item.action;

    if (actionName === 'Fold') {
      positions[pos].folded = true;
      continue;
    }

    const alreadyIn = positions[pos].currentBet;
    const amountToCall = currentBetToMatch - alreadyIn;

    if (actionName === 'Call') {
      positions[pos].currentBet = currentBetToMatch;
      pot += amountToCall;
    } else if (actionName === 'Pot') {
      const potAfterCall = pot + amountToCall;
      const raiseSize = potAfterCall; // 100% pot raise
      const totalBet = alreadyIn + amountToCall + raiseSize;
      pot += amountToCall + raiseSize;
      positions[pos].currentBet = totalBet;
      currentBetToMatch = totalBet;
    } else if (actionName === 'AllIn') {
      // Treat as 100bb all-in
      const allInAmount = 100 - alreadyIn;
      pot += allInAmount;
      positions[pos].currentBet = 100;
      currentBetToMatch = 100;
    } else if (actionName === 'Raise75') {
      const potAfterCall = pot + amountToCall;
      const raiseSize = 0.75 * potAfterCall;
      const totalBet = alreadyIn + amountToCall + raiseSize;
      pot += amountToCall + raiseSize;
      positions[pos].currentBet = totalBet;
      currentBetToMatch = totalBet;
    } else if (actionName === 'Raise50') {
      const potAfterCall = pot + amountToCall;
      const raiseSize = 0.50 * potAfterCall;
      const totalBet = alreadyIn + amountToCall + raiseSize;
      pot += amountToCall + raiseSize;
      positions[pos].currentBet = totalBet;
      currentBetToMatch = totalBet;
    } else if (actionName === 'Raise33') {
      const potAfterCall = pot + amountToCall;
      const raiseSize = 0.33 * potAfterCall;
      const totalBet = alreadyIn + amountToCall + raiseSize;
      pot += amountToCall + raiseSize;
      positions[pos].currentBet = totalBet;
      currentBetToMatch = totalBet;
    }
  }

  return { positions, pot };
}
