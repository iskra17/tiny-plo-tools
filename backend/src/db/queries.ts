import { query } from './pool';


export async function getSimulations() {
  const result = await query('SELECT * FROM simulations ORDER BY id');
  return result.rows;
}

export async function getSimulation(id: number) {
  const result = await query('SELECT * FROM simulations WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Get all tree nodes for a simulation, organized for tree navigation.
 */
export async function getTreeNodes(simId: number) {
  const result = await query(
    `SELECT id, filename, action_sequence, acting_position, depth
     FROM tree_nodes
     WHERE sim_id = $1
     ORDER BY depth, filename`,
    [simId]
  );
  return result.rows;
}

/**
 * Get children nodes of a given node (nodes whose filename starts with this node's base).
 */
export async function getChildNodes(simId: number, parentFilename: string) {
  const parentBase = parentFilename.replace(/\.rng$/, '');
  const result = await query(
    `SELECT id, filename, action_sequence, acting_position, depth
     FROM tree_nodes
     WHERE sim_id = $1
       AND filename LIKE $2
       AND depth = (SELECT depth FROM tree_nodes WHERE sim_id = $1 AND filename = $3) + 1`,
    [simId, `${parentBase}.%.rng`, parentFilename]
  );
  return result.rows;
}

/**
 * Get root-level nodes (depth = the minimum depth for this simulation).
 */
export async function getRootNodes(simId: number) {
  const result = await query(
    `SELECT id, filename, action_sequence, acting_position, depth
     FROM tree_nodes
     WHERE sim_id = $1
       AND depth = (SELECT MIN(depth) FROM tree_nodes WHERE sim_id = $1)
     ORDER BY filename`,
    [simId]
  );
  return result.rows;
}

/**
 * Get strategy for a specific hand at a specific game tree point.
 * Returns all actions available at that point with their frequencies and EVs.
 *
 * @param simId Simulation ID
 * @param hand Monker hand notation (e.g., "(AK)Q2")
 * @param actionPrefix The action sequence prefix (e.g., "0.0.0.0" for UTG after 4 folds)
 */
export async function getStrategy(simId: number, hand: string, actionPrefix: string) {
  // For strategy, we need to find the actual tree nodes at the correct depth.
  // Each .rng file at depth N contains the frequency for that specific action.
  // If a node doesn't exist at the expected depth (e.g., no "40100.rng" but "40100.0.0.rng" exists),
  // we derive the frequency: raise_freq = 1 - sum(other_action_freqs).
  const expectedDepth = actionPrefix ? actionPrefix.split('.').length + 1 : 1;
  const pattern = actionPrefix ? `${actionPrefix}.%.rng` : '%.rng';
  const codePosition = actionPrefix ? actionPrefix.split('.').length + 1 : 1;

  // First: get data from nodes that DO exist at the exact depth
  const directResult = await query(
    `SELECT tn.filename, tn.action_sequence, tn.acting_position,
            split_part(replace(tn.filename, '.rng', ''), '.', $4) AS next_code,
            hs.frequency, hs.ev
     FROM tree_nodes tn
     JOIN hand_strategies hs ON hs.node_id = tn.id
     WHERE tn.sim_id = $1
       AND tn.filename LIKE $2
       AND tn.depth = $4
       AND hs.hand = $3`,
    [simId, pattern, hand, expectedDepth]
  );

  // Find all distinct action codes that exist in the tree
  const allCodesResult = await query(
    `SELECT DISTINCT split_part(replace(filename, '.rng', ''), '.', $2) AS next_code
     FROM tree_nodes
     WHERE sim_id = $1
       AND filename LIKE $3
       AND split_part(replace(filename, '.rng', ''), '.', $2) != ''`,
    [simId, codePosition, pattern]
  );

  const directCodes = new Set(directResult.rows.map((r: { next_code: string }) => r.next_code));
  const allCodes = allCodesResult.rows.map((r: { next_code: string }) => r.next_code);
  const missingCodes = allCodes.filter((c: string) => !directCodes.has(c));

  // For missing codes, derive frequency = 1 - sum(existing frequencies)
  const rows = [...directResult.rows];

  if (missingCodes.length > 0 && directResult.rows.length > 0) {
    const existingFreqSum = directResult.rows.reduce((sum: number, r: { frequency: number }) => sum + r.frequency, 0);
    const remainingFreq = Math.max(0, 1 - existingFreqSum);
    const perMissing = missingCodes.length > 0 ? remainingFreq / missingCodes.length : 0;

    for (const code of missingCodes) {
      rows.push({
        filename: `${actionPrefix ? actionPrefix + '.' : ''}${code}.rng`,
        action_sequence: '',
        acting_position: '',
        next_code: code,
        frequency: perMissing,
        ev: 0,
      });
    }
  }

  return rows;
}

/**
 * Get the full range for a specific tree node.
 * Returns all hands with their frequencies and EVs.
 */
export async function getRange(nodeId: number, minFrequency: number = 0) {
  const result = await query(
    `SELECT hand, frequency, ev
     FROM hand_strategies
     WHERE node_id = $1
       AND frequency >= $2
     ORDER BY frequency DESC, hand`,
    [nodeId, minFrequency]
  );
  return result.rows;
}

/**
 * Find a tree node by filename.
 */
export async function getNodeByFilename(simId: number, filename: string) {
  const result = await query(
    `SELECT id, filename, action_sequence, acting_position, depth
     FROM tree_nodes
     WHERE sim_id = $1 AND filename = $2`,
    [simId, filename]
  );
  return result.rows[0] || null;
}

/**
 * Get available actions at a decision point.
 * Given an action prefix (what has happened so far), returns the possible next actions.
 *
 * This extracts distinct next action codes from all filenames that start with the prefix,
 * even if the exact depth-level file doesn't exist (e.g., "40100.rng" may not exist
 * but "40100.0.0.rng" does, meaning Raise100 is a valid UTG action).
 */
export async function getAvailableActions(simId: number, actionPrefix: string) {
  const codePosition = actionPrefix ? actionPrefix.split('.').length + 1 : 1;
  const pattern = actionPrefix ? `${actionPrefix}.%.rng` : '%.rng';

  // Get directly existing nodes
  const result = await query(
    `WITH candidates AS (
       SELECT *,
              split_part(replace(filename, '.rng', ''), '.', $2) AS next_code
       FROM tree_nodes
       WHERE sim_id = $1
         AND filename LIKE $3
     ),
     ranked AS (
       SELECT *,
              ROW_NUMBER() OVER (PARTITION BY next_code ORDER BY depth) AS rn
       FROM candidates
       WHERE next_code != '' AND next_code IS NOT NULL
     )
     SELECT filename, action_sequence, acting_position, next_code, depth
     FROM ranked
     WHERE rn = 1
     ORDER BY next_code`,
    [simId, codePosition, pattern]
  );

  return result.rows;
}
