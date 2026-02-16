import { pool } from '../src/db/pool';

async function initDb() {
  console.log('Initializing database schema...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS simulations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      num_players INTEGER NOT NULL,
      stack_bb INTEGER NOT NULL,
      game_type TEXT DEFAULT 'PLO'
    );

    CREATE TABLE IF NOT EXISTS tree_nodes (
      id SERIAL PRIMARY KEY,
      sim_id INTEGER REFERENCES simulations(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      action_sequence TEXT NOT NULL,
      acting_position TEXT NOT NULL,
      depth INTEGER NOT NULL DEFAULT 0,
      UNIQUE(sim_id, filename)
    );

    CREATE TABLE IF NOT EXISTS hand_strategies (
      id SERIAL PRIMARY KEY,
      node_id INTEGER REFERENCES tree_nodes(id) ON DELETE CASCADE,
      hand TEXT NOT NULL,
      frequency REAL NOT NULL,
      ev REAL NOT NULL,
      UNIQUE(node_id, hand)
    );

    CREATE INDEX IF NOT EXISTS idx_strategies_node ON hand_strategies(node_id);
    CREATE INDEX IF NOT EXISTS idx_strategies_hand ON hand_strategies(hand);
    CREATE INDEX IF NOT EXISTS idx_nodes_sim ON tree_nodes(sim_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_filename ON tree_nodes(filename);
  `);

  console.log('Database schema initialized successfully.');
  await pool.end();
}

initDb().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
