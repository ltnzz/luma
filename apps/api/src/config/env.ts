import dotenv from 'dotenv';
import path from 'path';

// Load .env from apps/api directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface AppEnv {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
}

function getValidNodeEnv(): AppEnv['NODE_ENV'] {
  const envVal = process.env.NODE_ENV;
  if (envVal === 'production' || envVal === 'test') {
    return envVal;
  }
  return 'development';
}

const nodeEnv = getValidNodeEnv();
const rawDatabaseUrl = process.env.DATABASE_URL;

if (nodeEnv === 'production' && !rawDatabaseUrl) {
  console.warn('[Environment] WARNING: DATABASE_URL is not defined in production environment.');
}

export const env: AppEnv = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: nodeEnv,
  DATABASE_URL: rawDatabaseUrl || 'postgres://postgres:password@localhost:5432/luma',
};
