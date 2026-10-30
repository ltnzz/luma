import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

// Static imports guarantee that bundlers and Vercel Node File Trace (@vercel/nft)
// package these essential datasets into the serverless deployment artifact, preventing 404 ENOENT.
import visualizationDataJson from '../../dataset/visualization_data.json';
import mergedDkiJson from '../../dataset/merged_dki_by_wilayah.json';
import kotaterbacaPayloadJson from '../../dataset/kotaterbaca_payload.json';
import summaryAirJson from '../../dataset/air/summary_air_by_river.json';
import summaryRthJson from '../../dataset/rth/summary_rth.json';
import summarySekolahJson from '../../dataset/sekolah/summary_sekolah.json';
import summaryTransumJson from '../../dataset/transum/summary_transum.json';

const STATIC_DATASETS: Record<string, unknown> = {
  'visualization_data.json': visualizationDataJson,
  'merged_dki_by_wilayah.json': mergedDkiJson,
  'kotaterbaca_payload.json': kotaterbacaPayloadJson,
  'air/summary_air_by_river.json': summaryAirJson,
  'rth/summary_rth.json': summaryRthJson,
  'sekolah/summary_sekolah.json': summarySekolahJson,
  'transum/summary_transum.json': summaryTransumJson,
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

  // Fallback to static datasets if present
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
    // Also try candidate dirs individually if resolveDatasetDir didn't find the specific relativePath
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
