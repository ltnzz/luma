import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const DATASET_DIR = path.resolve(__dirname, '../../dataset');

async function readDatasetJson<T = unknown>(relativePath: string): Promise<T | null> {
  try {
    const fullPath = path.join(DATASET_DIR, relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * GET /api/v1/dataset/summary
 * Mengembalikan katalog dataset dan metrik KPI visualisasi lintas sektor
 */
router.get('/api/v1/dataset/summary', async (_req: Request, res: Response) => {
  const data = await readDatasetJson('visualization_data.json');
  if (!data) {
    res.status(404).json({
      status: 'error',
      message: 'Summary dataset not found',
    });
    return;
  }

  res.status(200).json({
    status: 'success',
    data,
  });
});

/**
 * GET /api/v1/dataset/wilayah
 * Mengembalikan data agregasi multisektoral per wilayah administrasi DKI Jakarta
 */
router.get('/api/v1/dataset/wilayah', async (_req: Request, res: Response) => {
  const data = await readDatasetJson('merged_dki_by_wilayah.json');
  if (!data) {
    res.status(404).json({
      status: 'error',
      message: 'Wilayah aggregated dataset not found',
    });
    return;
  }

  res.status(200).json({
    status: 'success',
    data,
  });
});

/**
 * GET /api/v1/dataset/indicators
 * Mengembalikan data indikator dan spasial peta interaktif Luma
 */
router.get('/api/v1/dataset/indicators', async (_req: Request, res: Response) => {
  const data = await readDatasetJson('kotaterbaca_payload.json');
  if (!data) {
    res.status(404).json({
      status: 'error',
      message: 'Indicators and spatial payload not found',
    });
    return;
  }

  res.status(200).json({
    status: 'success',
    data,
  });
});

/**
 * GET /api/v1/dataset/sectors/:sector
 * Mengembalikan data ringkasan per sektor spesifik (air, rth, sekolah, transum)
 */
router.get('/api/v1/dataset/sectors/:sector', async (req: Request, res: Response) => {
  const { sector } = req.params;

  const sectorFiles: Record<string, string> = {
    air: 'air/summary_air_by_river.json',
    rth: 'rth/summary_rth.json',
    sekolah: 'sekolah/summary_sekolah.json',
    transum: 'transum/summary_transum.json',
  };

  const targetFile = sectorFiles[sector.toLowerCase()];
  if (!targetFile) {
    res.status(400).json({
      status: 'error',
      message: `Invalid sector '${sector}'. Supported sectors: ${Object.keys(sectorFiles).join(', ')}`,
    });
    return;
  }

  const data = await readDatasetJson(targetFile);
  if (!data) {
    res.status(404).json({
      status: 'error',
      message: `Dataset for sector '${sector}' not found`,
    });
    return;
  }

  res.status(200).json({
    status: 'success',
    sector,
    data,
  });
});

export default router;
