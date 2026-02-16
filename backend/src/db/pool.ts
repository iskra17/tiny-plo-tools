import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/plo_solver',
});

export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}
