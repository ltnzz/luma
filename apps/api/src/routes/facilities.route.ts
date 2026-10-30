import { Router, Request, Response } from 'express';
import { db } from '../db';
import { facilities } from '../db/schema';
import { eq, ilike, and, sql } from 'drizzle-orm';
import { kotaterbacaPayload } from '../data/datasets';
import crypto from 'crypto';

const router = Router();

function slugToUuid(slug: string): string {
  const hash = crypto.createHash('sha256').update(`luma:facility:${slug}`).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    'a' + hash.substring(17, 20),
    hash.substring(20, 32),
  ].join('-');
}

interface FallbackFacility {
  id: string;
  slug: string;
  name: string;
  category: string;
  sub_category: string;
  wilayah: string;
  kecamatan?: string;
  address?: string;
  lat: number;
  lng: number;
  specs?: Record<string, string>;
  budget?: Record<string, string>;
  metrics?: Record<string, unknown>;
  docs?: Array<{ title: string; size: string; dept: string; file_url?: string }>;
}

async function getFallbackFacilities(): Promise<FallbackFacility[]> {
  try {
    const data = kotaterbacaPayload as {
      facilities?: Array<Omit<FallbackFacility, 'slug'> & { id: string }>;
    };
    return (data?.facilities || []).map((f) => ({
      ...f,
      id: slugToUuid(f.id),
      slug: f.id,
    }));
  } catch {
    return [];
  }
}

/**
 * GET /api/v1/facilities
 * Daftar fasilitas dengan query filter (wilayah, category, search) dan pagination
 */
router.get('/api/v1/facilities', async (req: Request, res: Response) => {
  const { wilayah, category, search } = req.query;
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || '10'), 10) || 10));
  const offset = (page - 1) * limit;

  try {
    // 1. Coba query dari PostgreSQL via Drizzle ORM
    const conditions = [];

    if (typeof wilayah === 'string' && wilayah.trim() !== '' && wilayah.toUpperCase() !== 'ALL') {
      conditions.push(ilike(facilities.wilayah, `%${wilayah.trim()}%`));
    }
    if (typeof category === 'string' && category.trim() !== '') {
      conditions.push(eq(facilities.category, category.trim().toLowerCase()));
    }
    if (typeof search === 'string' && search.trim() !== '') {
      conditions.push(ilike(facilities.name, `%${search.trim()}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(facilities)
      .where(whereClause);

    const total = totalResult?.count ?? 0;

    const data = await db.query.facilities.findMany({
      where: whereClause,
      limit,
      offset,
      with: {
        budget: true,
        metrics: true,
        documents: true,
        specs: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    // 2. Graceful fallback ke JSON dataset jika database belum terhubung
    const all = await getFallbackFacilities();
    let filtered = all;

    if (typeof wilayah === 'string' && wilayah.trim() !== '' && wilayah.toUpperCase() !== 'ALL') {
      filtered = filtered.filter((f) =>
        f.wilayah.toLowerCase().includes(wilayah.trim().toLowerCase())
      );
    }
    if (typeof category === 'string' && category.trim() !== '') {
      filtered = filtered.filter(
        (f) => f.category.toLowerCase() === category.trim().toLowerCase()
      );
    }
    if (typeof search === 'string' && search.trim() !== '') {
      filtered = filtered.filter((f) =>
        f.name.toLowerCase().includes(search.trim().toLowerCase())
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    res.status(200).json({
      status: 'success',
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      source: 'dataset_fallback',
    });
  }
});

/**
 * GET /api/v1/facilities/:id
 * Detail fasilitas terkurasi berdasarkan UUID (atau slug) beserta budget, metrics, docs, dan specs
 */
router.get('/api/v1/facilities/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  try {
    const facility = await db.query.facilities.findFirst({
      where: isUuid ? eq(facilities.id, id) : eq(facilities.slug, id),
      with: {
        budget: true,
        metrics: true,
        documents: true,
        specs: true,
      },
    });

    if (facility) {
      res.status(200).json({
        status: 'success',
        data: facility,
      });
      return;
    }
  } catch {
    // Fallback jika database belum running
  }

  // Fallback ke JSON jika tidak ditemukan di DB atau DB error
  const all = await getFallbackFacilities();
  const fallbackItem = all.find((f) => (isUuid ? f.id === id : f.slug === id || f.id === id));

  if (!fallbackItem) {
    res.status(404).json({
      status: 'error',
      message: `Facility with id/slug '${id}' not found`,
    });
    return;
  }

  res.status(200).json({
    status: 'success',
    data: fallbackItem,
    source: 'dataset_fallback',
  });
});

export default router;
