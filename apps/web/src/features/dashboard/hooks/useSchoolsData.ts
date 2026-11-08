import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ApiError,
  getSchoolFacilities,
  isAbortError,
  type Facility,
  type SchoolLevelBreakdown,
} from '../../../lib/api'

export interface SchoolLevelsFilter {
  sma: boolean
  smp: boolean
  sd: boolean
}

export type SchoolFacility = Facility & { level: 'SMA' | 'SMP' | 'SD' }

const schoolsCache = new Map<string, SchoolFacility[]>()
const EMPTY_SCHOOLS: SchoolFacility[] = []

export function useSchoolsData(
  activeWilayah = 'ALL',
  breakdown?: SchoolLevelBreakdown,
) {
  const isAll = !activeWilayah || activeWilayah === 'ALL'
  const cachedSchools = !isAll ? schoolsCache.get(activeWilayah) : undefined
  const [schools, setSchools] = useState<SchoolFacility[]>(() => cachedSchools ?? [])
  const [loadedWilayah, setLoadedWilayah] = useState<string | null>(() =>
    cachedSchools ? activeWilayah : null,
  )
  const [status, setStatus] = useState<'loading' | 'success' | 'empty' | 'error'>(() =>
    cachedSchools ? (cachedSchools.length > 0 ? 'success' : 'empty') : 'loading',
  )
  const [error, setError] = useState<ApiError | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (isAll) return

    const cached = schoolsCache.get(activeWilayah)
    if (cached) return

    const controller = new AbortController()

    getSchoolFacilities(activeWilayah, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return
        const validSchools = items.filter(
          (item): item is SchoolFacility =>
            item.level === 'SD' || item.level === 'SMP' || item.level === 'SMA',
        )
        schoolsCache.set(activeWilayah, validSchools)
        setSchools(validSchools)
        setLoadedWilayah(activeWilayah)
        setStatus(validSchools.length > 0 ? 'success' : 'empty')
        setError(null)
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted || isAbortError(reason)) return
        setSchools([])
        setLoadedWilayah(activeWilayah)
        setStatus('error')
        setError(new ApiError('network', 'Gagal memuat dataset sekolah'))
      })
    return () => controller.abort()
  }, [activeWilayah, isAll, reloadToken])

  const refetch = useCallback(() => {
    if (isAll) return
    schoolsCache.delete(activeWilayah)
    setStatus('loading')
    setError(null)
    setReloadToken((token) => token + 1)
  }, [activeWilayah, isAll])

  const cachedForWilayah = !isAll ? schoolsCache.get(activeWilayah) : undefined
  const resolvedSchools = useMemo(() => {
    if (isAll) return EMPTY_SCHOOLS
    return cachedForWilayah ?? (loadedWilayah === activeWilayah ? schools : EMPTY_SCHOOLS)
  }, [isAll, cachedForWilayah, loadedWilayah, activeWilayah, schools])

  const resolvedStatus = isAll
    ? ('success' as const)
    : cachedForWilayah
      ? cachedForWilayah.length > 0
        ? ('success' as const)
        : ('empty' as const)
      : loadedWilayah === activeWilayah
        ? status
        : ('loading' as const)

  const resolvedError = isAll || cachedForWilayah ? null : (loadedWilayah === activeWilayah ? error : null)

  // Default: SEMUA FALSE (hidden by default, exactly per user request)
  const [levelFilters, setLevelFilters] = useState<SchoolLevelsFilter>({
    sma: false,
    smp: false,
    sd: false,
  })

  const toggleLevel = (level: keyof SchoolLevelsFilter) => {
    setLevelFilters((prev) => ({
      ...prev,
      [level]: !prev[level],
    }))
  }

  const resetLevels = () => {
    setLevelFilters({
      sma: false,
      smp: false,
      sd: false,
    })
  }

  // Hitung jumlah sekolah di wilayah aktif untuk badge filter
  const schoolCounts = useMemo(() => {
    if (resolvedSchools.length > 0) {
      let sma = 0
      let smp = 0
      let sd = 0
      for (let i = 0; i < resolvedSchools.length; i++) {
        const lvl = resolvedSchools[i].level
        if (lvl === 'SMA') sma++
        else if (lvl === 'SMP') smp++
        else if (lvl === 'SD') sd++
      }
      return { sma, smp, sd, total: resolvedSchools.length }
    }

    if (breakdown) {
      return breakdown
    }

    return isAll
      ? { sma: 117, smp: 289, sd: 1097, total: 1503 }
      : { sma: 0, smp: 0, sd: 0, total: 0 }
  }, [breakdown, isAll, resolvedSchools])

  // Seluruh sekolah di wilayah aktif (lengkap untuk disaring oleh subfilter jenjang)
  const schoolsInWilayah = useMemo(() => {
    if (isAll) return EMPTY_SCHOOLS
    return resolvedSchools
  }, [isAll, resolvedSchools])

  // Sekolah yang aktif berdasarkan toggle filter & wilayah
  const activeSchools = useMemo(() => {
    if (isAll) return EMPTY_SCHOOLS
    const isAnyActive = levelFilters.sma || levelFilters.smp || levelFilters.sd
    if (!isAnyActive) return []

    return resolvedSchools.filter((s) => {
      if (s.level === 'SMA' && !levelFilters.sma) return false
      if (s.level === 'SMP' && !levelFilters.smp) return false
      if (s.level === 'SD' && !levelFilters.sd) return false
      return true
    })
  }, [isAll, levelFilters, resolvedSchools])

  return {
    levelFilters,
    toggleLevel,
    resetLevels,
    schoolCounts,
    activeSchools,
    schoolsInWilayah,
    hasActiveSchools: levelFilters.sma || levelFilters.smp || levelFilters.sd,
    status: resolvedStatus,
    error: resolvedError,
    refetch,
  }
}

