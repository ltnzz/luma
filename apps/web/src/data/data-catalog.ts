import type { AnalyticsSector } from '../lib/api'

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
    period: 'Real-time',
    updatedAt: 'Otomatis setiap 15 menit',
    status: 'live',
    trendSector: 'udara',
  },
  kesehatan: {
    category: 'kesehatan',
    title: 'Fasilitas Kesehatan',
    source: 'Satu Data Jakarta / Dinas Kesehatan',
    sourceUrl: 'https://data.go.id/dataset/dataset/data-keberadaan-sarana-kesehatan-di-provinsi-dki-jakarta',
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
