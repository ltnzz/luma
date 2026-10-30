/**
 * Typed domain API for the Luma backend (apps/api, Express).
 *
 * Contract references (verified by audit, do NOT invent endpoints/fields):
 * - apps/api/README.md  -> relative `/api/v1` paths, dev proxy to :4000
 * - apps/api/src/routes/indicators.route.ts
 * - apps/api/src/routes/visualizations.route.ts
 *
 * Backend response envelope (audit-verified):
 * - success: { status: 'success', data: ... } (+ optional `source`, `sector`, `pagination`)
 * - 429 rate limit: { status: 'error', statusCode: 429, message }
 * - 500: { status: 'error', statusCode: 500, message } (message generic in prod)
 * - 400/404: { status: 'error', message } (statusCode may be absent)
 * - `source: 'dataset_fallback'` is set when the DB is unavailable and the
 *   JSON dataset was served instead.
 */

import { ApiError, requestEnvelope } from './api-client'

export {
  ApiError,
  API_BASE_URL,
  getApiHealth,
  isAbortError,
  requestApiRetry,
} from './api-client'
export type { ApiEnvelope, ApiErrorKind } from './api-client'

/* ------------------------------------------------------------------ */
/* GET /api/v1/indicators                                              */
/* ------------------------------------------------------------------ */

export type IndicatorSource = 'database' | 'dataset_fallback'

/** Normalized indicator row for one administrative wilayah. */
export interface RegionalIndicator {
  wilayahCode: string
  label: string | null
  rthPct: string | null
  rthTarget: string | null
  aqiVal: string | null
  aqiStatus: string | null
  sekolahTotal: string | null
  sekolahSub: string | null
  faskesTotal: string | null
  faskesSub: string | null
  fasumTotal: string | null
  fasumSub: string | null
  transumTotal: string | null
  transumSub: string | null
  source: IndicatorSource | null
  updatedAt: string | null
}

type RawIndicator = Record<string, unknown>

function pickString(raw: RawIndicator, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = raw[key]
    if (typeof value === 'string' && value.trim() !== '') return value
  }
  return null
}

function normalizeIndicator(wilayahCode: string, raw: RawIndicator, source: IndicatorSource): RegionalIndicator {
  return {
    wilayahCode,
    label: pickString(raw, 'label'),
    rthPct: pickString(raw, 'rthPct', 'rth_pct'),
    rthTarget: pickString(raw, 'rthTarget', 'rth_target'),
    aqiVal: pickString(raw, 'aqiVal', 'aqi_val'),
    aqiStatus: pickString(raw, 'aqiStatus', 'aqi_status'),
    sekolahTotal: pickString(raw, 'sekolahTotal', 'sekolah_total'),
    sekolahSub: pickString(raw, 'sekolahSub', 'sekolah_sub'),
    faskesTotal: pickString(raw, 'faskesTotal', 'faskes_total'),
    faskesSub: pickString(raw, 'faskesSub', 'faskes_sub'),
    fasumTotal: pickString(raw, 'fasumTotal', 'fasum_total'),
    fasumSub: pickString(raw, 'fasumSub', 'fasum_sub'),
    transumTotal: pickString(raw, 'transumTotal', 'transum_total'),
    transumSub: pickString(raw, 'transumSub', 'transum_sub'),
    source,
    updatedAt: pickString(raw, 'updatedAt', 'updated_at'),
  }
}

function isIndicatorRow(raw: RawIndicator): boolean {
  // A row carries 'label'; a lookup map is keyed by wilayah codes (ALL, JAKARTA ...).
  return 'label' in raw
}

async function fetchIndicators(
  path: string,
  fallbackWilayahCode: string,
  signal?: AbortSignal,
): Promise<{ lookup: Record<string, RegionalIndicator>; source: IndicatorSource | null }> {
  const envelope = await requestEnvelope<unknown>('/api/v1/indicators' + path, { signal })
  const data = envelope.data as RawIndicator | null

  if (!data || typeof data !== 'object') {
    return { lookup: {}, source: null }
  }

  const inferredSource = envelope.source?.includes('dataset_fallback')
    ? ('dataset_fallback' as const)
    : ('database' as const)

  if (isIndicatorRow(data)) {
    // Single-object response (with ?wilayah=): shape may be empty {}.
    return {
      lookup: {
        [fallbackWilayahCode]: normalizeIndicator(fallbackWilayahCode, data, inferredSource),
      },
      source: inferredSource,
    }
  }

  // Full lookup response (no ?wilayah=), keyed by wilayah_code.
  const lookup: Record<string, RegionalIndicator> = {}
  for (const [code, raw] of Object.entries(data)) {
    if (!raw || typeof raw !== 'object') continue
    lookup[code] = normalizeIndicator(code, raw as RawIndicator, inferredSource)
  }
  return { lookup, source: inferredSource }
}

/**
 * GET /api/v1/indicators[?wilayah=CODE]
 *
 * Always normalized to a lookup record keyed by wilayah code so callers get
 * one stable shape regardless of the param form used.
 */
export async function getIndicators(
  signal?: AbortSignal,
): Promise<Record<string, RegionalIndicator>>;
export async function getIndicators(
  wilayah: string,
  signal?: AbortSignal,
): Promise<Record<string, RegionalIndicator>>;
export async function getIndicators(
  wilayahOrSignal?: string | AbortSignal,
  maybeSignal?: AbortSignal,
): Promise<Record<string, RegionalIndicator>> {
  if (typeof wilayahOrSignal === 'string' && wilayahOrSignal.trim() !== '') {
    const code = wilayahOrSignal.trim().toUpperCase()
    const { lookup } = await fetchIndicators(`?wilayah=${encodeURIComponent(code)}`, code, maybeSignal)
    return lookup
  }
  const signal = typeof wilayahOrSignal === 'object' ? wilayahOrSignal : maybeSignal
  const { lookup } = await fetchIndicators('', 'ALL', signal)
  return lookup
}

/* ------------------------------------------------------------------ */
/* GET /api/v1/visualizations/overview                                 */
/* ------------------------------------------------------------------ */

export interface OverviewKpis {
  sekolah: { total: number; siswa: number; guru: number; rasio: number }
  air: { totalRecords: number; totalSungai: number }
  rth: { totalRth: number }
  transum: { totalHalte: number; populasiTerlayaniPct: number; luasAreaTerlayaniPct: number }
  udara: { stasiunCount: number }
}

export interface VolumeDistributionItem {
  category: string
  title: string
  count: number
}

export interface ChartSlices {
  labels: string[]
  series: number[]
}

export interface AirTrendPoint {
  periode: string
  avg_bod: number
  avg_cod: number
  avg_do: number
  avg_ph: number
}

export interface OverviewCharts {
  volumeDistribution: VolumeDistributionItem[]
  schoolPie: ChartSlices
  airTrend: AirTrendPoint[]
  transitTarget: { populasiTerlayaniPct: number; luasAreaTerlayaniPct: number }
}

export interface OverviewData {
  generatedAt: string
  kpis: OverviewKpis
  charts: OverviewCharts
}

interface OverviewEnvelope {
  generatedAt?: unknown
  overview?: unknown
  kpis?: unknown
  charts?: unknown
}

function emptyCharts(): OverviewCharts {
  return {
    volumeDistribution: [],
    schoolPie: { labels: [], series: [] },
    airTrend: [],
    transitTarget: { populasiTerlayaniPct: 0, luasAreaTerlayaniPct: 0 },
  }
}

let overviewCache: Promise<OverviewData> | null = null

/**
 * GET /api/v1/visualizations/overview
 * Returns { generatedAt, kpis, charts }. The backend duplicates kpis/charts
 * both at top level and inside `overview`; the audit-verified top-level copy
 * is preferred. Cached per session to respect the 200 req/15 min rate limit.
 */
export function getOverview(): Promise<OverviewData> {
  if (!overviewCache) {
    overviewCache = requestEnvelope<OverviewEnvelope>('/api/v1/visualizations/overview')
      .then((envelope) => {
        const body = envelope.data
        const source = body.kpis !== undefined ? body : (body.overview as OverviewEnvelope | undefined)
        if (!source || typeof source !== 'object' || !('kpis' in source) || !source.kpis) {
          throw new ApiError('empty', 'Overview response without KPIs')
        }
        const typedSource = source as Required<Pick<OverviewEnvelope, 'kpis' | 'charts' | 'generatedAt'>>
        return {
          generatedAt: typeof typedSource.generatedAt === 'string' ? typedSource.generatedAt : '',
          kpis: typedSource.kpis as OverviewKpis,
          charts:
            typedSource.charts && typeof typedSource.charts === 'object'
              ? (typedSource.charts as OverviewCharts)
              : emptyCharts(),
        }
      })
      .catch((error: unknown) => {
        // Never cache failures: allows refetch (incl. the 'empty' case above).
        overviewCache = null
        throw error
      })
  }
  return overviewCache
}

/* ------------------------------------------------------------------ */
/* GET /api/v1/facilities                                              */
/* ------------------------------------------------------------------ */

export interface FacilityDocument {
  title: string
  size?: string
  dept?: string
  fileUrl?: string
}

export interface Facility {
  id: string
  slug: string | null
  name: string
  category: string
  subCategory: string | null
  wilayah: string
  kecamatan: string | null
  address: string | null
  lat: number
  lng: number
  specs: Record<string, string>
  budget: Record<string, string>
  metrics: Record<string, unknown>
  documents: FacilityDocument[]
}

export interface FacilitiesParams {
  wilayah?: string
  category?: string
  search?: string
  page?: number
  limit?: number
}

export interface FacilitiesResult {
  items: Facility[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  source: string | null
}

type RawFacility = Record<string, unknown>

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function asStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) =>
      typeof item === 'string' ? [[key, item]] : [],
    ),
  )
}

function normalizeSpecs(value: unknown): Record<string, string> {
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value.flatMap((item) => {
        if (!item || typeof item !== 'object') return []
        const spec = item as Record<string, unknown>
        const key = asString(spec.specKey ?? spec.spec_key)
        const specValue = asString(spec.specValue ?? spec.spec_value)
        return key && specValue ? [[key, specValue]] : []
      }),
    )
  }
  return asStringRecord(value)
}

function normalizeDocuments(raw: RawFacility): FacilityDocument[] {
  const value = raw.documents ?? raw.docs
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const document = item as Record<string, unknown>
    const title = asString(document.title)
    if (!title) return []
    return [{
      title,
      size: asString(document.size) ?? undefined,
      dept: asString(document.dept) ?? undefined,
      fileUrl: asString(document.fileUrl ?? document.file_url) ?? undefined,
    }]
  })
}

function normalizeFacility(raw: RawFacility): Facility | null {
  const id = asString(raw.id)
  const name = asString(raw.name)
  const category = asString(raw.category)
  const wilayah = asString(raw.wilayah)
  const lat = asNumber(raw.lat)
  const lng = asNumber(raw.lng)

  if (!id || !name || !category || !wilayah || lat === null || lng === null) return null

  return {
    id,
    slug: asString(raw.slug),
    name,
    category,
    subCategory: asString(raw.subCategory ?? raw.sub_category),
    wilayah,
    kecamatan: asString(raw.kecamatan),
    address: asString(raw.address),
    lat,
    lng,
    specs: normalizeSpecs(raw.specs),
    budget: asStringRecord(raw.budget),
    metrics:
      raw.metrics && typeof raw.metrics === 'object' && !Array.isArray(raw.metrics)
        ? (raw.metrics as Record<string, unknown>)
        : {},
    documents: normalizeDocuments(raw),
  }
}

export async function getFacilities(
  params: FacilitiesParams = {},
  signal?: AbortSignal,
): Promise<FacilitiesResult> {
  const query = new URLSearchParams()
  if (params.wilayah) query.set('wilayah', params.wilayah)
  if (params.category) query.set('category', params.category)
  if (params.search) query.set('search', params.search)
  query.set('page', String(params.page ?? 1))
  query.set('limit', String(params.limit ?? 100))

  const envelope = await requestEnvelope<unknown[]>(`/api/v1/facilities?${query}`, { signal })
  const items = Array.isArray(envelope.data)
    ? envelope.data.flatMap((raw) => {
        const normalized = raw && typeof raw === 'object' ? normalizeFacility(raw as RawFacility) : null
        return normalized ? [normalized] : []
      })
    : []

  return {
    items,
    pagination: envelope.pagination ?? {
      page: params.page ?? 1,
      limit: params.limit ?? 100,
      total: items.length,
      totalPages: items.length > 0 ? 1 : 0,
    },
    source: envelope.source ?? null,
  }
}

export async function getFacility(id: string, signal?: AbortSignal): Promise<Facility> {
  const envelope = await requestEnvelope<RawFacility>(
    `/api/v1/facilities/${encodeURIComponent(id)}`,
    { signal },
  )
  const facility = normalizeFacility(envelope.data)
  if (!facility) throw new ApiError('empty', 'Facility response is incomplete')
  return facility
}

/* ------------------------------------------------------------------ */
/* GET /api/v1/visualizations/sectors/:sector                          */
/* ------------------------------------------------------------------ */

export type AnalyticsSector = 'air' | 'rth' | 'sekolah' | 'transum' | 'udara' | 'kesehatan'
export type SectorAnalytics = Record<string, unknown>

export async function getSectorAnalytics(
  sector: AnalyticsSector,
  signal?: AbortSignal,
): Promise<SectorAnalytics> {
  const envelope = await requestEnvelope<SectorAnalytics>(
    `/api/v1/visualizations/sectors/${encodeURIComponent(sector)}`,
    { signal },
  )
  return envelope.data
}

/** Reset module-level caches (error recovery / tests). */
export function clearApiCaches(): void {
  overviewCache = null
}
