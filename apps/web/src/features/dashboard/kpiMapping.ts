import type { TranslateFunction } from '../../i18n/i18n-context'
import type { Language } from '../../i18n/dictionaries'
import { formatLocaleDate } from '../../lib/utils'
import type { IndicatorSource, OverviewData, RegionalIndicator } from '../../lib/api'
import type { KpiKey, KpiValue, QueryStatus } from './types'
import type { RealtimeAirQuality } from './hooks/useRealtimeAirQuality'
import { getAqiCategory } from './hooks/useRealtimeAirQuality'

interface BuildKpiParams {
  t: TranslateFunction
  language: Language
  /** Currently selected wilayah code, or null for the DKI-wide view. */
  selectedCode: string | null
  /** Indicator row for the current scope (ALL row when nothing is selected). */
  indicator: RegionalIndicator | null
  overview: OverviewData | null
  overviewStatus: QueryStatus
  realtimeAirQuality?: RealtimeAirQuality | null
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
  /** Card visual variant for differentiated styling. */
  variant?: 'default' | 'environment' | 'facility'
  /** Color-coded status badge (used by environment cards). */
  status?: { label: string; color: string } | null
  /** Normalized historical values (0-max) for compact sparkline. Only set when real historical data exists. */
  sparkline?: number[] | null
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
  realtimeAirQuality,
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
      getValue: () => [
        realtimeAirQuality?.aqi != null ? `${realtimeAirQuality.aqi} AQI` : '—',
        realtimeAirQuality?.category != null
          ? `${realtimeAirQuality.category} • PM2.5: ${realtimeAirQuality.pm25} µg/m³`
          : 'Data real-time belum tersedia',
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
  const airTrend = overview?.charts.airTrend ?? []
  const airSparkline =
    airTrend.length > 0 ? airTrend.map((point) => (typeof point.avg_cod === 'number' ? point.avg_cod : 0)) : null
  kpis.push({
    key: 'kualitasAir',
    title: t('dashboard.kpi.kualitasAir'),
    hasData: air !== null,
    value: airValue,
    sub: air ? `${air.totalSungai.toLocaleString(locale)} ${t('dashboard.kpi.airSubLabel')}` : null,
    footer: buildFooter(null, generatedAt),
    note: air && showAirScopeNote ? t('dashboard.kpi.airScopeNote') : null,
    variant: 'environment',
    sparkline: airSparkline,
  })

  // 2-6. Indicator-sourced cards.
  const aqi = realtimeAirQuality?.aqi != null ? realtimeAirQuality.aqi : null
  const aqiCategory = aqi != null ? getAqiCategory(aqi) : null
  const aqiStatusColor = (category: string) => {
    const c = category.toLowerCase()
    if (c.includes('baik')) return 'var(--luma-primary)'
    if (c.includes('sedang')) return 'var(--luma-map-transit)'
    if (c.includes('tidak sehat (sensitif)')) return '#f59e0b'
    if (c.includes('tidak sehat')) return 'var(--luma-danger)'
    if (c.includes('sangat tidak sehat')) return '#be185d'
    if (c.includes('berbahaya')) return '#7f1d1d'
    return 'var(--luma-primary)'
  }

  for (const config of configs) {
    const isFacility =
      config.key === 'pendidikan' ||
      config.key === 'kesehatan' ||
      config.key === 'rth' ||
      config.key === 'transportasi'
    const isAir = config.key === 'kualitasUdara'

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
        variant: isFacility ? 'facility' : isAir ? 'environment' : 'default',
        status:
          isAir && aqiCategory != null
            ? { label: aqiCategory, color: aqiStatusColor(aqiCategory) }
            : null,
      })
    } else {
      kpis.push({
        key: config.key,
        title: config.title,
        hasData: false,
        value: null,
        sub: null,
        footer: null,
        note: null,
        variant: isFacility ? 'facility' : isAir ? 'environment' : 'default',
      })
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
 * Sum across all 6 regions: 1.503 Sekolah + 51 Faskes + 34 RTH + 21 Transit + 11 Kualitas Air = 1.620 Fasilitas.
 */
export const VERIFIED_MAP_KPIS: Record<string, SynchronizedRegionStats> = {
  ALL: {
    total: 1620,
    kualitasAir: { value: '11 Titik Pantau', sub: 'Pintu Air, Waduk & Sungai Ciliwung' },
    kualitasUdara: { value: '74 ISPU', sub: 'Sedang • 5 SPKU Terkoneksi' },
    pendidikan: { value: '1.503 Sekolah', sub: '117 SMAN • 289 SMPN • 1.097 SDN' },
    kesehatan: { value: '51 Faskes', sub: 'RSUD & Puskesmas Rujukan Utama' },
    rth: { value: '34 Ruang Terbuka', sub: 'Taman Publik, Hutan & Konservasi Hijau' },
    transportasi: { value: '21 Simpul Transit', sub: 'Stasiun MRT/LRT/KRL & Halte Sentral BRT' },
  },
  'JAKARTA PUSAT': {
    total: 228,
    kualitasAir: { value: '2 Titik Pantau', sub: 'Pintu Air Karet & Ciliwung Istiqlal' },
    kualitasUdara: { value: '68 ISPU', sub: 'Sedang • SPKU Thamrin / Monas' },
    pendidikan: { value: '205 Sekolah', sub: '13 SMAN • 36 SMPN • 156 SDN' },
    kesehatan: { value: '9 Faskes', sub: 'RSUD Tarakan, Puskesmas Gambir, Tn Abang...' },
    rth: { value: '7 Ruang Terbuka', sub: 'Taman Suropati, Menteng, GBK, Situ Lembang...' },
    transportasi: { value: '5 Simpul Transit', sub: 'Stasiun MRT HI, Dukuh Atas, Gambir...' },
  },
  'JAKARTA SELATAN': {
    total: 345,
    kualitasAir: { value: '2 Titik Pantau', sub: 'Pintu Air Manggarai & SPKU Ciliwung' },
    kualitasUdara: { value: '72 ISPU', sub: 'Sedang • SPKU Jagakarsa' },
    pendidikan: { value: '320 Sekolah', sub: '29 SMAN • 66 SMPN • 225 SDN' },
    kesehatan: { value: '12 Faskes', sub: 'RSUD Pasar Minggu, Puskesmas Kebayoran Baru...' },
    rth: { value: '7 Ruang Terbuka', sub: 'Tebet Eco Park, Martha Tiahahu, Spathodea...' },
    transportasi: { value: '4 Simpul Transit', sub: 'CSW ASEAN, MRT Blok M, Lebak Bulus...' },
  },
  'JAKARTA BARAT': {
    total: 404,
    kualitasAir: { value: '3 Titik Pantau', sub: 'Waduk Tomang, Kali Angke, Pompa Kosambi' },
    kualitasUdara: { value: '76 ISPU', sub: 'Sedang • SPKU Kebon Jeruk' },
    pendidikan: { value: '385 Sekolah', sub: '17 SMAN • 50 SMPN • 318 SDN' },
    kesehatan: { value: '8 Faskes', sub: 'RSUD Cengkareng, Puskesmas Kebon Jeruk...' },
    rth: { value: '5 Ruang Terbuka', sub: 'Hutan Srengseng, Jalur Tomang, Rawa Buaya...' },
    transportasi: { value: '3 Simpul Transit', sub: 'Halte Grogol 1, Kalideres, Stasiun Kota' },
  },
  'JAKARTA UTARA': {
    total: 204,
    kualitasAir: { value: '1 Titik Pantau', sub: 'Rumah Pompa Utama Waduk Pluit' },
    kualitasUdara: { value: '75 ISPU', sub: 'Sedang • SPKU Cilincing & Kelapa Gading' },
    pendidikan: { value: '186 Sekolah', sub: '17 SMAN • 39 SMPN • 130 SDN' },
    kesehatan: { value: '8 Faskes', sub: 'RSUD Koja, Puskesmas Tj Priok, Penjaringan...' },
    rth: { value: '6 Ruang Terbuka', sub: 'Taman Waduk Pluit, Hutan Penjaringan, Bambu...' },
    transportasi: { value: '3 Simpul Transit', sub: 'Terminal Tj Priok, LRT Boulevard, Marina' },
  },
  'JAKARTA TIMUR': {
    total: 418,
    kualitasAir: { value: '3 Titik Pantau', sub: 'Pintu Air KBT, SPKU Kali Baru, Waduk Setu' },
    kualitasUdara: { value: '70 ISPU', sub: 'Sedang • SPKU Lubang Buaya' },
    pendidikan: { value: '395 Sekolah', sub: '40 SMAN • 95 SMPN • 260 SDN' },
    kesehatan: { value: '10 Faskes', sub: 'RSUD Pasar Rebo, Puskesmas Duren Sawit...' },
    rth: { value: '6 Ruang Terbuka', sub: 'Waduk Ria Rio, TMII, Cempaka, Waduk Setu...' },
    transportasi: { value: '4 Simpul Transit', sub: 'Sentra Kp Rambutan, Jatinegara, PGC...' },
  },
  'KEP. SERIBU': {
    total: 21,
    kualitasAir: { value: '0 Titik Pantau', sub: 'Kawasan Konservasi Perairan Laut Nasional' },
    kualitasUdara: { value: '45 ISPU', sub: 'Baik • SPKU Maritim Kepulauan' },
    pendidikan: { value: '12 Sekolah', sub: '1 SMAN • 7 SMPN • 4 SDN' },
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
  realtimeAirQuality,
}: {
  wilayah: string
  t: TranslateFunction
  realtimeAirQuality?: RealtimeAirQuality | null
}): KpiViewModel[] {
  const stats = VERIFIED_MAP_KPIS[wilayah] ?? VERIFIED_MAP_KPIS['ALL']

  const hasAqiData = Boolean(realtimeAirQuality && typeof realtimeAirQuality.aqi === 'number')

  const aqiValue = hasAqiData ? `${realtimeAirQuality!.aqi} AQI` : '—'

  const aqiSub =
    realtimeAirQuality && realtimeAirQuality.category
      ? `${realtimeAirQuality.category} • PM2.5: ${realtimeAirQuality.pm25} µg/m³`
      : 'Data real-time belum tersedia'

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
      hasData: hasAqiData,
      value: aqiValue,
      sub: aqiSub,
      footer: realtimeAirQuality?.updatedAt ? `Live ${realtimeAirQuality.updatedAt}` : null,
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
