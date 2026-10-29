import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const DATASET_DIR = path.resolve(__dirname, '../../dataset');

async function readJsonFile<T = unknown>(relativePath: string): Promise<T | null> {
  try {
    const fullPath = path.join(DATASET_DIR, relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

interface CatalogItem {
  category: string;
  title: string;
  description: string;
  record_count: number;
  source: string;
  formats: string[];
}

interface AirSector {
  total_records: number;
  rivers: unknown[];
  parameters: unknown[];
  trend_sample: Array<{
    periode: string;
    avg_bod: number;
    avg_cod: number;
    avg_do: number;
    avg_ph: number;
  }>;
}

interface SekolahSector {
  total_sekolah: number;
  total_siswa: number;
  total_guru: number;
  rasio_siswa_guru_dki: number;
  by_jenjang: Record<string, number>;
  by_status: Record<string, number>;
  jenjang_status_breakdown: Record<string, Record<string, number>>;
  by_wilayah: unknown[];
  akreditasi: Record<string, number>;
}

interface TransumSector {
  total_halte: number;
  cakupan: Array<{
    periode: string;
    populasi_terlayani_pct: number;
    luas_area_terlayani_pct: number;
  }>;
  halte_per_koridor: Record<string, number>;
  tipe_akses: Record<string, number>;
}

interface RthSector {
  total_rth: number;
  by_wilayah: Record<string, number>;
  by_jenis: Record<string, number>;
  by_periode: Record<string, number>;
  top_kecamatan: Record<string, number>;
}

interface UdaraSector {
  spku_locations: Array<{
    station: string;
    avg_ispu: number;
    kategori: string;
    critical_param: string;
  }>;
  category_distribution: Record<string, number>;
  monthly_trend: unknown[];
}

interface KesehatanSector {
  facility_types: Record<string, number>;
  by_wilayah: Record<string, number>;
}

interface VisualizationData {
  generated_at: string;
  catalog: CatalogItem[];
  air: AirSector;
  rth: RthSector;
  transum: TransumSector;
  udara: UdaraSector;
  kesehatan: KesehatanSector;
  sekolah: SekolahSector;
}

/**
 * GET /api/v1/visualizations/overview
 * Metrik global overview dan distribusi volume dataset lintas sektor untuk tab Overview di dashboard
 */
router.get('/api/v1/visualizations/overview', async (_req: Request, res: Response) => {
  const data = await readJsonFile<VisualizationData>('visualization_data.json');
  if (!data) {
    res.status(404).json({
      status: 'error',
      message: 'Visualization data not found',
    });
    return;
  }

  const latestTransit = data.transum.cakupan[data.transum.cakupan.length - 1] ?? {
    populasi_terlayani_pct: 92.4,
    luas_area_terlayani_pct: 86.4,
  };

  const volumeDistribution = data.catalog.map((c) => ({
    category: c.category.toUpperCase(),
    title: c.title,
    count: c.record_count,
  }));

  const schoolJenjangEntries = Object.entries(data.sekolah.by_jenjang).slice(0, 5);
  const schoolPie = {
    labels: schoolJenjangEntries.map(([k]) => k),
    series: schoolJenjangEntries.map(([, v]) => v),
  };

  const kpis = {
    sekolah: {
      total: data.sekolah.total_sekolah,
      siswa: data.sekolah.total_siswa,
      guru: data.sekolah.total_guru,
      rasio: data.sekolah.rasio_siswa_guru_dki,
    },
    air: {
      totalRecords: data.air.total_records,
      totalSungai: data.air.rivers.length,
    },
    rth: {
      totalRth: data.rth.total_rth,
    },
    transum: {
      totalHalte: data.transum.total_halte,
      populasiTerlayaniPct: latestTransit.populasi_terlayani_pct,
      luasAreaTerlayaniPct: latestTransit.luas_area_terlayani_pct,
    },
    udara: {
      stasiunCount: data.udara.spku_locations.length,
    },
  };

  const overview = {
    kpis,
    charts: {
      volumeDistribution,
      schoolPie,
      airTrend: data.air.trend_sample,
      transitTarget: {
        populasiTerlayaniPct: latestTransit.populasi_terlayani_pct,
        luasAreaTerlayaniPct: latestTransit.luas_area_terlayani_pct,
      },
    },
  };

  res.status(200).json({
    status: 'success',
    data: {
      generatedAt: data.generated_at,
      overview,
      kpis,
      charts: overview.charts,
    },
  });
});

/**
 * GET /api/v1/visualizations/catalog
 * Daftar paket katalog dataset normalisasi DKI Jakarta
 */
router.get('/api/v1/visualizations/catalog', async (_req: Request, res: Response) => {
  const data = await readJsonFile<VisualizationData>('visualization_data.json');
  if (!data) {
    res.status(404).json({
      status: 'error',
      message: 'Catalog data not found',
    });
    return;
  }

  res.status(200).json({
    status: 'success',
    data: data.catalog,
  });
});

/**
 * GET /api/v1/visualizations/sectors/:sector
 * Detail statistik dan chart analitik untuk sektor spesifik (air, rth, sekolah, transum, udara, kesehatan)
 */
router.get('/api/v1/visualizations/sectors/:sector', async (req: Request, res: Response) => {
  const { sector } = req.params;
  const normalizedSector = sector.toLowerCase();

  const supportedSectors = ['air', 'rth', 'sekolah', 'transum', 'udara', 'kesehatan'];
  if (!supportedSectors.includes(normalizedSector)) {
    res.status(400).json({
      status: 'error',
      message: `Invalid sector '${sector}'. Supported sectors: ${supportedSectors.join(', ')}`,
    });
    return;
  }

  const data = await readJsonFile<VisualizationData>('visualization_data.json');
  if (!data || !data[normalizedSector as keyof VisualizationData]) {
    res.status(404).json({
      status: 'error',
      message: `Analytics data for sector '${sector}' not found`,
    });
    return;
  }

  res.status(200).json({
    status: 'success',
    sector: normalizedSector,
    data: data[normalizedSector as keyof VisualizationData],
  });
});

export default router;
