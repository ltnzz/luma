import { Router, Request, Response } from 'express';
import { db } from '../db';
import { regionalIndicators } from '../db/schema';
import { eq, ilike } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const PAYLOAD_PATH = path.resolve(__dirname, '../../dataset/kotaterbaca_payload.json');

interface FallbackIndicator {
  label: string;
  rth_pct: string;
  rth_target: string;
  aqi_val: string;
  aqi_status: string;
  sekolah_total: string;
  sekolah_sub: string;
  faskes_total: string;
  faskes_sub: string;
  fasum_total: string;
  fasum_sub: string;
  transum_total: string;
  transum_sub: string;
}

async function getFallbackIndicators(): Promise<Record<string, FallbackIndicator>> {
  try {
    const raw = await fs.readFile(PAYLOAD_PATH, 'utf-8');
    const data = JSON.parse(raw) as { indicators: Record<string, FallbackIndicator> };
    return data.indicators || {};
  } catch {
    return {};
  }
}

/**
 * GET /api/v1/indicators
 * Mengembalikan indikator 6 sektor wilayah (ALL, JAKARTA BARAT, dsb)
 */
router.get('/api/v1/indicators', async (req: Request, res: Response) => {
  const { wilayah } = req.query;

  try {
    if (typeof wilayah === 'string' && wilayah.trim() !== '') {
      const code = wilayah.trim().toUpperCase();
      const result = await db.query.regionalIndicators.findFirst({
        where:
          code === 'ALL'
            ? eq(regionalIndicators.wilayahCode, 'ALL')
            : ilike(regionalIndicators.wilayahCode, `%${code}%`),
      });

      if (result) {
        res.status(200).json({
          status: 'success',
          data: result,
        });
        return;
      }
    } else {
      const allIndicators = await db.query.regionalIndicators.findMany();
      if (allIndicators.length > 0) {
        // Map as key-value for direct UI lookup
        const lookup = allIndicators.reduce<Record<string, (typeof allIndicators)[number]>>(
          (acc, item) => {
            acc[item.wilayahCode] = item;
            return acc;
          },
          {}
        );

        res.status(200).json({
          status: 'success',
          data: lookup,
        });
        return;
      }
    }
  } catch {
    // Fallback jika database belum running
  }

  // Fallback ke dataset JSON
  const fallback = await getFallbackIndicators();
  if (typeof wilayah === 'string' && wilayah.trim() !== '') {
    const code = wilayah.trim().toUpperCase();
    const item = fallback[code] || fallback['ALL'];
    if (!item) {
      res.status(404).json({
        status: 'error',
        message: `Indicator for wilayah '${wilayah}' not found`,
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: item,
      source: 'dataset_fallback',
    });
    return;
  }

  res.status(200).json({
    status: 'success',
    data: fallback,
    source: 'dataset_fallback',
  });
});

export default router;

