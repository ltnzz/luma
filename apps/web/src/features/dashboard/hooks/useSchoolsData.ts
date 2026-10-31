import { useState, useMemo } from 'react'
import type { Facility } from '../../../lib/api'
import schoolsDataRaw from '../../../data/schools-full.json'

export interface SchoolLevelsFilter {
  sma: boolean
  smp: boolean
  sd: boolean
}

const ALL_SCHOOLS = schoolsDataRaw as unknown as (Facility & { level: 'SMA' | 'SMP' | 'SD' })[]

export function useSchoolsData(activeWilayah = 'ALL') {
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
        ? ALL_SCHOOLS
        : ALL_SCHOOLS.filter((s) => s.wilayah === activeWilayah)

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
  }, [activeWilayah])

  // Sekolah yang aktif berdasarkan toggle filter & wilayah
  const activeSchools = useMemo(() => {
    const isAnyActive = levelFilters.sma || levelFilters.smp || levelFilters.sd
    if (!isAnyActive) return []

    return ALL_SCHOOLS.filter((s) => {
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
  }, [activeWilayah, levelFilters])

  return {
    levelFilters,
    toggleLevel,
    resetLevels,
    schoolCounts,
    activeSchools,
    hasActiveSchools: levelFilters.sma || levelFilters.smp || levelFilters.sd,
  }
}

