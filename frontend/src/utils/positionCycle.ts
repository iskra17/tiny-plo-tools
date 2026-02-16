import { POSITIONS_6MAX, ACTION_MAP } from '../constants/poker';

export interface ActionStep {
  index: number;
  position: string;
  code: string;
  action: string;
}

export interface PositionStatus {
  folded: boolean;
  isAllIn: boolean;
}

const RAISE_CODES = new Set(['2', '3', '40100', '40075', '40050', '40033']);

/**
 * Monker solver tree structure:
 * - Index 0-5: fixed UTG→BB order (first orbit)
 * - Index 6+: only active (non-folded, non-allin) players cycle,
 *   starting from the player after the last raiser
 *
 * The tree SKIPS folded/allin players entirely.
 * No "pass-through" nodes exist for them.
 */

/**
 * Compute the full action history with correct position mapping.
 */
export function computeActionSteps(codes: string[]): ActionStep[] {
  const steps: ActionStep[] = [];
  const folded = new Set<string>();
  const allIn = new Set<string>();
  let lastRaiserPosIdx = -1;

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    const action = ACTION_MAP[code] || `Unknown(${code})`;
    let position: string;

    if (i < 6) {
      position = POSITIONS_6MAX[i];
    } else {
      position = getActivePositionAt(i, codes, folded, allIn, lastRaiserPosIdx);
    }

    steps.push({ index: i, position, code, action });

    if (code === '0') folded.add(position);
    else if (code === '3') allIn.add(position);

    if (RAISE_CODES.has(code)) {
      lastRaiserPosIdx = POSITIONS_6MAX.indexOf(position as typeof POSITIONS_6MAX[number]);
    }
  }

  return steps;
}

/**
 * Get the active position at a given step index >= 6.
 * Walks through steps 6+ assigning positions from the active player cycle.
 */
function getActivePositionAt(
  targetIndex: number,
  codes: string[],
  _folded: Set<string>,
  _allIn: Set<string>,
  _lastRaiserPosIdx: number,
): string {
  // Rebuild state from scratch for consistency
  let lastRaiserPosIdx = -1;
  const folded = new Set<string>();
  const allIn = new Set<string>();

  for (let i = 0; i < Math.min(codes.length, 6); i++) {
    const pos = POSITIONS_6MAX[i];
    if (codes[i] === '0') folded.add(pos);
    else if (codes[i] === '3') allIn.add(pos);
    if (RAISE_CODES.has(codes[i])) lastRaiserPosIdx = i;
  }

  let activeOrder = getActiveCycleAfterRaiser(lastRaiserPosIdx, folded, allIn);
  if (activeOrder.length === 0) return '';

  let cycleIdx = 0;

  for (let step = 6; step <= targetIndex; step++) {
    if (step < targetIndex) {
      const pos = activeOrder[cycleIdx % activeOrder.length];
      const code = codes[step];

      if (code === '0') folded.add(pos);
      else if (code === '3') allIn.add(pos);

      if (RAISE_CODES.has(code)) {
        const newRaiserIdx = POSITIONS_6MAX.indexOf(pos as typeof POSITIONS_6MAX[number]);
        activeOrder = getActiveCycleAfterRaiser(newRaiserIdx, folded, allIn);
        cycleIdx = 0;
      } else {
        cycleIdx++;
      }
    } else {
      return activeOrder[cycleIdx % activeOrder.length] || '';
    }
  }

  return '';
}

/**
 * Get active players in order starting from after the last raiser.
 * Excludes folded, all-in, and the raiser themselves.
 */
function getActiveCycleAfterRaiser(
  lastRaiserPosIdx: number,
  folded: Set<string>,
  allIn: Set<string>,
): string[] {
  const result: string[] = [];
  const startIdx = (lastRaiserPosIdx + 1) % 6;

  for (let offset = 0; offset < 6; offset++) {
    const posIdx = (startIdx + offset) % 6;
    const pos = POSITIONS_6MAX[posIdx];
    if (!folded.has(pos) && !allIn.has(pos) && posIdx !== lastRaiserPosIdx) {
      result.push(pos);
    }
  }

  return result;
}

/**
 * Determine the next position to act, or null if terminal.
 */
export function getNextPosition(codes: string[]): string | null {
  if (codes.length === 0) return POSITIONS_6MAX[0];

  const steps = computeActionSteps(codes);
  const folded = new Set<string>();
  const allIn = new Set<string>();
  let lastRaiserPosIdx = -1;
  let lastRaiseStepIdx = -1;

  for (const step of steps) {
    if (step.code === '0') folded.add(step.position);
    else if (step.code === '3') allIn.add(step.position);
    if (RAISE_CODES.has(step.code)) {
      lastRaiserPosIdx = POSITIONS_6MAX.indexOf(step.position as typeof POSITIONS_6MAX[number]);
      lastRaiseStepIdx = step.index;
    }
  }

  const activePlayers = POSITIONS_6MAX.filter(p => !folded.has(p) && !allIn.has(p));
  if (activePlayers.length <= 1) return null;
  if (codes.length < 6) return POSITIONS_6MAX[codes.length];

  const activeAfterRaiser = getActiveCycleAfterRaiser(lastRaiserPosIdx, folded, allIn);
  if (activeAfterRaiser.length === 0) return null;

  // Count how many active players have acted since the last raise
  let actedSinceRaise = 0;
  for (let i = lastRaiseStepIdx + 1; i < steps.length; i++) {
    if ((activePlayers as readonly string[]).includes(steps[i].position)) {
      actedSinceRaise++;
    }
  }

  if (actedSinceRaise >= activeAfterRaiser.length) return null;
  return activeAfterRaiser[actedSinceRaise] || null;
}

/**
 * Get the fold/allIn status of each position from the action history.
 */
export function getPositionStatuses(codes: string[]): Record<string, PositionStatus> {
  const statuses: Record<string, PositionStatus> = {};
  for (const pos of POSITIONS_6MAX) {
    statuses[pos] = { folded: false, isAllIn: false };
  }

  const steps = computeActionSteps(codes);
  for (const step of steps) {
    if (step.code === '0') statuses[step.position].folded = true;
    else if (step.code === '3') statuses[step.position].isAllIn = true;
  }

  return statuses;
}
