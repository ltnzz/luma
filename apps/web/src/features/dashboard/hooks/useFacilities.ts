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

/**
 * Session cache per kombinasi param (wilayah|category|search|page|limit).
 * Toggle view Map↔Analytics dengan permintaan sama tidak me-fires ulang
 * /api/v1/facilities (churn request + risiko 429; rate limit 200 req/15 min).
 * Hanya hasil SUKSES yang di-cache — request gagal/aborted di-fetch ulang,
 * sehingga mekanisme cancellation tetap bekerja sebagaimana mestinya.
 */
const facilitiesSessionCache = new Map<
  string,
  { items: Facility[]; pagination: FacilitiesResult['pagination'] }
>()

function buildFacilitiesCacheKey(params: FacilitiesParams): string {
  return [
    params.wilayah ?? '',
    params.category ?? '',
    params.search ?? '',
    params.page ?? 1,
    params.limit ?? 200,
  ].join('|')
}

export function useFacilities(paramsOrWilayah?: string | FacilitiesFilterParams) {
  const params: FacilitiesParams =
    typeof paramsOrWilayah === 'string'
      ? { wilayah: paramsOrWilayah }
      : (paramsOrWilayah ?? {})

  const wilayah = params.wilayah
  const category = params.category
  const limit = params.limit ?? 200
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
    // Key dibangun dari primitives (bukan objek params yang baru tiap render)
    // agar effect deps tetap stabil dan lint exhaustive-deps bersih.
    const cacheKey = buildFacilitiesCacheKey({ wilayah, category, search, page, limit })

    // Cache hit: tidak melakukan fetch ulang — hasil cache-derived sudah
    // di-merge langsung dari render body (lihat bawah), tanpa effect setState.
    if (facilitiesSessionCache.get(cacheKey)) return

    const controller = new AbortController()

    getFacilities({ wilayah, category, limit, page, search }, controller.signal)
      .then((result) => {
        // Hanya hasil sukses yang di-cache (jangan menyimpan promise yang
        // mungkin di-abort oleh unmount — memudarkan ownership signal).
        if (!controller.signal.aborted) {
          facilitiesSessionCache.set(cacheKey, { items: result.items, pagination: result.pagination })
        }
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
    // Manual refetch selalu bypass cache param aktif (cancellation penting).
    facilitiesSessionCache.delete(buildFacilitiesCacheKey({ wilayah, category, search, page, limit }))
    setState((previous) => ({ ...previous, status: 'loading', error: null }))
    setReloadToken((token) => token + 1)
  }, [wilayah, category, limit, page, search])
  useApiRetry(refetch)

  const isMatching = state.wilayah === wilayah
  // Cache-derived (dibaca saat render): hasil sesi untuk param ini menimpa
  // state network tanpa setState di effect. Data tidak hilang antar view.
  const cachedForParams = facilitiesSessionCache.get(
    buildFacilitiesCacheKey({ wilayah, category, search, page, limit }),
  )
  const networkStatus = isMatching ? state.status : ('loading' as const)
  const networkItems = isMatching ? state.items : []
  const networkError = isMatching ? state.error : null
  const networkPagination = isMatching ? state.pagination : null

  const status = cachedForParams
    ? cachedForParams.items.length > 0
      ? ('success' as const)
      : ('empty' as const)
    : networkStatus
  const items = cachedForParams ? cachedForParams.items : networkItems
  const error = cachedForParams ? null : networkError
  const pagination = cachedForParams ? cachedForParams.pagination : networkPagination

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
