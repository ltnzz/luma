import dotenv from 'dotenv';
import path from 'path';

// Load .env from apps/api directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface AppEnv {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  CORS_ORIGINS: string[];
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

function getCorsOrigins(): string[] {
  const configured = process.env.CORS_ORIGINS;
  if (configured) {
    return configured
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean);
  }

  return nodeEnv === 'development'
    ? ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174']
    : [];
}

if (nodeEnv === 'production' && !rawDatabaseUrl) {
  console.warn('[Environment] WARNING: DATABASE_URL is not defined in production environment.');
}

export const env: AppEnv = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: nodeEnv,
  DATABASE_URL: rawDatabaseUrl || 'postgres://postgres:password@localhost:5432/luma',
  CORS_ORIGINS: getCorsOrigins(),
};
