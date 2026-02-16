import { Router } from 'express';
import { getSimulations, getSimulation } from '../db/queries';

export const simulationsRouter = Router();

simulationsRouter.get('/', async (_req, res) => {
  try {
    const sims = await getSimulations();
    res.json(sims);
  } catch (err) {
    console.error('Error fetching simulations:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

simulationsRouter.get('/:id', async (req, res) => {
  try {
    const sim = await getSimulation(parseInt(req.params.id));
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });
    res.json(sim);
  } catch (err) {
    console.error('Error fetching simulation:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
