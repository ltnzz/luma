import type { AnalyticsSector } from '../lib/api'
import type { Language } from '../i18n/dictionaries'

export type CatalogCategory = 'airQuality' | 'kesehatan' | 'rth' | 'sekolah' | 'transum' | 'air'

export interface DataCatalogEntry {
  category: CatalogCategory
  title: string
  source: string
  sourceUrl: string
  coverage: string
  unit: string
  method: string
  period: string | null
  updatedAt: string | null
  status: 'live' | 'active' | 'curated'
  trendSector?: AnalyticsSector
}

/**
 * Provenance shown by the dashboard. Wording intentionally distinguishes
 * API-backed data from curated map layers so the UI never implies a layer is
 * live or complete when the source does not support that claim.
 */
export const DATA_CATALOG: Record<CatalogCategory, DataCatalogEntry> = {
  airQuality: {
    category: 'airQuality',
    title: 'Kualitas Udara',
    source: 'Open-Meteo Air Quality API',
    sourceUrl: 'https://open-meteo.com/en/docs/air-quality-api',
    coverage: 'Koordinat representatif DKI dan 6 wilayah administrasi',
    unit: 'US AQI; PM2.5 dan PM10 (µg/m³)',
    method: 'Sampel model pada koordinat wilayah, cache 15 menit; bukan pembacaan langsung sensor SPKU.',
    period: 'Pembaruan Berkala',
    updatedAt: 'Otomatis setiap 15 menit',
    status: 'live',
    trendSector: 'udara',
  },
  kesehatan: {
    category: 'kesehatan',
    title: 'Fasilitas Kesehatan',
    source: 'Satu Data Jakarta / Dinas Kesehatan',
    sourceUrl: 'https://data.go.id/dataset/data-keberadaan-sarana-kesehatan-di-provinsi-dki-jakarta',
    coverage: 'DKI Jakarta hingga atribut kecamatan',
    unit: 'Lokasi fasilitas',
    method: 'Normalisasi nama, jenis, wilayah, dan koordinat; duplikasi lokasi disaring saat kurasi.',
    period: 'Snapshot 2023–2024',
    updatedAt: '24 Oktober 2026',
    status: 'curated',
  },
  rth: {
    category: 'rth',
    title: 'Ruang Terbuka Hijau',
    source: 'Satu Data Jakarta / Distamhut DKI',
    sourceUrl: 'https://satudata.jakarta.go.id/',
    coverage: 'DKI Jakarta hingga atribut kecamatan',
    unit: 'Lokasi RTH',
    method: 'Agregasi lokasi berdasarkan jenis dan wilayah dari dataset RTH yang dinormalisasi.',
    period: '2022–2023',
    updatedAt: '24 Oktober 2026',
    status: 'active',
    trendSector: 'rth',
  },
  sekolah: {
    category: 'sekolah',
    title: 'Sekolah Negeri',
    source: 'Dapodik / Dinas Pendidikan DKI',
    sourceUrl: 'https://dapo.kemdikbud.go.id/',
    coverage: 'DKI Jakarta hingga atribut kecamatan',
    unit: 'Satuan pendidikan',
    method: 'Filter SD, SMP, dan SMA negeri dengan koordinat valid; dihitung ulang setiap wilayah dipilih.',
    period: 'Tahun ajaran 2024',
    updatedAt: '24 Oktober 2026',
    status: 'active',
  },
  transum: {
    category: 'transum',
    title: 'Transportasi Umum',
    source: 'PT Transportasi Jakarta',
    sourceUrl: 'https://transjakarta.co.id/',
    coverage: 'Koridor utama BRT di DKI Jakarta',
    unit: 'Koridor dan halte',
    method: 'Rute dikelompokkan per koridor; cakupan wilayah mengikuti koridor yang melintas.',
    period: '2024–2025',
    updatedAt: '24 Oktober 2026',
    status: 'active',
    trendSector: 'transum',
  },
  air: {
    category: 'air',
    title: 'Jaringan Air Bersih',
    source: 'PAM JAYA / Perum Jasa Tirta II',
    sourceUrl: 'https://www.pamjaya.co.id/',
    coverage: 'Koridor jaringan utama yang tersedia di Luma',
    unit: 'Persentase akses dan diameter pipa',
    method: 'Digitasi terkurasi untuk visualisasi; belum merepresentasikan inventaris aset pipa lengkap.',
    period: null,
    updatedAt: null,
    status: 'curated',
  },
}

export const DATA_CATALOG_LIST = Object.values(DATA_CATALOG)

const DATA_CATALOG_EN_COPY: Record<
  CatalogCategory,
  Pick<DataCatalogEntry, 'title' | 'coverage' | 'unit' | 'method' | 'period' | 'updatedAt'>
> = {
  airQuality: {
    title: 'Air Quality',
    coverage: 'Representative coordinates for DKI Jakarta and its six administrative regions',
    unit: 'US AQI; PM2.5 and PM10 (µg/m³)',
    method: 'Model samples at regional coordinates, cached for 15 minutes; not direct SPKU sensor readings.',
    period: 'Periodic update',
    updatedAt: 'Automatically every 15 minutes',
  },
  kesehatan: {
    title: 'Healthcare Facilities',
    coverage: 'DKI Jakarta down to district attributes',
    unit: 'Facility locations',
    method: 'Names, types, regions, and coordinates are normalized; duplicate locations are removed during curation.',
    period: '2023–2024 snapshot',
    updatedAt: 'October 24, 2026',
  },
  rth: {
    title: 'Green Open Spaces',
    coverage: 'DKI Jakarta down to district attributes',
    unit: 'Green-space locations',
    method: 'Locations are aggregated by type and region from a normalized green-space dataset.',
    period: '2022–2023',
    updatedAt: 'October 24, 2026',
  },
  sekolah: {
    title: 'Public Schools',
    coverage: 'DKI Jakarta down to district attributes',
    unit: 'Education units',
    method: 'Public primary, middle, and high schools with valid coordinates are filtered and recalculated for each selected region.',
    period: '2024 academic year',
    updatedAt: 'October 24, 2026',
  },
  transum: {
    title: 'Public Transport',
    coverage: 'Main BRT corridors in DKI Jakarta',
    unit: 'Corridors and stops',
    method: 'Routes are grouped by corridor; regional coverage follows the areas each corridor crosses.',
    period: '2024–2025',
    updatedAt: 'October 24, 2026',
  },
  air: {
    title: 'Clean Water Network',
    coverage: 'Main network corridors currently available in Luma',
    unit: 'Access percentage and pipe diameter',
    method: 'Curated digitization for visualization; it does not yet represent the complete pipe asset inventory.',
    period: null,
    updatedAt: null,
  },
}

export function getDataCatalogEntry(
  category: CatalogCategory,
  language: Language,
): DataCatalogEntry {
  const entry = DATA_CATALOG[category]
  return language === 'id' ? entry : { ...entry, ...DATA_CATALOG_EN_COPY[category] }
}

export function getDataCatalogList(language: Language): DataCatalogEntry[] {
  return (Object.keys(DATA_CATALOG) as CatalogCategory[]).map((category) =>
    getDataCatalogEntry(category, language),
  )
}
