import { useCallback, useEffect, useState } from 'react'

import {
  ApiError,
  getFacilities,
  isAbortError,
  type Facility,
  type FacilitiesResult,
} from '../../../lib/api'
import { useApiRetry } from '../../../hooks/useApiRetry'
import type { QueryStatus } from '../types'

interface FacilitiesState {
  wilayah?: string
  status: QueryStatus
  items: Facility[]
  pagination: FacilitiesResult['pagination'] | null
  error: ApiError | null
}

export function useFacilities(wilayah?: string) {
  const [state, setState] = useState<FacilitiesState>({
    status: 'loading',
    items: [],
    pagination: null,
    error: null,
  })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getFacilities({ wilayah, limit: 100 }, controller.signal)
      .then((result) => {
        setState({
          wilayah,
          status: result.items.length > 0 ? 'success' : 'empty',
          items: result.items,
          pagination: result.pagination,
          error: null,
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return
        setState({
          wilayah,
          status: 'error',
          items: [],
          pagination: null,
          error: error instanceof ApiError ? error : new ApiError('network', 'Network request failed'),
        })
      })

    return () => controller.abort()
  }, [reloadToken, wilayah])

  const refetch = useCallback(() => {
    setState((previous) => ({ ...previous, status: 'loading', error: null }))
    setReloadToken((token) => token + 1)
  }, [])
  useApiRetry(refetch)

  if (state.wilayah !== wilayah) {
    return { status: 'loading' as const, items: [], pagination: null, error: null, refetch }
  }

  return { ...state, refetch }
}
