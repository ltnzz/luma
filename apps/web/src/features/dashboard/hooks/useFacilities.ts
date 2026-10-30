import { useCallback, useEffect, useState } from 'react'

import {
  ApiError,
  getFacilities,
  isAbortError,
  type Facility,
  type FacilitiesResult,
  type FacilitiesParams,
} from '../../../lib/api'
import { useApiRetry } from '../../../hooks/useApiRetry'
import type { QueryStatus } from '../types'
import type { FacilityItem, FacilitiesFilterParams } from '../types/facility.types'

interface FacilitiesState {
  wilayah?: string
  status: QueryStatus
  items: Facility[]
  pagination: FacilitiesResult['pagination'] | null
  error: ApiError | null
}

export function useFacilities(paramsOrWilayah?: string | FacilitiesFilterParams) {
  const params: FacilitiesParams =
    typeof paramsOrWilayah === 'string'
      ? { wilayah: paramsOrWilayah }
      : (paramsOrWilayah ?? {})

  const wilayah = params.wilayah
  const category = params.category
  const limit = params.limit ?? 100
  const page = params.page ?? 1
  const search = params.search

  const [state, setState] = useState<FacilitiesState>({
    wilayah,
    status: 'loading',
    items: [],
    pagination: null,
    error: null,
  })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getFacilities({ wilayah, category, limit, page, search }, controller.signal)
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
          error: error instanceof ApiError ? error : new ApiError('network', 'Gagal memuat data fasilitas'),
        })
      })

    return () => controller.abort()
  }, [wilayah, category, limit, page, search, reloadToken])

  const refetch = useCallback(() => {
    setState((previous) => ({ ...previous, status: 'loading', error: null }))
    setReloadToken((token) => token + 1)
  }, [])
  useApiRetry(refetch)

  const isMatching = state.wilayah === wilayah
  const items = isMatching ? state.items : []
  const status = isMatching ? state.status : ('loading' as const)
  const error = isMatching ? state.error : null
  const pagination = isMatching ? state.pagination : null

  return {
    items,
    status,
    pagination,
    error,
    facilities: items as unknown as FacilityItem[],
    loading: status === 'loading',
    params: { wilayah, category, limit, page, search },
    refetch,
  }
}
