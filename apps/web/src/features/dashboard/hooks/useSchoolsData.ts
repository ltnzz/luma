import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, getSchoolFacilities, isAbortError, type Facility } from '../../../lib/api'

export interface SchoolLevelsFilter {
  sma: boolean
  smp: boolean
  sd: boolean
}

export type SchoolFacility = Facility & { level: 'SMA' | 'SMP' | 'SD' }

const schoolsCache = new Map<string, SchoolFacility[]>()
const EMPTY_SCHOOLS: SchoolFacility[] = []

export function useSchoolsData(activeWilayah = 'ALL') {
  const cachedSchools = schoolsCache.get(activeWilayah)
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
  }, [activeWilayah, reloadToken])

  const refetch = useCallback(() => {
    schoolsCache.delete(activeWilayah)
    setStatus('loading')
    setError(null)
    setReloadToken((token) => token + 1)
  }, [activeWilayah])

  const cachedForWilayah = schoolsCache.get(activeWilayah)
  const resolvedSchools = useMemo(
    () => cachedForWilayah ?? (loadedWilayah === activeWilayah ? schools : EMPTY_SCHOOLS),
    [activeWilayah, cachedForWilayah, loadedWilayah, schools],
  )
  const resolvedStatus = cachedForWilayah
    ? cachedForWilayah.length > 0 ? 'success' : 'empty'
    : loadedWilayah === activeWilayah ? status : 'loading'

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
    const inWilayah =
      activeWilayah === 'ALL'
        ? resolvedSchools
        : resolvedSchools.filter((s) => s.wilayah === activeWilayah)

    let sma = 0
    let smp = 0
    let sd = 0
    for (let i = 0; i < inWilayah.length; i++) {
      const lvl = inWilayah[i].level
      if (lvl === 'SMA') sma++
      else if (lvl === 'SMP') smp++
      else if (lvl === 'SD') sd++
    }
    return { sma, smp, sd, total: inWilayah.length }
  }, [activeWilayah, resolvedSchools])

  // Seluruh sekolah di wilayah aktif (lengkap untuk disaring oleh subfilter jenjang)
  const schoolsInWilayah = useMemo(() => {
    return activeWilayah === 'ALL'
      ? resolvedSchools
      : resolvedSchools.filter((s) => s.wilayah === activeWilayah)
  }, [activeWilayah, resolvedSchools])

  // Sekolah yang aktif berdasarkan toggle filter & wilayah
  const activeSchools = useMemo(() => {
    const isAnyActive = levelFilters.sma || levelFilters.smp || levelFilters.sd
    if (!isAnyActive) return []

    return resolvedSchools.filter((s) => {
      // 1. Filter wilayah
      if (activeWilayah !== 'ALL' && s.wilayah !== activeWilayah) {
        return false
      }
      // 2. Filter jenjang
      if (s.level === 'SMA' && !levelFilters.sma) return false
      if (s.level === 'SMP' && !levelFilters.smp) return false
      if (s.level === 'SD' && !levelFilters.sd) return false
      return true
    })
  }, [activeWilayah, levelFilters, resolvedSchools])

  return {
    levelFilters,
    toggleLevel,
    resetLevels,
    schoolCounts,
    activeSchools,
    schoolsInWilayah,
    hasActiveSchools: levelFilters.sma || levelFilters.smp || levelFilters.sd,
    status: resolvedStatus,
    error,
    refetch,
  }
}

