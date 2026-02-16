import { Router } from 'express';
import { getRootNodes, getChildNodes, getAvailableActions } from '../db/queries';

export const treeRouter = Router();

/**
 * GET /api/tree/:simId
 * Get the root nodes of the game tree.
 */
treeRouter.get('/:simId', async (req, res) => {
  try {
    const simId = parseInt(req.params.simId);
    const nodes = await getRootNodes(simId);
    res.json(nodes);
  } catch (err) {
    console.error('Error fetching tree:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tree/:simId/children?parent=filename
 * Get child nodes of a given node.
 */
treeRouter.get('/:simId/children', async (req, res) => {
  try {
    const simId = parseInt(req.params.simId);
    const parent = req.query.parent as string;

    if (!parent) {
      return res.status(400).json({ error: 'parent query param required' });
    }

    const children = await getChildNodes(simId, parent);
    res.json(children);
  } catch (err) {
    console.error('Error fetching children:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tree/:simId/actions?prefix=actionPrefix
 * Get available actions at a decision point.
 */
treeRouter.get('/:simId/actions', async (req, res) => {
  try {
    const simId = parseInt(req.params.simId);
    const prefix = (req.query.prefix as string) || '';

    const actions = await getAvailableActions(simId, prefix);
    res.json(actions);
  } catch (err) {
    console.error('Error fetching actions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
