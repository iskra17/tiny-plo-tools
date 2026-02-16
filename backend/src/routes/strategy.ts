import { Router } from 'express';
import { getStrategy, getRange, getNodeByFilename } from '../db/queries';
import { standardToMonker, normalizeMonkerHand, ACTION_MAP } from '../utils/hand';

export const strategyRouter = Router();

/**
 * GET /api/strategy?simId=&hand=&actionPrefix=
 * Get the strategy (all possible actions with freq/EV) for a specific hand at a decision point.
 *
 * hand: either Monker notation or standard notation (e.g., "AhKd2s3c")
 * actionPrefix: dot-separated action codes (e.g., "0.0.0.0")
 */
strategyRouter.get('/', async (req, res) => {
  try {
    const simId = parseInt(req.query.simId as string);
    let hand = req.query.hand as string;
    const actionPrefix = (req.query.actionPrefix as string) || '';

    if (!simId || !hand) {
      return res.status(400).json({ error: 'simId and hand are required' });
    }

    // If hand looks like standard notation (contains suit letters), convert to Monker
    if (/[hdcs]/i.test(hand) && hand.length === 8) {
      try {
        hand = standardToMonker(hand);
      } catch {
        return res.status(400).json({ error: 'Invalid hand notation' });
      }
    } else {
      // Normalize Monker notation to canonical order (e.g., JJTT → TTJJ)
      hand = normalizeMonkerHand(hand);
    }

    const rows = await getStrategy(simId, hand, actionPrefix);

    // Parse each row to extract the action taken
    const result = rows.map((row: { filename: string; action_sequence: string; acting_position: string; frequency: number; ev: number; next_code?: string }) => {
      const actionCode = row.next_code || (() => {
        const base = row.filename.replace(/\.rng$/, '');
        const codes = base.split('.');
        return codes[codes.length - 1];
      })();
      const action = ACTION_MAP[actionCode] || `Unknown(${actionCode})`;

      return {
        action,
        actionCode,
        frequency: row.frequency,
        ev: row.ev,
        filename: row.filename,
      };
    });

    res.json({
      hand,
      actionPrefix,
      actions: result,
    });
  } catch (err) {
    console.error('Error fetching strategy:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/strategy/range?simId=&filename=&minFreq=0
 * Get the full range for a specific tree node.
 */
strategyRouter.get('/range', async (req, res) => {
  try {
    const simId = parseInt(req.query.simId as string);
    const filename = req.query.filename as string;
    const minFreq = parseFloat((req.query.minFreq as string) || '0');

    if (!simId || !filename) {
      return res.status(400).json({ error: 'simId and filename are required' });
    }

    const node = await getNodeByFilename(simId, filename);
    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const range = await getRange(node.id, minFreq);

    res.json({
      node: {
        filename: node.filename,
        actionSequence: node.action_sequence,
        actingPosition: node.acting_position,
      },
      hands: range,
      totalHands: range.length,
    });
  } catch (err) {
    console.error('Error fetching range:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
