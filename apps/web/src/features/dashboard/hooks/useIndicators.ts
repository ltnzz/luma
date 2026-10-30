import { useCallback, useEffect, useState } from 'react'

import {
  ApiError,
  getIndicators,
  isAbortError,
  type IndicatorSource,
  type RegionalIndicator,
} from '../../../lib/api'
import type { QueryStatus } from '../types'

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
    const controller = new AbortController()

    getIndicators(controller.signal)
      .then((lookup) => {
        if (lookup['ALL'] && Object.keys(lookup).length > 0) {
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
    setState((previous) => ({ ...previous, status: 'loading', error: null }))
    setReloadToken((token) => token + 1)
  }, [])

  return { ...state, refetch }
}
