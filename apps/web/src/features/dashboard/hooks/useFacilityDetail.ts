import { useEffect, useState } from 'react'

import { ApiError, getFacility, isAbortError, type Facility } from '../../../lib/api'
import type { QueryStatus } from '../types'

export function useFacilityDetail(id: string | null) {
  const [state, setState] = useState<{
    id: string | null
    status: QueryStatus
    data: Facility | null
    error: ApiError | null
  }>({ id: null, status: 'empty', data: null, error: null })

  useEffect(() => {
    if (!id) {
      return
    }

    const controller = new AbortController()
    getFacility(id, controller.signal)
      .then((data) => setState({ id, status: 'success', data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return
        setState({
          id,
          status: 'error',
          data: null,
          error: error instanceof ApiError ? error : new ApiError('network', 'Network request failed'),
        })
      })

    return () => controller.abort()
  }, [id])

  if (!id) return { status: 'empty' as const, data: null, error: null }
  if (state.id !== id) return { status: 'loading' as const, data: null, error: null }
  return state
}
