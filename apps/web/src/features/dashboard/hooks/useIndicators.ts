import { useCallback, useEffect, useState } from 'react'

import {
  ApiError,
  getIndicators,
  isAbortError,
  type IndicatorSource,
  type RegionalIndicator,
} from '../../../lib/api'
import type { QueryStatus } from '../types'
import { useApiRetry } from '../../../hooks/useApiRetry'

interface IndicatorsState {
  status: QueryStatus
  lookup: Record<string, RegionalIndicator> | null
  source: IndicatorSource | null
  error: ApiError | null
}

interface UseIndicatorsResult extends IndicatorsState {
  refetch: () => void
}

/**
 * Session cache — hasil full-lookup jarang berubah dan hook ini sendiri
 * mendokumentasikan "Wilayah switching never triggers a refetch". Tanpa cache,
 * setiap toggle view Map↔Analytics me-refetch /api/v1/indicators (churn request,
 * boros kuota rate limit 200 req/15 min). Pola identik overviewCache di api.ts.
 */
let indicatorsSessionCache: {
  lookup: Record<string, RegionalIndicator>
  source: IndicatorSource | null
} | null = null

/**
 * Fetches the full indicator lookup (GET /api/v1/indicators without ?wilayah=).
 * Wilayah switching never triggers a refetch; consumers select from the lookup.
 * Aborts the in-flight request on unmount and before each manual refetch.
 */
export function useIndicators(): UseIndicatorsResult {
  const [state, setState] = useState<IndicatorsState>({
    status: 'loading',
    lookup: null,
    source: null,
    error: null,
  })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    // Cache hit: tidak melakukan fetch ulang — state cache-derived sudah
    // dikembalikan langsung dari render body (lihat bawah). Unmount cleanup
    // tetap aman karena tidak ada request yang berjalan.
    if (indicatorsSessionCache) return

    const controller = new AbortController()

    getIndicators(controller.signal)
      .then((lookup) => {
        if (lookup['ALL'] && Object.keys(lookup).length > 0) {
          indicatorsSessionCache = { lookup, source: lookup['ALL'].source }
          setState({
            status: 'success',
            lookup,
            source: lookup['ALL'].source,
            error: null,
          })
        } else {
          // Empty lookup payload: nothing usable from the API.
          setState({ status: 'empty', lookup: null, source: null, error: null })
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return
        setState({
          status: 'error',
          lookup: null,
          source: null,
          error: error instanceof ApiError ? error : new ApiError('network', 'Network request failed'),
        })
      })

    return () => {
      controller.abort()
    }
  }, [reloadToken])

  const refetch = useCallback(() => {
    // Manual refetch selalu bypass cache (cancellation yang memang diperlukan).
    indicatorsSessionCache = null
    setState((previous) => ({ ...previous, status: 'loading', error: null }))
    setReloadToken((token) => token + 1)
  }, [])

  useApiRetry(refetch)

  // Cache-derived state (dibaca saat render — selalu mengikuti isi cache).
  // Data hasil sebelumnya tidak hilang antar view tanpa setState di effect.
  const sessionCache = indicatorsSessionCache
  let effectiveState: IndicatorsState
  if (
    sessionCache &&
    sessionCache.lookup['ALL'] &&
    Object.keys(sessionCache.lookup).length > 0
  ) {
    effectiveState = { status: 'success', lookup: sessionCache.lookup, source: sessionCache.source, error: null }
  } else if (sessionCache) {
    effectiveState = { status: 'empty', lookup: null, source: null, error: null }
  } else {
    effectiveState = state
  }

  return { ...effectiveState, refetch }
}
