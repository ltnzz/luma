import { useCallback, useEffect, useState } from 'react'

import { ApiError, getOverview, isAbortError, type OverviewData } from '../../../lib/api'
import type { QueryStatus } from '../types'

interface UseOverviewResult {
  status: QueryStatus
  data: OverviewData | null
  error: ApiError | null
  refetch: () => void
}

/**
 * Fetches GET /api/v1/visualizations/overview. The client caches the promise
 * for the app session (rate limit: 200 req/15 min), so a single network
 * request serves the whole dashboard. No polling is performed.
 */
export function useOverview(): UseOverviewResult {
  const [state, setState] = useState<{
    status: QueryStatus
    data: OverviewData | null
    error: ApiError | null
  }>({ status: 'loading', data: null, error: null })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    getOverview()
      .then((data) => {
        if (cancelled) return
        const kpis = data.kpis as unknown
        if (!kpis || typeof kpis !== 'object') {
          setState({ status: 'empty', data: null, error: null })
        } else {
          setState({ status: 'success', data, error: null })
        }
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) return
        setState({
          status: 'error',
          data: null,
          error: error instanceof ApiError ? error : new ApiError('network', 'Network request failed'),
        })
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const refetch = useCallback(() => {
    setState({ status: 'loading', data: null, error: null })
    setReloadToken((token) => token + 1)
  }, [])

  return { ...state, refetch }
}
