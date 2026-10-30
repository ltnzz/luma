import { useEffect, useState, useCallback } from 'react'
import { getFacilities, ApiError, isAbortError } from '../../../lib/api'
import type { FacilityItem, FacilitiesFilterParams } from '../types/facility.types'

interface FacilitiesState {
  facilities: FacilityItem[]
  loading: boolean
  error: ApiError | null
}

export function useFacilities(initialParams?: FacilitiesFilterParams) {
  const wilayah = initialParams?.wilayah
  const category = initialParams?.category
  const limit = initialParams?.limit
  const page = initialParams?.page

  const [reloadToken, setReloadToken] = useState<number>(0)
  const [state, setState] = useState<FacilitiesState>({
    facilities: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    getFacilities<FacilityItem>({ wilayah, category, limit, page }, controller.signal)
      .then((res) => {
        setState({
          facilities: res.data,
          loading: false,
          error: null,
        })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || isAbortError(err)) return
        setState({
          facilities: [],
          loading: false,
          error: err instanceof ApiError ? err : new ApiError('network', 'Gagal memuat data fasilitas'),
        })
      })

    return () => {
      controller.abort()
    }
  }, [wilayah, category, limit, page, reloadToken])

  const refetch = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    setReloadToken((token) => token + 1)
  }, [])

  return {
    facilities: state.facilities,
    loading: state.loading,
    error: state.error,
    params: { wilayah, category, limit, page },
    refetch,
  }
}
