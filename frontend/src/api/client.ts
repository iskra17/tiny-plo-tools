// --- Interfaces (kept identical for backward compatibility) ---

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

// --- tree.json types ---

interface TreeJsonSimulation {
  id: number;
  name: string;
  num_players: number;
  stack_bb: number;
  game_type: string;
}

interface TreeJsonNode {
  filename: string;
  action_sequence: string;
  acting_position: string;
  depth: number;
}

interface TreeData {
  simulation: TreeJsonSimulation;
  nodes: TreeJsonNode[];
}

// --- Tree cache ---

let treeCache: TreeData | null = null;

async function loadTree(): Promise<TreeData> {
  if (treeCache) return treeCache;
  const res = await fetch('/data/tree.json');
  if (!res.ok) {
    throw new Error(`Failed to load tree.json: HTTP ${res.status}`);
  }
  treeCache = await res.json();
  return treeCache!;
}

// --- .rng file fetching & parsing ---

function parseRng(text: string): RangeHand[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const hands: RangeHand[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    const hand = lines[i];
    const parts = (lines[i + 1] || '0').split(';');
    const frequency = parseFloat(parts[0]) || 0;
    const ev = parseFloat(parts[1]) || 0;
    hands.push({ hand, frequency, ev });
  }
  return hands;
}

async function fetchRngFile(filename: string): Promise<RangeHand[]> {
  const baseUrl = import.meta.env.VITE_R2_BASE_URL || '/data/rng';
  const res = await fetch(`${baseUrl}/${filename}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${filename}: HTTP ${res.status}`);
  }
  const text = await res.text();
  return parseRng(text);
}

// --- API object (same method signatures as before) ---

export const api = {
  getSimulations: async (): Promise<Simulation[]> => {
    const tree = await loadTree();
    // Wrap single simulation into array for backward compatibility
    return [tree.simulation];
  },

  getSimulation: async (id: number): Promise<Simulation> => {
    const tree = await loadTree();
    if (tree.simulation.id !== id) {
      throw new Error(`Simulation ${id} not found`);
    }
    return tree.simulation;
  },

  getRootNodes: async (_simId: number): Promise<TreeNode[]> => {
    const tree = await loadTree();
    // Root nodes = nodes with minimum depth
    const minDepth = Math.min(...tree.nodes.map((n) => n.depth));
    return tree.nodes
      .filter((n) => n.depth === minDepth)
      .map((n, i) => ({
        id: i,
        filename: n.filename,
        action_sequence: n.action_sequence,
        acting_position: n.acting_position,
        depth: n.depth,
      }));
  },

  getChildNodes: async (_simId: number, parent: string): Promise<TreeNode[]> => {
    const tree = await loadTree();
    // Children = nodes whose filename starts with parent prefix
    const parentBase = parent.replace(/\.rng$/, '');
    return tree.nodes
      .filter((n) => {
        const base = n.filename.replace(/\.rng$/, '');
        return base.startsWith(parentBase + '.') && base !== parentBase;
      })
      .map((n, i) => ({
        id: i,
        filename: n.filename,
        action_sequence: n.action_sequence,
        acting_position: n.acting_position,
        depth: n.depth,
      }));
  },

  /**
   * Replicate the SQL logic:
   * 1. Find nodes whose filename matches `{prefix}.%.rng` pattern
   * 2. Extract next_code from the filename (the segment after prefix)
   * 3. For each unique next_code, return the node with minimum depth (ROW_NUMBER PARTITION BY)
   */
  getAvailableActions: async (_simId: number, prefix: string): Promise<TreeNode[]> => {
    const tree = await loadTree();

    // Determine the code position (1-based index into the dot-split parts)
    const codePosition = prefix === '' ? 0 : prefix.split('.').length;

    // Filter nodes that match the prefix pattern
    const matchingNodes: Array<TreeJsonNode & { nextCode: string }> = [];

    for (const node of tree.nodes) {
      const base = node.filename.replace(/\.rng$/, '');
      const parts = base.split('.');

      // For root (prefix=""), match all nodes
      // For prefix="0", match nodes like "0.X..." (base starts with "0." or base === "0")
      if (prefix === '') {
        // All nodes match root; extract the first segment as next_code
        if (parts.length > codePosition) {
          matchingNodes.push({ ...node, nextCode: parts[codePosition] });
        }
      } else {
        // Node's filename base must start with prefix followed by a dot
        // e.g. prefix="0" matches "0.0", "0.1", "0.0.0" etc.
        const prefixParts = prefix.split('.');
        // Check that the first N parts of the node match the prefix parts
        let matches = true;
        if (parts.length <= prefixParts.length) {
          matches = false; // node doesn't go deeper than prefix
        } else {
          for (let i = 0; i < prefixParts.length; i++) {
            if (parts[i] !== prefixParts[i]) {
              matches = false;
              break;
            }
          }
        }

        if (matches && parts.length > codePosition) {
          matchingNodes.push({ ...node, nextCode: parts[codePosition] });
        }
      }
    }

    // Group by next_code and pick minimum depth for each (ROW_NUMBER PARTITION BY logic)
    const codeMap = new Map<string, TreeJsonNode & { nextCode: string }>();
    for (const node of matchingNodes) {
      const existing = codeMap.get(node.nextCode);
      if (!existing || node.depth < existing.depth) {
        codeMap.set(node.nextCode, node);
      }
    }

    // Convert to TreeNode[] with next_code field
    return Array.from(codeMap.values()).map((n, i) => ({
      id: i,
      filename: n.filename,
      action_sequence: n.action_sequence,
      acting_position: n.acting_position,
      depth: n.depth,
      next_code: n.nextCode,
    }));
  },

  getStrategy: async (_simId: number, _hand: string, _actionPrefix: string): Promise<StrategyResponse> => {
    // Strategy is now derived from useRangeData's handActionMap on the frontend.
    // Return empty result for backward compatibility.
    return {
      hand: _hand,
      actionPrefix: _actionPrefix,
      actions: [],
    };
  },

  getRange: async (_simId: number, filename: string, minFreq = 0): Promise<RangeResponse> => {
    const tree = await loadTree();
    const hands = await fetchRngFile(filename);

    // Find node info from tree
    const nodeInfo = tree.nodes.find((n) => n.filename === filename);

    // Apply minFreq filter
    const filtered = minFreq > 0 ? hands.filter((h) => h.frequency >= minFreq) : hands;

    return {
      node: {
        filename,
        actionSequence: nodeInfo?.action_sequence || '',
        actingPosition: nodeInfo?.acting_position || '',
      },
      hands: filtered,
      totalHands: filtered.length,
    };
  },
};
