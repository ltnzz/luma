import { useState, useCallback, useMemo } from 'react'
import { InteractiveMap } from '../../../components/ui/InteractiveMap'
import { FacilityDetailModal } from './FacilityDetailModal'
import { TransitRoutesWidget } from './TransitRoutesWidget'
import { AirQualityCard } from './AirQualityCard'
import { StaticMapLegend } from './StaticMapLegend'
import { KpiMetricsDock, type KpiCategory } from './KpiMetricsDock'
import { CompactDataSourceCard } from './CompactDataSourceCard'
import {
  ContextualCategoryFilterCard,
  type FaskesSubFilter,
  type RthSubFilter,
  type SchoolSubFilter,
} from './ContextualCategoryFilterCard'
import { useFacilities } from '../hooks/useFacilities'
import { useRealtimeAirQuality } from '../hooks/useRealtimeAirQuality'
import { useSchoolsData } from '../hooks/useSchoolsData'
import { CITY_AGGREGATES } from '../../../data/city-aggregates'
import { TRANSJAKARTA_CORRIDORS } from '../../../data/transit-corridors'
import type { FacilityItem } from '../types/facility.types'

const WILAYAH_COORDINATES: Record<string, { center: [number, number]; zoom: number }> = {
  ALL: { center: [106.8272, -6.185], zoom: 10.8 },
  'JAKARTA PUSAT': { center: [106.8341, -6.1805], zoom: 13.0 },
  'JAKARTA UTARA': { center: [106.8926, -6.1214], zoom: 12.6 },
  'JAKARTA BARAT': { center: [106.7589, -6.1683], zoom: 12.6 },
  'JAKARTA SELATAN': { center: [106.8097, -6.2615], zoom: 12.6 },
  'JAKARTA TIMUR': { center: [106.9004, -6.225], zoom: 12.6 },
  'KEP. SERIBU': { center: [106.5615, -5.6122], zoom: 11.0 },
}

interface FullScreenMapDashboardProps {
  activeWilayah?: string
  onSelectWilayah?: (wilayah: string) => void
  onNavigateToDataSources?: () => void
}

/**
 * FullScreenMapDashboard — Dashboard Peta Interaktif Luma (Arsitektur Filter Dinamis Terpadu)
 * - Dock Bawah (KpiMetricsDock) bertindak sebagai Pengendali Filter Kategori Utama (Provinsi & Kota)
 * - Kolom Kiri menampilkan ContextualCategoryFilterCard saat kategori aktif (Faskes, RTH, Sekolah, Transum, Air)
 * - Map Layer beralih ke mode Solo-Focus saat kategori aktif untuk kejelasan visual
 */
export function FullScreenMapDashboard({
  activeWilayah: propActiveWilayah,
  onSelectWilayah: propOnSelectWilayah,
  onNavigateToDataSources,
}: FullScreenMapDashboardProps = {}) {
  const [internalWilayah, setInternalWilayah] = useState<string>('ALL')
  const activeWilayah = propActiveWilayah ?? internalWilayah

  const [focusCoords, setFocusCoords] = useState<[number, number] | null>(null)
  const [focusZoom, setFocusZoom] = useState<number | null>(null)

  const [selectedFacility, setSelectedFacility] = useState<FacilityItem | null>(null)
  const [isTransitMode, setIsTransitMode] = useState<boolean>(false)
  const [showWaterNetwork, setShowWaterNetwork] = useState<boolean>(true)
  const [focusedCorridorId, setFocusedCorridorId] = useState<string | null>(null)
  const [isTransitPanelCollapsed, setIsTransitPanelCollapsed] = useState<boolean>(false)
  const activeTransitModes = useMemo(() => ['transjakarta'], [])

  // 1. Primary Filter Category State (Dikendalikan oleh KpiMetricsDock di Bawah)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<KpiCategory | null>(null)

  // 2. Sub-filter States
  const [faskesSubFilter, setFaskesSubFilter] = useState<FaskesSubFilter>('all')
  const [rthSubFilter, setRthSubFilter] = useState<RthSubFilter>('all')
  const [schoolSubFilter, setSchoolSubFilter] = useState<SchoolSubFilter>('all')

  const handleSelectWilayah = useCallback(
    (wilayah: string) => {
      if (propOnSelectWilayah) {
        propOnSelectWilayah(wilayah)
      } else {
        setInternalWilayah(wilayah)
      }

      // Reset facility selection saat berpindah wilayah
      setSelectedFacility(null)

      const target = WILAYAH_COORDINATES[wilayah] ?? WILAYAH_COORDINATES.ALL
      setFocusCoords(target.center)
      setFocusZoom(target.zoom)
    },
    [propOnSelectWilayah]
  )

  const cityAggregate = useMemo(() => {
    return CITY_AGGREGATES.find((c) => c.code === activeWilayah) ?? null
  }, [activeWilayah])

  const scopeLabel = cityAggregate ? cityAggregate.name : 'DKI Jakarta'
  const corridorCount = cityAggregate ? cityAggregate.corridors.length : 13

  const availableCorridors = useMemo(() => {
    if (!cityAggregate) return TRANSJAKARTA_CORRIDORS
    return TRANSJAKARTA_CORRIDORS.filter((c) =>
      cityAggregate.corridors.includes(c.koridorCode)
    )
  }, [cityAggregate])

  const { facilities } = useFacilities({
    wilayah: activeWilayah === 'ALL' ? undefined : activeWilayah,
  })

  // Hitung jumlah faskes & RTH di wilayah aktif
  const faskesCounts = useMemo(() => {
    const list = facilities.filter((f) => f.category === 'kesehatan')
    const rsud = list.filter((f) => f.subCategory?.toLowerCase().includes('rumah sakit')).length
    const puskesmas = list.filter((f) => f.subCategory?.toLowerCase().includes('puskesmas')).length
    return { total: list.length, rsud, puskesmas }
  }, [facilities])

  const rthCounts = useMemo(() => {
    const list = facilities.filter((f) => f.category === 'fasum')
    const hutan = list.filter(
      (f) => f.subCategory?.toLowerCase().includes('hutan') || f.name.toLowerCase().includes('hutan')
    ).length
    const taman = list.length - hutan
    return { total: list.length, taman, hutan }
  }, [facilities])

  const { schoolCounts, schoolsInWilayah } = useSchoolsData(activeWilayah)

  // Filter Fasilitas Dinamis Berdasarkan activeCategoryFilter & Sub-filter
  const combinedFacilities = useMemo(() => {
    // 1. Kategori TRANSUM atau AIR: Tidak menggunakan pin titik fasilitas individual
    if (activeCategoryFilter === 'transum' || activeCategoryFilter === 'air') {
      return []
    }

    // 2. Kategori SEKOLAH: HANYA tampilkan sekolah dari database resmi sesuai jenjang
    if (activeCategoryFilter === 'sekolah') {
      return schoolsInWilayah.filter((s) => {
        if (schoolSubFilter === 'all') return true
        return s.level?.toLowerCase() === schoolSubFilter.toLowerCase()
      }) as unknown as FacilityItem[]
    }

    // 3. Kategori KESEHATAN (Faskes): HANYA tampilkan fasilitas kesehatan
    if (activeCategoryFilter === 'kesehatan') {
      return facilities.filter((f) => {
        if (f.category !== 'kesehatan') return false
        if (faskesSubFilter === 'rsud') {
          return f.subCategory?.toLowerCase().includes('rumah sakit')
        }
        if (faskesSubFilter === 'puskesmas') {
          return f.subCategory?.toLowerCase().includes('puskesmas')
        }
        return true
      })
    }

    // 4. Kategori RTH (Ruang Hijau): HANYA tampilkan fasilitas fasum/RTH
    if (activeCategoryFilter === 'rth') {
      return facilities.filter((f) => {
        if (f.category !== 'fasum') return false
        const isHutan =
          f.subCategory?.toLowerCase().includes('hutan') || f.name.toLowerCase().includes('hutan')
        if (rthSubFilter === 'hutan') return isHutan
        if (rthSubFilter === 'taman') return !isHutan
        return true
      })
    }

    // 5. Default (Semua Kategori): Tampilkan fasilitas dasar non-sekolah + seluruh sekolah
    const baseWithoutMockEdu = facilities.filter((f) => f.category !== 'pendidikan')
    return [...baseWithoutMockEdu, ...(schoolsInWilayah as unknown as FacilityItem[])]
  }, [facilities, schoolsInWilayah, activeCategoryFilter, faskesSubFilter, rthSubFilter, schoolSubFilter])

  const { data: realtimeAirQuality, isLive: isAirLive } = useRealtimeAirQuality(activeWilayah)

  // Saat marker fasilitas diklik: buka tooltip pratinjau
  const handleMarkerClick = useCallback(
    (facility: FacilityItem) => {
      setSelectedFacility(facility)
      setFocusCoords([facility.lng, facility.lat])
    },
    []
  )


  const handleToggleShowTransit = useCallback(() => {
    setActiveCategoryFilter((prev) => (prev === 'transum' ? null : 'transum'))
  }, [])

  const handleFocusRoute = useCallback(
    (center: [number, number], zoom: number, corridorId?: string) => {
      setFocusCoords(center)
      setFocusZoom(zoom)
      if (corridorId) {
        setFocusedCorridorId(corridorId)
      }
    },
    []
  )

  const handleResetFocusCorridor = useCallback(() => {
    setFocusedCorridorId(null)
  }, [])

  // Aksi toggle interaktif dari KpiMetricsDock di Bawah
  const handleDockCategoryClick = useCallback((category: KpiCategory) => {
    setActiveCategoryFilter((prev) => (prev === category ? null : category))
  }, [])

  // Visibilitas Layer Berdasarkan Filter Solo
  const isTransitVisible = activeCategoryFilter === null || activeCategoryFilter === 'transum'
  const isWaterVisible = showWaterNetwork && (activeCategoryFilter === null || activeCategoryFilter === 'air')

  return (
    <div className="relative h-full w-full overflow-hidden bg-surface-muted select-none">
      {/* 1. Base Layer: Full-Screen Interactive Map Canvas */}
      <InteractiveMap
        height="100%"
        className="h-full w-full"
        facilities={combinedFacilities}
        selectedFacilityId={selectedFacility?.id}
        onSelectFacility={handleMarkerClick}
        focusCoords={focusCoords}
        focusZoom={focusZoom}
        showWaterNetwork={isWaterVisible}
        showTransit={isTransitVisible}
        activeTransitModes={activeTransitModes}
        selectedWilayah={activeWilayah}
        onSelectWilayah={handleSelectWilayah}
        focusedCorridorId={focusedCorridorId}
        onSelectCorridor={setFocusedCorridorId}
      />


      {/* 3. Panel Kolom Kiri: Sumber Data Resmi, Kualitas Udara, dan Contextual Filter / Legenda */}
      {!isTransitMode && (
        <aside className="pointer-events-none absolute top-3.5 left-3 sm:top-4 sm:left-4 z-30 flex flex-col gap-2 max-h-[calc(100vh-5.5rem)] overflow-y-auto scrollbar-none pb-2">
          <CompactDataSourceCard onNavigateToDataSources={onNavigateToDataSources} />
          <AirQualityCard
            airAqi={realtimeAirQuality?.aqi ?? 173}
            airStatus={realtimeAirQuality?.category ?? 'Tidak Sehat'}
            isAirLive={isAirLive}
          />

          {/* Contextual Filter Card: Muncul saat salah satu card dock bawah aktif */}
          {activeCategoryFilter ? (
            <ContextualCategoryFilterCard
              category={activeCategoryFilter}
              scopeLabel={scopeLabel}
              corridors={availableCorridors}
              faskesFilter={faskesSubFilter}
              onFaskesFilterChange={setFaskesSubFilter}
              rthFilter={rthSubFilter}
              onRthFilterChange={setRthSubFilter}
              schoolFilter={schoolSubFilter}
              onSchoolFilterChange={setSchoolSubFilter}
              selectedCorridorId={focusedCorridorId}
              onSelectCorridor={(corridor) => {
                if (corridor) {
                  handleFocusRoute(corridor.center, corridor.zoom, corridor.id)
                } else {
                  handleResetFocusCorridor()
                }
              }}
              isWaterNetworkVisible={showWaterNetwork}
              onToggleWaterNetwork={() => setShowWaterNetwork((prev) => !prev)}
              faskesCounts={faskesCounts}
              rthCounts={rthCounts}
              schoolCounts={schoolCounts}
              onClose={() => setActiveCategoryFilter(null)}
            />
          ) : (
            <StaticMapLegend />
          )}
        </aside>
      )}

      {/* 4. Bottom Center — Horizontal KPI Metrics Overview Dock & Filter Controller (Selalu Tampil) */}
      {!isTransitMode && (
        <div className="pointer-events-none absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-[calc(100vw-1.5rem)]">
          <KpiMetricsDock
            waterCoverage={68}
            waterCoverageLabel="Akses"
            isWaterActive={showWaterNetwork}
            faskesCount={faskesCounts.total}
            rthCount={rthCounts.total}
            schoolCount={schoolCounts.total > 0 ? schoolCounts.total : 1503}
            transitCorridorCount={corridorCount}
            activeCategory={activeCategoryFilter}
            onFilterCategory={handleDockCategoryClick}
          />
        </div>
      )}

      {/* Mode Transum Khusus (jika dibuka dari panel rute) */}
      {isTransitMode && (
        <div className="pointer-events-none absolute top-16 left-3 sm:top-16 sm:left-4 z-20 animate-in fade-in slide-in-from-left-4 duration-300">
          <TransitRoutesWidget
            showTransit={isTransitVisible}
            onToggleShowTransit={handleToggleShowTransit}
            onFocusRoute={handleFocusRoute}
            focusedCorridorId={focusedCorridorId}
            onResetFocus={handleResetFocusCorridor}
            isCollapsed={isTransitPanelCollapsed}
            onToggleCollapse={(collapsed) => {
              setIsTransitPanelCollapsed(collapsed)
              if (collapsed) {
                setIsTransitMode(false)
              }
            }}
          />
        </div>
      )}

      {/* Modal Detail Fasilitas Glass (Muncul langsung di Kanan saat marker diklik) */}
      {selectedFacility && !isTransitMode && (
        <FacilityDetailModal
          facility={selectedFacility}
          isOpen={Boolean(selectedFacility)}
          onClose={() => setSelectedFacility(null)}
          variant="side-glass"
        />
      )}
    </div>
  )
}
