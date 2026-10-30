const DEFAULT_TIMEOUT_MS = 15_000

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'parse' | 'empty'
export type ApiConnectionState = 'available' | 'unavailable'

export const API_CONNECTION_EVENT = 'luma:api-connection'
export const API_RETRY_EVENT = 'luma:api-retry'

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

interface ApiConnectionEventDetail {
  state: ApiConnectionState
}

interface ErrorBody {
  status?: string
  statusCode?: number
  message?: string
}

export interface ApiEnvelope<T> {
  status: string
  data: T
  source?: string
  sector?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface RequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

function normalizeBaseUrl(value: string | undefined): string {
  const configured = value?.trim().replace(/\/+$/, '') ?? ''
  if (!configured) return ''

  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    configured.toLowerCase().startsWith('http://')
  ) {
    console.error(
      '[API] VITE_API_BASE_URL menggunakan HTTP pada halaman HTTPS. Menggunakan same-origin untuk mencegah mixed content.',
    )
    return ''
  }

  return configured
}

/**
 * Empty in local development and same-domain deployments so Vite/Vercel can
 * proxy relative `/api` calls. Set VITE_API_BASE_URL to the HTTPS API origin
 * when the production frontend and backend are hosted on different domains.
 */
export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

function publishConnectionState(state: ApiConnectionState): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<ApiConnectionEventDetail>(API_CONNECTION_EVENT, {
      detail: { state },
    }),
  )
}

export function requestApiRetry(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(API_RETRY_EVENT))
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError' && !(error instanceof ApiError)
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

export async function apiRequestJson<T>(
  path: string,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS }: RequestOptions = {},
): Promise<T> {
  const timeoutController = new AbortController()
  const timeoutId = window.setTimeout(() => timeoutController.abort(), timeoutMs)
  const onExternalAbort = () => timeoutController.abort()
  signal?.addEventListener('abort', onExternalAbort)

  let response: Response
  try {
    response = await fetch(buildApiUrl(path), {
      signal: timeoutController.signal,
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    if (signal?.aborted) throw error

    publishConnectionState('unavailable')
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('timeout', 'Request timed out')
    }
    throw new ApiError('network', 'Network request failed')
  } finally {
    window.clearTimeout(timeoutId)
    signal?.removeEventListener('abort', onExternalAbort)
  }

  if (!response.ok) {
    if (response.status === 503 || response.status === 504) {
      publishConnectionState('unavailable')
    } else {
      publishConnectionState('available')
    }
    const body = await parseErrorBody(response)
    throw new ApiError('http', body?.message ?? response.statusText, response.status)
  }

  publishConnectionState('available')

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError('parse', 'Malformed JSON response')
  }
}

export async function requestEnvelope<T>(
  path: string,
  options?: RequestOptions,
): Promise<ApiEnvelope<T>> {
  const body = await apiRequestJson<{
    status?: unknown
    data?: unknown
    source?: unknown
    sector?: unknown
    pagination?: unknown
  }>(path, options)

  if (body.data === undefined || body.data === null) {
    throw new ApiError('empty', 'Success response without data')
  }

  return {
    status: typeof body.status === 'string' ? body.status : 'success',
    data: body.data as T,
    source: typeof body.source === 'string' ? body.source : undefined,
    sector: typeof body.sector === 'string' ? body.sector : undefined,
    pagination:
      body.pagination && typeof body.pagination === 'object'
        ? (body.pagination as ApiEnvelope<T>['pagination'])
        : undefined,
  }
}

export interface ApiHealth {
  status: string
  uptime: number
  timestamp: string
  database: 'connected' | 'disconnected'
}

export function getApiHealth(signal?: AbortSignal): Promise<ApiHealth> {
  return apiRequestJson<ApiHealth>('/health', { signal, timeoutMs: 8_000 })
}
