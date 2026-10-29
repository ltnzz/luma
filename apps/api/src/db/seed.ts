import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { db, pool } from './index';
import {
  facilities,
  facilityBudgets,
  facilityMetrics,
  facilityDocuments,
  facilitySpecs,
  regionalIndicators,
} from './schema';
import { eq } from 'drizzle-orm';

interface RawDoc {
  title: string;
  size: string;
  dept: string;
  file_url?: string;
}

interface RawFacility {
  id: string;
  name: string;
  category: string;
  sub_category: string;
  wilayah: string;
  kecamatan?: string;
  address?: string;
  lat: number;
  lng: number;
  specs?: Record<string, string>;
  budget?: {
    total?: string;
    source?: string;
    year?: string;
    contractor?: string;
    status?: string;
  };
  metrics?: {
    aqi?: number;
    aqi_status?: string;
    pm25?: string;
    walkability?: string;
    transit_access?: string;
  };
  docs?: RawDoc[];
}

interface RawIndicator {
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

interface KotaterbacaPayload {
  indicators: Record<string, RawIndicator>;
  facilities: RawFacility[];
}

/**
 * Menghasilkan UUID deterministik dari string slug fasilitas
 * Menggunakan format UUID v4 standar (8-4-4-4-12 hex)
 */
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

export async function seedDatabase(): Promise<void> {
  const filePath = path.resolve(__dirname, '../../dataset/kotaterbaca_payload.json');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const payload = JSON.parse(fileContent) as KotaterbacaPayload;

  console.log('Seeding regional indicators...');
  for (const [code, ind] of Object.entries(payload.indicators)) {
    await db
      .insert(regionalIndicators)
      .values({
        wilayahCode: code,
        label: ind.label,
        rthPct: ind.rth_pct,
        rthTarget: ind.rth_target,
        aqiVal: ind.aqi_val,
        aqiStatus: ind.aqi_status,
        sekolahTotal: ind.sekolah_total,
        sekolahSub: ind.sekolah_sub,
        faskesTotal: ind.faskes_total,
        faskesSub: ind.faskes_sub,
        fasumTotal: ind.fasum_total,
        fasumSub: ind.fasum_sub,
        transumTotal: ind.transum_total,
        transumSub: ind.transum_sub,
      })
      .onConflictDoUpdate({
        target: regionalIndicators.wilayahCode,
        set: {
          label: ind.label,
          rthPct: ind.rth_pct,
          rthTarget: ind.rth_target,
          aqiVal: ind.aqi_val,
          aqiStatus: ind.aqi_status,
          sekolahTotal: ind.sekolah_total,
          sekolahSub: ind.sekolah_sub,
          faskesTotal: ind.faskes_total,
          faskesSub: ind.faskes_sub,
          fasumTotal: ind.fasum_total,
          fasumSub: ind.fasum_sub,
          transumTotal: ind.transum_total,
          transumSub: ind.transum_sub,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`Successfully seeded ${Object.keys(payload.indicators).length} regional indicators.`);

  console.log('Seeding facilities and relational child tables with UUIDs...');
  for (const f of payload.facilities) {
    const facilityUuid = slugToUuid(f.id);

    await db
      .insert(facilities)
      .values({
        id: facilityUuid,
        slug: f.id,
        name: f.name,
        category: f.category,
        subCategory: f.sub_category,
        wilayah: f.wilayah,
        kecamatan: f.kecamatan ?? null,
        address: f.address ?? null,
        lat: f.lat,
        lng: f.lng,
      })
      .onConflictDoUpdate({
        target: facilities.id,
        set: {
          slug: f.id,
          name: f.name,
          category: f.category,
          subCategory: f.sub_category,
          wilayah: f.wilayah,
          kecamatan: f.kecamatan ?? null,
          address: f.address ?? null,
          lat: f.lat,
          lng: f.lng,
          updatedAt: new Date(),
        },
      });

    // Clean existing relational data for idempotency
    await db.delete(facilityBudgets).where(eq(facilityBudgets.facilityId, facilityUuid));
    await db.delete(facilityMetrics).where(eq(facilityMetrics.facilityId, facilityUuid));
    await db.delete(facilityDocuments).where(eq(facilityDocuments.facilityId, facilityUuid));
    await db.delete(facilitySpecs).where(eq(facilitySpecs.facilityId, facilityUuid));

    // Budget
    if (f.budget) {
      await db.insert(facilityBudgets).values({
        facilityId: facilityUuid,
        total: f.budget.total ?? null,
        source: f.budget.source ?? null,
        year: f.budget.year ?? null,
        contractor: f.budget.contractor ?? null,
        status: f.budget.status ?? null,
      });
    }

    // Metrics
    if (f.metrics) {
      await db.insert(facilityMetrics).values({
        facilityId: facilityUuid,
        aqi: typeof f.metrics.aqi === 'number' ? f.metrics.aqi : null,
        aqiStatus: f.metrics.aqi_status ?? null,
        pm25: f.metrics.pm25 ?? null,
        walkability: f.metrics.walkability ?? null,
        transitAccess: f.metrics.transit_access ?? null,
      });
    }

    // Documents
    if (f.docs && f.docs.length > 0) {
      for (const doc of f.docs) {
        await db.insert(facilityDocuments).values({
          facilityId: facilityUuid,
          title: doc.title,
          size: doc.size,
          dept: doc.dept,
          fileUrl: doc.file_url ?? null,
        });
      }
    }

    // Specs
    if (f.specs) {
      for (const [key, value] of Object.entries(f.specs)) {
        await db.insert(facilitySpecs).values({
          facilityId: facilityUuid,
          specKey: key,
          specValue: String(value),
        });
      }
    }
  }

  console.log(`Successfully seeded ${payload.facilities.length} facilities with UUIDs and relational details.`);
}

// Allow direct CLI execution: tsx src/db/seed.ts
if (require.main === module) {
  seedDatabase()
    .then(async () => {
      console.log('Database seeding completed successfully.');
      await pool.end();
      process.exit(0);
    })
    .catch(async (error: unknown) => {
      console.error('Database seeding failed:', error);
      await pool.end();
      process.exit(1);
    });
}
