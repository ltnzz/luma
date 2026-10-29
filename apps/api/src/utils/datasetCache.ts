import fs from 'fs/promises';
import path from 'path';

const DATASET_DIR = path.resolve(__dirname, '../../dataset');
const cache = new Map<string, unknown>();

export async function readJsonDatasetCached<T = unknown>(relativePath: string): Promise<T | null> {
  if (cache.has(relativePath)) {
    return cache.get(relativePath) as T;
  }

  try {
    const fullPath = path.join(DATASET_DIR, relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const parsed = JSON.parse(content) as T;
    cache.set(relativePath, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function clearDatasetCache(): void {
  cache.clear();
}

