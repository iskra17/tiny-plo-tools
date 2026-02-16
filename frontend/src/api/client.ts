const BASE_URL = '/api';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface Simulation {
  id: number;
  name: string;
  num_players: number;
  stack_bb: number;
  game_type: string;
}

export interface TreeNode {
  id: number;
  filename: string;
  action_sequence: string;
  acting_position: string;
  depth: number;
  next_code?: string;
}

export interface StrategyAction {
  action: string;
  actionCode: string;
  frequency: number;
  ev: number;
  filename: string;
}

export interface StrategyResponse {
  hand: string;
  actionPrefix: string;
  actions: StrategyAction[];
}

export interface RangeHand {
  hand: string;
  frequency: number;
  ev: number;
}

export interface RangeResponse {
  node: { filename: string; actionSequence: string; actingPosition: string };
  hands: RangeHand[];
  totalHands: number;
}

export const api = {
  getSimulations: () => fetchJson<Simulation[]>('/simulations'),

  getSimulation: (id: number) => fetchJson<Simulation>(`/simulations/${id}`),

  getRootNodes: (simId: number) => fetchJson<TreeNode[]>(`/tree/${simId}`),

  getChildNodes: (simId: number, parent: string) =>
    fetchJson<TreeNode[]>(`/tree/${simId}/children?parent=${encodeURIComponent(parent)}`),

  getAvailableActions: (simId: number, prefix: string) =>
    fetchJson<TreeNode[]>(`/tree/${simId}/actions?prefix=${encodeURIComponent(prefix)}`),

  getStrategy: (simId: number, hand: string, actionPrefix: string) =>
    fetchJson<StrategyResponse>(
      `/strategy?simId=${simId}&hand=${encodeURIComponent(hand)}&actionPrefix=${encodeURIComponent(actionPrefix)}`
    ),

  getRange: (simId: number, filename: string, minFreq = 0) =>
    fetchJson<RangeResponse>(
      `/strategy/range?simId=${simId}&filename=${encodeURIComponent(filename)}&minFreq=${minFreq}`
    ),
};
