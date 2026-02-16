import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { simulationsRouter } from './routes/simulations';
import { treeRouter } from './routes/tree';
import { strategyRouter } from './routes/strategy';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/simulations', simulationsRouter);
app.use('/api/tree', treeRouter);
app.use('/api/strategy', strategyRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
