import { Router, Request, Response } from 'express';
import { db } from '../db';
import { facilities } from '../db/schema';
import { eq, ilike, and, sql } from 'drizzle-orm';
import { kotaterbacaPayload } from '../data/datasets';
import schoolsPayload from '../data/schools-full.json';
import { cacheControl } from '../middleware/cacheControl.middleware';
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
  level?: 'SD' | 'SMP' | 'SMA';
}

interface RawSchoolFacility {
  id: string;
  name: string;
  level: 'SD' | 'SMP' | 'SMA';
  category: string;
  subCategory: string;
  wilayah: string;
  kecamatan?: string;
  address?: string;
  lat: number;
  lng: number;
  specs?: Record<string, string>;
  budget?: Record<string, string>;
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

function getSchoolFacilities(): FallbackFacility[] {
  return (schoolsPayload as RawSchoolFacility[]).map((school) => ({
    id: slugToUuid(school.id),
    slug: school.id,
    name: school.name,
    category: 'pendidikan',
    sub_category: school.subCategory,
    wilayah: school.wilayah,
    kecamatan: school.kecamatan,
    address: school.address,
    lat: school.lat,
    lng: school.lng,
    specs: school.specs,
    budget: school.budget,
    level: school.level,
  }));
}

function filterFallbackFacilities(
  source: FallbackFacility[],
  wilayah: unknown,
  search: unknown,
): FallbackFacility[] {
  let filtered = source;
  if (typeof wilayah === 'string' && wilayah.trim() !== '' && wilayah.toUpperCase() !== 'ALL') {
    filtered = filtered.filter((facility) =>
      facility.wilayah.toLowerCase().includes(wilayah.trim().toLowerCase())
    );
  }
  if (typeof search === 'string' && search.trim() !== '') {
    filtered = filtered.filter((facility) =>
      facility.name.toLowerCase().includes(search.trim().toLowerCase())
    );
  }
  return filtered;
}

/**
 * GET /api/v1/facilities
 * Daftar fasilitas dengan query filter (wilayah, category, search) dan pagination
 */
router.get('/api/v1/facilities', async (req: Request, res: Response) => {
  const { wilayah, category, search } = req.query;
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.max(1, Math.min(250, parseInt(String(req.query.limit || '10'), 10) || 10));
  const offset = (page - 1) * limit;
  const normalizedCategory = typeof category === 'string' ? category.trim().toLowerCase() : '';

  // Dataset sekolah lengkap disimpan di backend agar frontend hanya menerima
  // data wilayah/halaman yang sedang dibutuhkan, bukan mengunduh seluruh JSON.
  if (normalizedCategory === 'pendidikan' || normalizedCategory === 'sekolah') {
    const filtered = filterFallbackFacilities(getSchoolFacilities(), wilayah, search);
    const total = filtered.length;
    res.status(200).json({
      status: 'success',
      data: filtered.slice(offset, offset + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      source: 'official_school_dataset',
    });
    return;
  }

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
    let filtered = filterFallbackFacilities(all, wilayah, search);
    if (typeof category === 'string' && category.trim() !== '') {
      filtered = filtered.filter(
        (f) => f.category.toLowerCase() === category.trim().toLowerCase()
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

interface SchoolSummaryBreakdown {
  total: number;
  sd: number;
  smp: number;
  sma: number;
}

interface FaskesSummaryBreakdown {
  total: number;
  rsud: number;
  puskesmas: number;
}

interface RthSummaryBreakdown {
  total: number;
  taman: number;
  hutan: number;
}

function getSchoolsSummary(): {
  totals: SchoolSummaryBreakdown;
  byWilayah: Record<string, SchoolSummaryBreakdown>;
} {
  const schools = schoolsPayload as RawSchoolFacility[];
  const totals: SchoolSummaryBreakdown = { total: 0, sd: 0, smp: 0, sma: 0 };
  const byWilayah: Record<string, SchoolSummaryBreakdown> = {};

  for (const s of schools) {
    const w = (s.wilayah || '').trim().toUpperCase();
    if (!byWilayah[w]) {
      byWilayah[w] = { total: 0, sd: 0, smp: 0, sma: 0 };
    }
    totals.total++;
    byWilayah[w].total++;

    const lvl = (s.level || '').toUpperCase();
    if (lvl === 'SD') {
      totals.sd++;
      byWilayah[w].sd++;
    } else if (lvl === 'SMP') {
      totals.smp++;
      byWilayah[w].smp++;
    } else if (lvl === 'SMA') {
      totals.sma++;
      byWilayah[w].sma++;
    }
  }

  return { totals, byWilayah };
}

function aggregateFacilitiesSummary(
  facilityItems: Array<{
    wilayah?: string | null;
    category?: string | null;
    subCategory?: string | null;
    name?: string | null;
  }>,
  schoolSummary: {
    totals: SchoolSummaryBreakdown;
    byWilayah: Record<string, SchoolSummaryBreakdown>;
  },
) {
  const totals = {
    kesehatan: 0,
    rth: 0,
    fasum: 0,
    sekolah: schoolSummary.totals.total,
    transum: 13,
    air: 68,
    schoolBreakdown: schoolSummary.totals,
    faskesBreakdown: { total: 0, rsud: 0, puskesmas: 0 },
    rthBreakdown: { total: 0, taman: 0, hutan: 0 },
  };

  const byWilayah: Record<
    string,
    {
      kesehatan: number;
      rth: number;
      fasum: number;
      sekolah: number;
      schoolBreakdown: SchoolSummaryBreakdown;
      faskesBreakdown: FaskesSummaryBreakdown;
      rthBreakdown: RthSummaryBreakdown;
    }
  > = {};

  for (const w of Object.keys(schoolSummary.byWilayah)) {
    byWilayah[w] = {
      kesehatan: 0,
      rth: 0,
      fasum: 0,
      sekolah: schoolSummary.byWilayah[w]?.total ?? 0,
      schoolBreakdown: schoolSummary.byWilayah[w] ?? { total: 0, sd: 0, smp: 0, sma: 0 },
      faskesBreakdown: { total: 0, rsud: 0, puskesmas: 0 },
      rthBreakdown: { total: 0, taman: 0, hutan: 0 },
    };
  }

  for (const item of facilityItems) {
    const w = (item.wilayah || '').trim().toUpperCase();
    if (!w) continue;
    const cat = (item.category || '').trim().toLowerCase();
    const sub = (item.subCategory || '').trim().toLowerCase();
    const name = (item.name || '').trim().toLowerCase();

    if (!byWilayah[w]) {
      byWilayah[w] = {
        kesehatan: 0,
        rth: 0,
        fasum: 0,
        sekolah: schoolSummary.byWilayah[w]?.total ?? 0,
        schoolBreakdown: schoolSummary.byWilayah[w] ?? { total: 0, sd: 0, smp: 0, sma: 0 },
        faskesBreakdown: { total: 0, rsud: 0, puskesmas: 0 },
        rthBreakdown: { total: 0, taman: 0, hutan: 0 },
      };
    }

    if (cat === 'kesehatan') {
      const isRsud = sub.includes('rumah sakit');
      const isPuskesmas = sub.includes('puskesmas');

      byWilayah[w].kesehatan += 1;
      byWilayah[w].faskesBreakdown.total += 1;
      totals.kesehatan += 1;
      totals.faskesBreakdown.total += 1;

      if (isRsud) {
        byWilayah[w].faskesBreakdown.rsud += 1;
        totals.faskesBreakdown.rsud += 1;
      }
      if (isPuskesmas) {
        byWilayah[w].faskesBreakdown.puskesmas += 1;
        totals.faskesBreakdown.puskesmas += 1;
      }
    } else if (cat === 'fasum' || cat === 'rth') {
      const isHutan = sub.includes('hutan') || name.includes('hutan');

      byWilayah[w].rth += 1;
      byWilayah[w].fasum += 1;
      byWilayah[w].rthBreakdown.total += 1;
      totals.rth += 1;
      totals.fasum += 1;
      totals.rthBreakdown.total += 1;

      if (isHutan) {
        byWilayah[w].rthBreakdown.hutan += 1;
        totals.rthBreakdown.hutan += 1;
      } else {
        byWilayah[w].rthBreakdown.taman += 1;
        totals.rthBreakdown.taman += 1;
      }
    }
  }

  return { totals, byWilayah };
}

/**
 * GET /api/v1/facilities/summary
 * Ringkasan agregasi makro fasilitas dan sekolah per wilayah untuk pemuatan on-demand (lazy fetch)
 */
router.get('/api/v1/facilities/summary', cacheControl(300, 600), async (_req: Request, res: Response) => {
  const schoolSummary = getSchoolsSummary();

  try {
    const rows = await db
      .select({
        wilayah: facilities.wilayah,
        category: facilities.category,
        subCategory: facilities.subCategory,
        name: facilities.name,
      })
      .from(facilities);

    const summary = aggregateFacilitiesSummary(rows, schoolSummary);

    res.status(200).json({
      status: 'success',
      data: summary,
      source: 'database',
    });
  } catch {
    // Fallback jika database belum running / offline
    const fallbackList = await getFallbackFacilities();
    const normalizedFallback = fallbackList.map((item) => ({
      wilayah: item.wilayah,
      category: item.category,
      subCategory: item.sub_category,
      name: item.name,
    }));

    const summary = aggregateFacilitiesSummary(normalizedFallback, schoolSummary);

    res.status(200).json({
      status: 'success',
      data: summary,
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
  const all = [...getSchoolFacilities(), ...(await getFallbackFacilities())];
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
