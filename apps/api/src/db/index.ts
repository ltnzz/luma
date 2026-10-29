import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';
import * as schema from './schema';

const isRemoteOrProd =
  env.NODE_ENV === 'production' ||
  env.DATABASE_URL.includes('supabase') ||
  env.DATABASE_URL.includes('pooler') ||
  env.DATABASE_URL.includes('sslmode=require');

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: isRemoteOrProd ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
}
