import { useCallback, useEffect, useState } from 'react'

import {
  ApiError,
  getSectorAnalytics,
  isAbortError,
  type AnalyticsSector,
  type SectorAnalytics,
} from '../../../lib/api'
import { useApiRetry } from '../../../hooks/useApiRetry'
import type { QueryStatus } from '../types'

export function useSectorAnalytics(sector: AnalyticsSector) {
  const [state, setState] = useState<{
    sector: AnalyticsSector
    status: QueryStatus
    data: SectorAnalytics | null
    error: ApiError | null
  }>({ sector, status: 'loading', data: null, error: null })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getSectorAnalytics(sector, controller.signal)
      .then((data) => {
        setState({
          sector,
          status: Object.keys(data).length > 0 ? 'success' : 'empty',
          data,
          error: null,
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return
        setState({
          sector,
          status: 'error',
          data: null,
          error: error instanceof ApiError ? error : new ApiError('network', 'Network request failed'),
        })
      })

    return () => controller.abort()
  }, [reloadToken, sector])

  const refetch = useCallback(() => {
    setState((previous) => ({ ...previous, status: 'loading', error: null }))
    setReloadToken((token) => token + 1)
  }, [])
  useApiRetry(refetch)

  if (state.sector !== sector) {
    return { status: 'loading' as const, data: null, error: null, refetch }
  }

  return { ...state, refetch }
}
