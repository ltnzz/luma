import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

// Bundled datasets: Compiled directly into TypeScript/JavaScript
// so Vercel Serverless Function has 100% in-memory access with ZERO external file dependencies.
import {
  visualizationData,
  mergedDkiByWilayah,
  kotaterbacaPayload,
  summaryAir,
  summaryRth,
  summarySekolah,
  summaryTransum,
} from '../data/datasets';

const STATIC_DATASETS: Record<string, unknown> = {
  'visualization_data.json': visualizationData,
  'merged_dki_by_wilayah.json': mergedDkiByWilayah,
  'kotaterbaca_payload.json': kotaterbacaPayload,
  'air/summary_air_by_river.json': summaryAir,
  'rth/summary_rth.json': summaryRth,
  'sekolah/summary_sekolah.json': summarySekolah,
  'transum/summary_transum.json': summaryTransum,
};

const CANDIDATE_DIRS = [
  path.resolve(__dirname, '../../dataset'),
  path.resolve(process.cwd(), 'apps/api/dataset'),
  path.resolve(process.cwd(), 'dataset'),
  path.resolve(__dirname, '../dataset'),
];

function resolveDatasetDir(): string {
  for (const dir of CANDIDATE_DIRS) {
    if (fsSync.existsSync(dir)) {
      return dir;
    }
  }
  return CANDIDATE_DIRS[0];
}

const cache = new Map<string, unknown>();

// Preload static datasets into cache
for (const [key, val] of Object.entries(STATIC_DATASETS)) {
  cache.set(key, val);
}

export async function readJsonDatasetCached<T = unknown>(relativePath: string): Promise<T | null> {
  if (cache.has(relativePath)) {
    return cache.get(relativePath) as T;
  }

  if (STATIC_DATASETS[relativePath]) {
    cache.set(relativePath, STATIC_DATASETS[relativePath]);
    return STATIC_DATASETS[relativePath] as T;
  }

  const datasetDir = resolveDatasetDir();
  try {
    const fullPath = path.join(datasetDir, relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const parsed = JSON.parse(content) as T;
    cache.set(relativePath, parsed);
    return parsed;
  } catch {
    for (const candidate of CANDIDATE_DIRS) {
      try {
        const fullPath = path.join(candidate, relativePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const parsed = JSON.parse(content) as T;
        cache.set(relativePath, parsed);
        return parsed;
      } catch {
        // try next candidate
      }
    }
    return null;
  }
}

export function clearDatasetCache(): void {
  cache.clear();
  for (const [key, val] of Object.entries(STATIC_DATASETS)) {
    cache.set(key, val);
  }
}
