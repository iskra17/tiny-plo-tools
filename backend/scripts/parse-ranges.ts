import * as fs from 'fs';
import * as path from 'path';
import { pool } from '../src/db/pool';
import { decodeActionSequence, parseActionCodes } from '../src/utils/hand';

const BATCH_SIZE = 500;

interface HandEntry {
  hand: string;
  frequency: number;
  ev: number;
}

/**
 * Parse a single .rng file into hand entries.
 */
function parseRngFile(filePath: string): HandEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Handle both Windows (\r\n) and Unix (\n) line endings
  const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
  const entries: HandEntry[] = [];

  for (let i = 0; i < lines.length - 1; i += 2) {
    const hand = lines[i].trim();
    const dataLine = lines[i + 1].trim();

    let frequency: number;
    let ev: number;

    // Handle two formats:
    // 1. "frequency;ev" (e.g., "0.85;-120.5")
    // 2. "frequency" only (e.g., "0.0")
    if (dataLine.includes(';')) {
      const [freqStr, evStr] = dataLine.split(';');
      frequency = parseFloat(freqStr);
      ev = parseFloat(evStr);
    } else {
      frequency = parseFloat(dataLine);
      ev = 0; // Default EV to 0 if not provided
    }

    if (isNaN(frequency)) {
      console.warn(`Skipping invalid data at line ${i + 2} in ${filePath}: ${dataLine}`);
      continue;
    }

    entries.push({ hand, frequency, ev: isNaN(ev) ? 0 : ev });
  }

  return entries;
}

/**
 * Insert hand entries in batches using COPY-like bulk insert.
 */
async function insertHandsBatch(nodeId: number, entries: HandEntry[]) {
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    const values: unknown[] = [];
    const placeholders: string[] = [];

    batch.forEach((entry, idx) => {
      const offset = idx * 4;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
      values.push(nodeId, entry.hand, entry.frequency, entry.ev);
    });

    await pool.query(
      `INSERT INTO hand_strategies (node_id, hand, frequency, ev)
       VALUES ${placeholders.join(', ')}
       ON CONFLICT (node_id, hand) DO UPDATE SET frequency = EXCLUDED.frequency, ev = EXCLUDED.ev`,
      values
    );
  }
}

async function main() {
  const args = process.argv.slice(2);
  const rangesDir = args[0] || path.resolve(__dirname, '../../6max 50z preflop rng/100bb');
  const simName = args[1] || '6max 50z 100bb';
  const numPlayers = 6;
  const stackBb = 100;

  if (!fs.existsSync(rangesDir)) {
    console.error(`Ranges directory not found: ${rangesDir}`);
    process.exit(1);
  }

  console.log(`Parsing .rng files from: ${rangesDir}`);
  console.log(`Simulation: ${simName}`);

  // Create or get simulation
  const simResult = await pool.query(
    `INSERT INTO simulations (name, num_players, stack_bb, game_type)
     VALUES ($1, $2, $3, 'PLO')
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [simName, numPlayers, stackBb]
  );

  let simId: number;
  if (simResult.rows.length > 0) {
    simId = simResult.rows[0].id;
  } else {
    const existing = await pool.query(
      'SELECT id FROM simulations WHERE name = $1',
      [simName]
    );
    simId = existing.rows[0].id;
  }
  console.log(`Simulation ID: ${simId}`);

  // Find all .rng files
  const files = fs.readdirSync(rangesDir).filter(f => f.endsWith('.rng'));
  console.log(`Found ${files.length} .rng files`);

  let processed = 0;
  const startTime = Date.now();

  for (const file of files) {
    const filePath = path.join(rangesDir, file);
    const baseName = file.replace(/\.rng$/, '');
    const codes = parseActionCodes(baseName);
    const decoded = decodeActionSequence(file);

    // Insert tree node
    const nodeResult = await pool.query(
      `INSERT INTO tree_nodes (sim_id, filename, action_sequence, acting_position, depth)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (sim_id, filename) DO UPDATE SET action_sequence = EXCLUDED.action_sequence
       RETURNING id`,
      [simId, file, decoded.humanReadable, decoded.actingPosition, codes.length]
    );
    const nodeId = nodeResult.rows[0].id;

    // Parse and insert hands
    const entries = parseRngFile(filePath);
    await insertHandsBatch(nodeId, entries);

    processed++;
    if (processed % 100 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (processed / parseFloat(elapsed)).toFixed(1);
      console.log(`  Processed ${processed}/${files.length} files (${rate} files/sec)`);
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! Processed ${processed} files in ${totalElapsed}s`);

  await pool.end();
}

main().catch((err) => {
  console.error('Parse failed:', err);
  process.exit(1);
});
