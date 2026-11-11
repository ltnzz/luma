import { lazy, Suspense, useState, useCallback, useEffect, useMemo } from 'react'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Skeleton } from '../../../components/ui/Skeleton'
import { AirQualityCard } from './AirQualityCard'
import { StaticMapLegend } from './StaticMapLegend'
import { KpiMetricsDock, type KpiCategory } from './KpiMetricsDock'
import { CompactDataSourceCard } from './CompactDataSourceCard'
import { MobileMapBottomSheet, type MobileMapTab } from './MobileMapBottomSheet'

const FacilityDetailModal = lazy(() =>
  import('./FacilityDetailModal').then((m) => ({ default: m.FacilityDetailModal }))
)

const TransitRoutesWidget = lazy(() =>
  import('./TransitRoutesWidget').then((m) => ({ default: m.TransitRoutesWidget }))
)
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
import { useTranslation } from '../../../i18n/useTranslation'
import { getFacilitiesSummary, isAbortError, type FacilitiesSummary } from '../../../lib/api'
import { useApiRetry } from '../../../hooks/useApiRetry'

const InteractiveMap = lazy(() =>
  import('../../../components/ui/InteractiveMap').then((module) => ({
    default: module.InteractiveMap,
  })),
)

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
  activeTourStep?: number | null
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
  activeTourStep,
}: FullScreenMapDashboardProps = {}) {
  const { t, language } = useTranslation()
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
  const [isLegendOpen, setIsLegendOpen] = useState(false)
  const [prevTourStep, setPrevTourStep] = useState<number | null | undefined>(activeTourStep)

  // Pola React resmi: sinkronisasi state saat tur aktif:
  // - Tutup modal fasilitas, panel filter kategori, dan mode rute transit agar fokus spotlight bersih
  // - Buka legenda otomatis pada langkah 7/9
  if (activeTourStep !== prevTourStep) {
    setPrevTourStep(activeTourStep)
    if (activeTourStep !== null && activeTourStep !== undefined) {
      if (selectedFacility) setSelectedFacility(null)
      if (activeCategoryFilter) setActiveCategoryFilter(null)
      if (isTransitMode) setIsTransitMode(false)
      if (!isTransitPanelCollapsed) setIsTransitPanelCollapsed(true)
      if (focusedCorridorId) setFocusedCorridorId(null)
    }
    if (activeTourStep === 7 || activeTourStep === 9) {
      setIsLegendOpen(true)
    } else if (activeTourStep !== null && activeTourStep !== undefined) {
      setIsLegendOpen(false)
    }
  }
  const [mobileMapTab, setMobileMapTab] = useState<MobileMapTab>('explore')
  const [mobileOverlayHeight, setMobileOverlayHeight] = useState(0)
  const [isMapReady, setIsMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)

  const handleMapReady = useCallback(() => {
    setIsMapReady(true)
    setMapError(false)
  }, [])

  // 2. Sub-filter States
  const [faskesSubFilter, setFaskesSubFilter] = useState<FaskesSubFilter>('all')
  const [rthSubFilter, setRthSubFilter] = useState<RthSubFilter>('all')
  const [schoolSubFilter, setSchoolSubFilter] = useState<SchoolSubFilter>('all')

  const [summaryData, setSummaryData] = useState<FacilitiesSummary | null>(null)

  const fetchSummary = useCallback(() => {
    const controller = new AbortController()
    getFacilitiesSummary(controller.signal)
      .then((data) => {
        setSummaryData(data)
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted && !isAbortError(err)) {
          // Non-blocking fallback
        }
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    return fetchSummary()
  }, [fetchSummary])

  useApiRetry(fetchSummary)

  const isAll = activeWilayah === 'ALL'

  const handleSelectWilayah = useCallback(
    (wilayah: string) => {
      if (propOnSelectWilayah) {
        propOnSelectWilayah(wilayah)
      } else {
        setInternalWilayah(wilayah)
      }

      const target = WILAYAH_COORDINATES[wilayah] ?? WILAYAH_COORDINATES.ALL
      setFocusCoords(target.center)
      setFocusZoom(target.zoom)
    },
    [propOnSelectWilayah]
  )

  // Header dan klik poligon dapat mengganti wilayah lewat jalur state yang
  // berbeda. Sinkronkan semua filter turunan di satu tempat agar marker,
  // hitungan, dan panel kategori tidak membawa state wilayah sebelumnya.
  useEffect(() => {
    const resetRegionState = window.setTimeout(() => {
      setSelectedFacility(null)
      setFocusedCorridorId(null)
      setFaskesSubFilter('all')
      setRthSubFilter('all')
      setSchoolSubFilter('all')
      const target = WILAYAH_COORDINATES[activeWilayah] ?? WILAYAH_COORDINATES.ALL
      setFocusCoords(target.center)
      setFocusZoom(target.zoom)
    }, 0)

    return () => window.clearTimeout(resetRegionState)
  }, [activeWilayah])

  const cityAggregate = useMemo(() => {
    return CITY_AGGREGATES.find((c) => c.code === activeWilayah) ?? null
  }, [activeWilayah])

  const scopeLabel = cityAggregate
    ? language === 'en'
      ? cityAggregate.nameEn
      : cityAggregate.name
    : language === 'en'
      ? 'All DKI Jakarta'
      : 'DKI Jakarta'
  const corridorCount = cityAggregate ? cityAggregate.corridors.length : 13

  const availableCorridors = useMemo(() => {
    if (!cityAggregate) return TRANSJAKARTA_CORRIDORS
    return TRANSJAKARTA_CORRIDORS.filter((c) =>
      cityAggregate.corridors.includes(c.koridorCode)
    )
  }, [cityAggregate])

  const provinceFacilityCategory = isAll
    ? activeCategoryFilter === 'kesehatan'
      ? 'kesehatan'
      : activeCategoryFilter === 'rth'
        ? 'fasum'
        : undefined
    : undefined

  const {
    facilities,
    status: facilitiesStatus,
    error: facilitiesError,
    refetch: refetchFacilities,
  } = useFacilities({
    wilayah: activeWilayah === 'ALL' ? undefined : activeWilayah,
    category: provinceFacilityCategory,
    limit: 250,
  })

  const activeCitySummary = useMemo(() => {
    if (isAll || !summaryData?.byWilayah) return null
    return summaryData.byWilayah[activeWilayah] ?? null
  }, [isAll, summaryData, activeWilayah])

  // Hitung jumlah faskes & RTH di wilayah aktif
  const faskesCounts = useMemo(() => {
    if (isAll) {
      return (
        summaryData?.totals.faskesBreakdown ?? {
          total: summaryData?.totals.kesehatan ?? 51,
          rsud: 26,
          puskesmas: 24,
        }
      )
    }

    if (facilities.length > 0) {
      const list = facilities.filter((f) => f.category === 'kesehatan')
      const rsud = list.filter((f) => f.subCategory?.toLowerCase().includes('rumah sakit')).length
      const puskesmas = list.filter((f) => f.subCategory?.toLowerCase().includes('puskesmas')).length
      return { total: list.length, rsud, puskesmas }
    }

    if (activeCitySummary?.faskesBreakdown) {
      return activeCitySummary.faskesBreakdown
    }

    return {
      total: activeCitySummary?.kesehatan ?? 0,
      rsud: 0,
      puskesmas: 0,
    }
  }, [isAll, summaryData, facilities, activeCitySummary])

  const rthCounts = useMemo(() => {
    if (isAll) {
      return (
        summaryData?.totals.rthBreakdown ?? {
          total: summaryData?.totals.rth ?? 34,
          taman: 26,
          hutan: 8,
        }
      )
    }

    if (facilities.length > 0) {
      const list = facilities.filter((f) => f.category === 'fasum')
      const hutan = list.filter(
        (f) => f.subCategory?.toLowerCase().includes('hutan') || f.name.toLowerCase().includes('hutan')
      ).length
      const taman = list.length - hutan
      return { total: list.length, taman, hutan }
    }

    if (activeCitySummary?.rthBreakdown) {
      return activeCitySummary.rthBreakdown
    }

    return {
      total: activeCitySummary?.rth ?? 0,
      taman: 0,
      hutan: 0,
    }
  }, [isAll, summaryData, facilities, activeCitySummary])

  const activeSchoolBreakdown = isAll
    ? summaryData?.totals.schoolBreakdown
    : activeCitySummary?.schoolBreakdown

  const {
    schoolCounts,
    schoolsInWilayah,
    status: schoolsStatus,
    error: schoolsError,
    refetch: refetchSchools,
  } = useSchoolsData(activeWilayah, activeSchoolBreakdown, activeCategoryFilter === 'sekolah')

  const synchronizedDockCounts = useMemo(() => {
    if (isAll) {
      const macroFaskes = summaryData?.totals.kesehatan ?? 51
      const macroFaskesBreakdown = summaryData?.totals.faskesBreakdown
      const macroRth = summaryData?.totals.rth ?? 34
      const macroRthBreakdown = summaryData?.totals.rthBreakdown
      const macroSchool = summaryData?.totals.sekolah ?? 1503
      const macroSchoolBreakdown = summaryData?.totals.schoolBreakdown

      return {
        faskes:
          activeCategoryFilter === 'kesehatan'
            ? faskesSubFilter === 'rsud'
              ? (macroFaskesBreakdown?.rsud ?? 26)
              : faskesSubFilter === 'puskesmas'
                ? (macroFaskesBreakdown?.puskesmas ?? 24)
                : macroFaskes
            : macroFaskes,
        rth:
          activeCategoryFilter === 'rth'
            ? rthSubFilter === 'taman'
              ? (macroRthBreakdown?.taman ?? 26)
              : rthSubFilter === 'hutan'
                ? (macroRthBreakdown?.hutan ?? 8)
                : macroRth
            : macroRth,
        school:
          activeCategoryFilter === 'sekolah'
            ? schoolSubFilter === 'sma'
              ? (macroSchoolBreakdown?.sma ?? 117)
              : schoolSubFilter === 'smp'
                ? (macroSchoolBreakdown?.smp ?? 289)
                : schoolSubFilter === 'sd'
                  ? (macroSchoolBreakdown?.sd ?? 1097)
                  : macroSchool
            : macroSchool,
      }
    }

    return {
      faskes:
        activeCategoryFilter === 'kesehatan'
          ? faskesSubFilter === 'rsud'
            ? faskesCounts.rsud
            : faskesSubFilter === 'puskesmas'
              ? faskesCounts.puskesmas
              : faskesCounts.total
          : faskesCounts.total,
      rth:
        activeCategoryFilter === 'rth'
          ? rthSubFilter === 'taman'
            ? rthCounts.taman
            : rthSubFilter === 'hutan'
              ? rthCounts.hutan
              : rthCounts.total
          : rthCounts.total,
      school:
        activeCategoryFilter === 'sekolah'
          ? schoolSubFilter === 'sma'
            ? schoolCounts.sma
            : schoolSubFilter === 'smp'
              ? schoolCounts.smp
              : schoolSubFilter === 'sd'
                ? schoolCounts.sd
                : schoolCounts.total
          : schoolCounts.total,
    }
  }, [
    isAll,
    summaryData,
    activeCategoryFilter,
    faskesCounts,
    faskesSubFilter,
    rthCounts,
    rthSubFilter,
    schoolCounts,
    schoolSubFilter,
  ])

  // Filter Fasilitas Dinamis Berdasarkan activeCategoryFilter & Sub-filter
  const combinedFacilities = useMemo(() => {
    // Level provinsi hanya mengambil marker ketika satu kategori dipilih.
    // Tampilan awal tetap memakai ringkasan kota agar tidak terlalu padat.
    if (isAll && !activeCategoryFilter) {
      return []
    }

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
  }, [isAll, facilities, schoolsInWilayah, activeCategoryFilter, faskesSubFilter, rthSubFilter, schoolSubFilter])

  const {
    data: realtimeAirQuality,
    status: airQualityStatus,
    isLive: isAirLive,
  } = useRealtimeAirQuality(activeWilayah)

  // Saat marker fasilitas diklik: buka tooltip pratinjau
  const handleMarkerClick = useCallback(
    (facility: FacilityItem) => {
      setSelectedFacility(facility)
      // Fokus fasilitas tidak boleh mewarisi zoom wilayah/rute sebelumnya.
      // `null` membuat peta mempertahankan zoom dekat yang sudah aktif atau
      // mendekat ke zoom minimum fasilitas di InteractiveMap.
      setFocusZoom(null)
      setFocusCoords([facility.lng, facility.lat])
    },
    []
  )


  const handleToggleShowTransit = useCallback(() => {
    setIsLegendOpen(false)
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
    setIsLegendOpen(false)
    setActiveCategoryFilter((prev) => (prev === category ? null : category))
  }, [])

  const activeCategoryLabel = activeCategoryFilter === 'air'
    ? t('mapFirst.dock.water')
    : activeCategoryFilter === 'kesehatan'
      ? t('mapFirst.dock.health')
      : activeCategoryFilter === 'rth'
        ? t('mapFirst.dock.green')
        : activeCategoryFilter === 'sekolah'
          ? t('mapFirst.dock.school')
          : activeCategoryFilter === 'transum'
            ? t('mapFirst.dock.transit')
            : ''

  // Visibilitas Layer Berdasarkan Filter Solo
  const isTransitVisible = activeCategoryFilter === null || activeCategoryFilter === 'transum'
  const isWaterVisible = showWaterNetwork && (activeCategoryFilter === null || activeCategoryFilter === 'air')
  const usesFacilityMarkers = activeCategoryFilter !== 'transum' && activeCategoryFilter !== 'air'
  const markerDataIsLoading = usesFacilityMarkers && (activeCategoryFilter === 'sekolah'
    ? schoolsStatus === 'loading'
    : facilitiesStatus === 'loading')
  const markerScopeUsesData = !isAll || Boolean(activeCategoryFilter)
  const markerDataError = markerScopeUsesData && usesFacilityMarkers
    ? (activeCategoryFilter === 'sekolah' ? schoolsError : facilitiesError)
    : null
  const markerDataHasError = markerDataError !== null
  const markerDataIsEmpty =
    markerScopeUsesData && usesFacilityMarkers && !markerDataIsLoading && !markerDataHasError && combinedFacilities.length === 0
  const refetchMarkerData = activeCategoryFilter === 'sekolah' ? refetchSchools : refetchFacilities
  const mobileAirStatus = language === 'id'
    ? realtimeAirQuality?.category ?? 'Belum tersedia'
    : ({
        Baik: 'Good',
        Sedang: 'Moderate',
        'Tidak Sehat (Sensitif)': 'Sensitive',
        'Tidak Sehat': 'Unhealthy',
        'Sangat Tidak Sehat': 'Very unhealthy',
        Berbahaya: 'Hazardous',
      }[realtimeAirQuality?.category ?? ''] ?? 'Unavailable')

  // Progressive map mount: tunda inisialisasi context WebGL MapLibre
  // agar main-thread browser dapat menyelesaikan initial layout dan render frame pertama (FCP/LCP)
  // tanpa terblokir (memangkas Total Blocking Time / TBT secara drastis).
  const [shouldMountMap, setShouldMountMap] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if ('requestIdleCallback' in window) {
      const handle = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
        () => setShouldMountMap(true),
        { timeout: 350 },
      )
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(handle)
        }
      }
    }

    const timer = setTimeout(() => setShouldMountMap(true), 200)
    return () => clearTimeout(timer)
  }, [])

  const mapFallback = (
    <div
      className="flex h-full w-full items-center justify-center bg-surface-muted"
      role="status"
      aria-label={t('mapFirst.loading.map')}
    >
      <div className="w-full max-w-sm space-y-3 px-6">
        <Skeleton className="mx-auto h-4 w-40 rounded-full" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <span className="sr-only">{t('mapFirst.loading.map')}</span>
      </div>
    </div>
  )

  return (
    <div className="relative h-full w-full overflow-hidden bg-surface-muted select-none">
      {/* 1. Base Layer: Full-Screen Interactive Map Canvas */}
      {shouldMountMap ? (
        <Suspense fallback={mapFallback}>
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
            activeCategory={activeCategoryFilter}
            selectedWilayah={activeWilayah}
            onSelectWilayah={handleSelectWilayah}
            focusedCorridorId={focusedCorridorId}
            onSelectCorridor={setFocusedCorridorId}
            onMapError={() => setMapError(true)}
            onReady={handleMapReady}
            mobileControlsBottomOffset={mobileOverlayHeight + 12}
          />
        </Suspense>
      ) : (
        mapFallback
      )}

      {mapError && !isMapReady ? (
        <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-surface-muted/82 p-4 backdrop-blur-sm" role="alert">
          <div className="luma-map-card w-full max-w-sm rounded-2xl p-5 text-center">
            <p className="text-sm font-bold text-foreground">{t('mapFirst.map.errorTitle')}</p>
            <p className="mt-1 text-xs text-muted">{t('mapFirst.map.errorDescription')}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t('common.retry')}
            </button>
          </div>
        </div>
      ) : null}

      {/* Feedback data peta: loading, error, dan hasil kosong. */}
      <div
        className="luma-map-feedback pointer-events-none absolute inset-x-3 top-1/2 z-40 mx-auto max-w-[280px] -translate-y-1/2 sm:max-w-sm"
        aria-live="polite"
      >
        {markerDataIsEmpty && isMapReady ? (
          <EmptyState
            title={t('mapFirst.empty.title')}
            description={t('mapFirst.empty.description')}
            className="pointer-events-auto rounded-2xl border border-dashed border-border bg-surface/90 px-5 py-6 text-center shadow-xl backdrop-blur-lg"
          />
        ) : null}
      </div>


      {/* 3. Panel Kolom Kiri: Sumber Data Resmi, Kualitas Udara, dan Contextual Filter / Legenda */}
      {!isTransitMode && (
        <aside className="luma-map-stack pointer-events-none absolute left-2 right-2 top-2 z-30 -mt-2 flex max-h-[calc(100dvh-8.75rem)] flex-col items-center gap-2 overflow-y-auto overscroll-contain pb-3 pt-2 scrollbar-none sm:left-4 sm:right-auto sm:top-4 sm:mt-0 sm:items-start sm:max-h-[calc(100dvh-8.5rem)] sm:pb-2 sm:pr-1 sm:pt-0">
          <div className="hidden sm:contents">
            <CompactDataSourceCard onNavigateToDataSources={onNavigateToDataSources} />
          </div>
          <div className="hidden sm:contents">
            <AirQualityCard
              airAqi={realtimeAirQuality?.aqi ?? null}
              isAirLive={isAirLive}
              status={airQualityStatus}
              source={realtimeAirQuality?.source}
              updatedAt={realtimeAirQuality?.updatedAt}
            />
          </div>

          {!selectedFacility ? (
            <div className="pointer-events-auto w-full max-w-[360px] sm:hidden">
              <KpiMetricsDock
                waterCoverage={68}
                waterCoverageLabel={t('mapFirst.dock.access')}
                isWaterActive={showWaterNetwork}
                faskesCount={facilitiesStatus === 'loading' || facilitiesStatus === 'error' ? null : synchronizedDockCounts.faskes}
                rthCount={facilitiesStatus === 'loading' || facilitiesStatus === 'error' ? null : synchronizedDockCounts.rth}
                schoolCount={schoolsStatus === 'loading' || schoolsStatus === 'error' ? null : synchronizedDockCounts.school}
                transitCorridorCount={corridorCount}
                activeCategory={activeCategoryFilter}
                onFilterCategory={handleDockCategoryClick}
              />
            </div>
          ) : null}

          {/* Legenda tetap tersedia sebagai dropdown compact. */}
          <div data-dashboard="legend-dropdown" className="hidden sm:block">
            <StaticMapLegend isOpen={isLegendOpen} onOpenChange={setIsLegendOpen} />
          </div>

          {/* Hanya satu panel panjang yang dibuka agar kolom kiri tidak bertabrakan. */}
          {!selectedFacility && activeCategoryFilter && !isLegendOpen && !activeTourStep ? (
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
              hasDataError={markerDataHasError}
              onRetry={refetchMarkerData}
              onClose={() => setActiveCategoryFilter(null)}
            />
          ) : !selectedFacility && activeCategoryFilter ? (
            <button
              type="button"
              onClick={() => setIsLegendOpen(false)}
              className="pointer-events-auto flex w-full max-w-[360px] items-center justify-between rounded-xl luma-map-card luma-glass-hover luma-no-lift px-3 py-2.5 text-left transition sm:w-[280px] sm:px-3.5"
            >
              <span className="min-w-0 truncate text-[11px] font-semibold text-foreground">
                {language === 'id' ? `Filter ${activeCategoryLabel} aktif` : `${activeCategoryLabel} filter active`}
              </span>
              <span className="shrink-0 text-[10px] font-semibold text-primary">
                {language === 'id' ? 'Tampilkan' : 'Show'}
              </span>
            </button>
          ) : null}
        </aside>
      )}

      {/* 4. Bottom Center — Horizontal KPI Metrics Overview Dock & Filter Controller (Selalu Tampil) */}
      {!isTransitMode && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 hidden max-w-[calc(100vw-1.5rem)] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-3 duration-300 sm:block lg:left-[calc(50%+4rem)]">
          <KpiMetricsDock
            waterCoverage={68}
            waterCoverageLabel={t('mapFirst.dock.access')}
            isWaterActive={showWaterNetwork}
            faskesCount={
              isAll
                ? synchronizedDockCounts.faskes
                : facilitiesStatus === 'loading'
                  ? (activeCitySummary?.kesehatan ?? null)
                  : facilitiesStatus === 'error'
                    ? null
                    : synchronizedDockCounts.faskes
            }
            rthCount={
              isAll
                ? synchronizedDockCounts.rth
                : facilitiesStatus === 'loading'
                  ? (activeCitySummary?.rth ?? null)
                  : facilitiesStatus === 'error'
                    ? null
                    : synchronizedDockCounts.rth
            }
            schoolCount={
              isAll
                ? synchronizedDockCounts.school
                : schoolsStatus === 'loading'
                  ? (activeCitySummary?.sekolah ?? null)
                  : schoolsStatus === 'error'
                    ? null
                    : synchronizedDockCounts.school
            }
            transitCorridorCount={corridorCount}
            activeCategory={activeCategoryFilter}
            onFilterCategory={handleDockCategoryClick}
          />
        </div>
      )}

      {/* Mode Transum Khusus (jika dibuka dari panel rute) */}
      {isTransitMode && !activeTourStep && (
        <div className="pointer-events-none absolute top-16 left-3 sm:top-16 sm:left-4 z-20 animate-in fade-in slide-in-from-left-4 duration-300">
          <Suspense fallback={null}>
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
          </Suspense>
        </div>
      )}

      {!isTransitMode && !selectedFacility ? (
        <MobileMapBottomSheet
          key={activeWilayah}
          activeTab={mobileMapTab}
          onTabChange={setMobileMapTab}
          scopeLabel={scopeLabel}
          airAqi={realtimeAirQuality?.aqi ?? null}
          airStatus={mobileAirStatus}
          isAirLive={isAirLive}
          canExpandRegion={activeWilayah !== 'ALL'}
          onNavigateToDataSources={onNavigateToDataSources}
          onHeightChange={setMobileOverlayHeight}
        />
      ) : null}

      {/* Modal Detail Fasilitas Glass (Muncul langsung di Kanan saat marker diklik) */}
      {selectedFacility && !isTransitMode && !activeTourStep && (
        <Suspense fallback={null}>
          <FacilityDetailModal
            facility={selectedFacility}
            regionalAirQuality={realtimeAirQuality}
            isOpen={Boolean(selectedFacility)}
            onClose={() => setSelectedFacility(null)}
            variant="side-glass"
            onMobileHeightChange={setMobileOverlayHeight}
          />
        </Suspense>
      )}
    </div>
  )
}
