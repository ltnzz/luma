/**
 * Thin API client for the Luma backend (apps/api, Express).
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

export const API_BASE = '/api/v1'

const REQUEST_TIMEOUT_MS = 15_000

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'parse' | 'empty'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError' && !(error instanceof ApiError)
}

interface ErrorBody {
  status?: string
  statusCode?: number
  message?: string
}

/** Envelope as produced by the backend routes. */
export interface ApiEnvelope<T> {
  status: string
  data: T
  source?: string
  sector?: string
}

async function parseErrorBody(response: Response): Promise<ErrorBody | null> {
  try {
    const text = await response.text()
    if (!text) return null
    return JSON.parse(text) as ErrorBody
  } catch {
    return null
  }
}

async function requestEnvelope<T>(path: string, signal?: AbortSignal): Promise<ApiEnvelope<T>> {
  const timeoutController = new AbortController()
  const timeoutId = window.setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS)

  // Combine the caller's signal (component unmount) with our timeout signal.
  const onExternalAbort = () => timeoutController.abort()
  signal?.addEventListener('abort', onExternalAbort)

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      signal: timeoutController.signal,
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    if (signal?.aborted) {
      // Caller aborted (unmount): rethrow the AbortError for silent cleanup.
      throw error
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('timeout', 'Request timed out')
    }
    throw new ApiError('network', 'Network request failed')
  } finally {
    window.clearTimeout(timeoutId)
    signal?.removeEventListener('abort', onExternalAbort)
  }

  if (!response.ok) {
    const body = await parseErrorBody(response)
    // The backend does not always include statusCode in 400/404 bodies;
    // the HTTP status itself is the source of truth.
    throw new ApiError('http', body?.message ?? response.statusText, response.status)
  }

  let body: { status?: unknown; data?: unknown; source?: unknown; sector?: unknown }
  try {
    body = (await response.json()) as typeof body
  } catch {
    throw new ApiError('parse', 'Malformed JSON response')
  }

  if (body.data === undefined || body.data === null) {
    throw new ApiError('empty', 'Success response without data')
  }

  return {
    status: typeof body.status === 'string' ? body.status : 'success',
    data: body.data as T,
    source: typeof body.source === 'string' ? body.source : undefined,
    sector: typeof body.sector === 'string' ? body.sector : undefined,
  }
}

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
  const envelope = await requestEnvelope<unknown>('/indicators' + path, signal)
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
    overviewCache = requestEnvelope<OverviewEnvelope>('/visualizations/overview')
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

/** Reset module-level caches (error recovery / tests). */
export function clearApiCaches(): void {
  overviewCache = null
}
