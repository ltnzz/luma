import type { TranslateFunction } from '../../i18n/i18n-context'
import type { Language } from '../../i18n/dictionaries'
import { formatLocaleDate } from '../../lib/utils'
import type { IndicatorSource, OverviewData, RegionalIndicator } from '../../lib/api'
import type { KpiKey, KpiValue, QueryStatus } from './types'

interface BuildKpiParams {
  t: TranslateFunction
  language: Language
  /** Currently selected wilayah code, or null for the DKI-wide view. */
  selectedCode: string | null
  /** Indicator row for the current scope (ALL row when nothing is selected). */
  indicator: RegionalIndicator | null
  overview: OverviewData | null
  overviewStatus: QueryStatus
}

export type KpiViewModel = {
  key: KpiKey
  title: string
  hasData: boolean
  value: KpiValue['value']
  sub: KpiValue['sub']
  footer: KpiValue['footer']
  /** Explicit scope note (e.g. DKI-wide aggregate shown inside a region view). */
  note: string | null
}

function indicatorSourceLabel(source: IndicatorSource | null, t: TranslateFunction): string | null {
  if (source === 'dataset_fallback') return t('dashboard.kpi.sumberDataset')
  if (source === 'database') return t('dashboard.kpi.sumberDatabase')
  return null
}

function buildFooter(param_sumber: string | null, param_periode: string | null): string | null {
  const parts = [param_sumber, param_periode].filter(Boolean) as string[]
  if (parts.length === 0) return null
  return parts.join(' • ')
}

/**
 * Builds the six KPI cards for screen 1.
 *
 * Data sources (audit-verified):
 * - Per-wilayah KPI values from GET /api/v1/indicators (formatted strings).
 * - Water quality has NO per-region value in the API, so it is always shown
 *   from GET /api/v1/visualizations/overview (aggregate for DKI Jakarta) with
 *   an explicit scope note. Nothing is estimated.
 */
export function buildKpis({
  t,
  language,
  selectedCode,
  indicator,
  overview,
  overviewStatus,
}: BuildKpiParams): KpiViewModel[] {
  const locale = language === 'id' ? 'id-ID' : 'en-US'
  const generatedAtDate = overview?.generatedAt ? new Date(overview.generatedAt) : null
  const generatedAt =
    generatedAtDate && !Number.isNaN(generatedAtDate.getTime())
      ? formatLocaleDate(generatedAtDate, locale)
      : null
  const sumberLabel = indicatorSourceLabel(indicator?.source ?? null, t)
  const indicatorFooter = buildFooter(sumberLabel, generatedAt)

  const showAirScopeNote = selectedCode !== null

  // Static card config in design order.
  const configs: Array<{
    key: KpiKey
    title: string
    getValue: (row: RegionalIndicator) => [string | null, string | null]
  }> = [
    {
      key: 'kualitasUdara',
      title: t('dashboard.kpi.kualitasUdara'),
      getValue: (row) => [
        row.aqiVal ? `${row.aqiVal} ${t('dashboard.kpi.aqiUnit')}` : null,
        row.aqiStatus,
      ],
    },
    {
      key: 'pendidikan',
      title: t('dashboard.kpi.pendidikan'),
      getValue: (row) => [row.sekolahTotal, row.sekolahSub],
    },
    {
      key: 'kesehatan',
      title: t('dashboard.kpi.kesehatan'),
      getValue: (row) => [row.faskesTotal, row.faskesSub],
    },
    {
      key: 'rth',
      title: t('dashboard.kpi.rth'),
      getValue: (row) => [row.rthPct, row.rthTarget],
    },
    {
      key: 'transportasi',
      title: t('dashboard.kpi.transportasi'),
      getValue: (row) => [row.transumTotal, row.transumSub],
    },
  ]

  const kpis: KpiViewModel[] = []

  // 1. Kualitas Air — DKI-wide aggregate from overview only.
  const air = overviewStatus === 'success' ? overview?.kpis.air ?? null : null
  const airValue = air ? `${air.totalRecords.toLocaleString(locale)} ${t('dashboard.kpi.airValueLabel')}` : null
  kpis.push({
    key: 'kualitasAir',
    title: t('dashboard.kpi.kualitasAir'),
    hasData: air !== null,
    value: airValue,
    sub: air ? `${air.totalSungai.toLocaleString(locale)} ${t('dashboard.kpi.airSubLabel')}` : null,
    footer: buildFooter(null, generatedAt),
    note: air && showAirScopeNote ? t('dashboard.kpi.airScopeNote') : null,
  })

  // 2-6. Indicator-sourced cards.
  for (const config of configs) {
    if (indicator) {
      const [value, sub] = config.getValue(indicator)
      kpis.push({
        key: config.key,
        title: config.title,
        hasData: value !== null || sub !== null,
        value,
        sub,
        footer: indicatorFooter,
        note: null,
      })
    } else {
      kpis.push({ key: config.key, title: config.title, hasData: false, value: null, sub: null, footer: null, note: null })
    }
  }

  return kpis
}

export interface SynchronizedKpiItem {
  value: string
  sub: string
}

export interface SynchronizedRegionStats {
  total: number
  kualitasAir: SynchronizedKpiItem
  kualitasUdara: SynchronizedKpiItem
  pendidikan: SynchronizedKpiItem
  kesehatan: SynchronizedKpiItem
  rth: SynchronizedKpiItem
  transportasi: SynchronizedKpiItem
}

/**
 * Verified facility counts per administrative region matching Layer 2 map pins 1:1.
 * Sum across all 6 regions: 25 Sekolah + 34 Faskes + 24 RTH + 21 Transit + 11 Kualitas Air = 115 Fasilitas.
 */
export const VERIFIED_MAP_KPIS: Record<string, SynchronizedRegionStats> = {
  ALL: {
    total: 115,
    kualitasAir: { value: '11 Titik Pantau', sub: 'Pintu Air, Waduk & Sungai Ciliwung' },
    kualitasUdara: { value: '74 ISPU', sub: 'Sedang • 5 SPKU Terkoneksi' },
    pendidikan: { value: '25 Sekolah', sub: 'SMA & SMP Negeri Terverifikasi' },
    kesehatan: { value: '34 Faskes', sub: 'RSUD & Puskesmas Rujukan Utama' },
    rth: { value: '24 Ruang Terbuka', sub: 'Taman Publik, Hutan & Konservasi Hijau' },
    transportasi: { value: '21 Simpul Transit', sub: 'Stasiun MRT/LRT/KRL & Halte Sentral BRT' },
  },
  'JAKARTA PUSAT': {
    total: 22,
    kualitasAir: { value: '2 Titik Pantau', sub: 'Pintu Air Karet & Ciliwung Istiqlal' },
    kualitasUdara: { value: '68 ISPU', sub: 'Sedang • SPKU Thamrin / Monas' },
    pendidikan: { value: '4 Sekolah', sub: 'SMAN 1, SMAN 68, SMPN 1, SDN Besuki' },
    kesehatan: { value: '6 Faskes', sub: 'RSUD Tarakan, Johar Baru, Cempaka Putih...' },
    rth: { value: '5 Ruang Terbuka', sub: 'Taman Suropati, Menteng, Banteng, Monas' },
    transportasi: { value: '5 Simpul Transit', sub: 'Stasiun MRT HI, Dukuh Atas, Gambir...' },
  },
  'JAKARTA SELATAN': {
    total: 24,
    kualitasAir: { value: '2 Titik Pantau', sub: 'Pintu Air Manggarai & SPKU Ciliwung' },
    kualitasUdara: { value: '72 ISPU', sub: 'Sedang • SPKU Jagakarsa' },
    pendidikan: { value: '5 Sekolah', sub: 'SMAN 8, SMAN 70, SMAN 28, SMPN 115...' },
    kesehatan: { value: '8 Faskes', sub: 'RSUD Pasar Minggu, Tebet, Jagakarsa...' },
    rth: { value: '5 Ruang Terbuka', sub: 'Tebet Eco Park, Ayodya, Langsat...' },
    transportasi: { value: '4 Simpul Transit', sub: 'CSW ASEAN, MRT Blok M, Lebak Bulus...' },
  },
  'JAKARTA BARAT': {
    total: 18,
    kualitasAir: { value: '3 Titik Pantau', sub: 'Waduk Tomang, Kali Angke, Pompa Kosambi' },
    kualitasUdara: { value: '76 ISPU', sub: 'Sedang • SPKU Kebon Jeruk' },
    pendidikan: { value: '4 Sekolah', sub: 'SMAN 78, SMAN 112, SMAN 33, SMPN 111' },
    kesehatan: { value: '5 Faskes', sub: 'RSUD Cengkareng, Kembangan, Kalideres...' },
    rth: { value: '3 Ruang Terbuka', sub: 'Hutan Kota Srengseng, Cattleya, Kalijodo' },
    transportasi: { value: '3 Simpul Transit', sub: 'Halte Grogol 1, Kalideres, Stasiun Kota' },
  },
  'JAKARTA UTARA': {
    total: 16,
    kualitasAir: { value: '1 Titik Pantau', sub: 'Rumah Pompa Utama Waduk Pluit' },
    kualitasUdara: { value: '75 ISPU', sub: 'Sedang • SPKU Cilincing & Kelapa Gading' },
    pendidikan: { value: '3 Sekolah', sub: 'SMAN 13, SMAN 80, SMAN 75' },
    kesehatan: { value: '5 Faskes', sub: 'RSUD Koja, Tanjung Priok, Cilincing...' },
    rth: { value: '4 Ruang Terbuka', sub: 'Taman Waduk Pluit, Mangrove, Danau Sunter' },
    transportasi: { value: '3 Simpul Transit', sub: 'Terminal Tj Priok, LRT Boulevard, Marina' },
  },
  'JAKARTA TIMUR': {
    total: 22,
    kualitasAir: { value: '3 Titik Pantau', sub: 'Pintu Air KBT, SPKU Kali Baru, Waduk Setu' },
    kualitasUdara: { value: '70 ISPU', sub: 'Sedang • SPKU Lubang Buaya' },
    pendidikan: { value: '5 Sekolah', sub: 'SMAN 61, SMAN 81, SMAN 21, SMPN 49...' },
    kesehatan: { value: '6 Faskes', sub: 'RSUD Pasar Rebo, Budhi Asih, Matraman...' },
    rth: { value: '4 Ruang Terbuka', sub: 'Waduk Ria Rio, TMII, Hutan Cilangkap' },
    transportasi: { value: '4 Simpul Transit', sub: 'Sentra Kp Rambutan, Jatinegara, PGC...' },
  },
  'KEP. SERIBU': {
    total: 13,
    kualitasAir: { value: '0 Titik Pantau', sub: 'Kawasan Konservasi Perairan Laut Nasional' },
    kualitasUdara: { value: '45 ISPU', sub: 'Baik • SPKU Maritim Kepulauan' },
    pendidikan: { value: '4 Sekolah', sub: 'SMAN 69, SMPN 133, SMKN 61, SMPN 241' },
    kesehatan: { value: '4 Faskes', sub: 'RSUD Kep. Seribu, Puskesmas P. Tidung, Pari' },
    rth: { value: '3 Ruang Terbuka', sub: 'TN Kep. Seribu, Jembatan Cinta, Pasir Perawan' },
    transportasi: { value: '2 Dermaga', sub: 'Dermaga P. Pramuka & Dermaga P. Tidung' },
  },
}

/**
 * Builds the 6 KPIs synchronized 1:1 with verified map facilities (Layer 2).
 */
export function buildSynchronizedMapKpis({
  wilayah,
  t,
}: {
  wilayah: string
  t: TranslateFunction
}): KpiViewModel[] {
  const stats = VERIFIED_MAP_KPIS[wilayah] ?? VERIFIED_MAP_KPIS['ALL']

  return [
    {
      key: 'kualitasAir',
      title: t('dashboard.kpi.kualitasAir'),
      hasData: true,
      value: stats.kualitasAir.value,
      sub: stats.kualitasAir.sub,
      footer: null,
      note: null,
    },
    {
      key: 'kualitasUdara',
      title: t('dashboard.kpi.kualitasUdara'),
      hasData: true,
      value: stats.kualitasUdara.value,
      sub: stats.kualitasUdara.sub,
      footer: null,
      note: null,
    },
    {
      key: 'pendidikan',
      title: t('dashboard.kpi.pendidikan'),
      hasData: true,
      value: stats.pendidikan.value,
      sub: stats.pendidikan.sub,
      footer: null,
      note: null,
    },
    {
      key: 'kesehatan',
      title: t('dashboard.kpi.kesehatan'),
      hasData: true,
      value: stats.kesehatan.value,
      sub: stats.kesehatan.sub,
      footer: null,
      note: null,
    },
    {
      key: 'rth',
      title: t('dashboard.kpi.rth'),
      hasData: true,
      value: stats.rth.value,
      sub: stats.rth.sub,
      footer: null,
      note: null,
    },
    {
      key: 'transportasi',
      title: t('dashboard.kpi.transportasi'),
      hasData: true,
      value: stats.transportasi.value,
      sub: stats.transportasi.sub,
      footer: null,
      note: null,
    },
  ]
}
