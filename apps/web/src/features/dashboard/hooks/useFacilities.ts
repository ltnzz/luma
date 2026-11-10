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
  cacheKey: string
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

  // Tanpa wilayah tetap boleh mengambil data ketika kategori dipilih. Ini
  // dipakai peta provinsi untuk menampilkan marker kategori secara on-demand,
  // tanpa mengunduh seluruh fasilitas pada pemuatan awal.
  const isAllWilayah = !wilayah || wilayah === 'ALL'
  const isDisabled = isAllWilayah && !category
  const cacheKey = buildFacilitiesCacheKey({ wilayah, category, search, page, limit })
  const cachedForParams = !isDisabled ? facilitiesSessionCache.get(cacheKey) : undefined

  const [state, setState] = useState<FacilitiesState>(() => ({
    cacheKey,
    status: isDisabled
      ? 'success'
      : cachedForParams
        ? cachedForParams.items.length > 0
          ? 'success'
          : 'empty'
        : 'loading',
    items: cachedForParams ? cachedForParams.items : [],
    pagination: cachedForParams ? cachedForParams.pagination : null,
    error: null,
  }))
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (isDisabled) return

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
          cacheKey,
          status: result.items.length > 0 ? 'success' : 'empty',
          items: result.items,
          pagination: result.pagination,
          error: null,
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return
        setState({
          cacheKey,
          status: 'error',
          items: [],
          pagination: null,
          error: error instanceof ApiError ? error : new ApiError('network', 'Gagal memuat data fasilitas'),
        })
      })

    return () => controller.abort()
  }, [isDisabled, cacheKey, wilayah, category, limit, page, search, reloadToken])

  const refetch = useCallback(() => {
    if (isDisabled) return
    // Manual refetch selalu bypass cache param aktif (cancellation penting).
    facilitiesSessionCache.delete(cacheKey)
    setState((previous) => ({ ...previous, status: 'loading', error: null }))
    setReloadToken((token) => token + 1)
  }, [isDisabled, cacheKey])
  useApiRetry(refetch)

  const isMatching = state.cacheKey === cacheKey
  // Cache-derived (dibaca saat render): hasil sesi untuk param ini menimpa
  // state network tanpa setState di effect. Data tidak hilang antar view.
  const networkStatus = isMatching ? state.status : ('loading' as const)
  const networkItems = isMatching ? state.items : []
  const networkError = isMatching ? state.error : null
  const networkPagination = isMatching ? state.pagination : null

  const status = isDisabled
    ? ('success' as const)
    : cachedForParams
      ? cachedForParams.items.length > 0
        ? ('success' as const)
        : ('empty' as const)
      : networkStatus
  const items = isDisabled ? [] : (cachedForParams ? cachedForParams.items : networkItems)
  const error = isDisabled || cachedForParams ? null : networkError
  const pagination = isDisabled ? null : (cachedForParams ? cachedForParams.pagination : networkPagination)

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
