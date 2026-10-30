import { useState, useCallback, useMemo } from 'react'
import { InteractiveMap } from '../../../components/ui/InteractiveMap'
import { RegionalIndicatorCard } from './RegionalIndicatorCard'
import { FacilityDetailModal } from './FacilityDetailModal'
import { TransitRoutesWidget } from './TransitRoutesWidget'
import { useFacilities } from '../hooks/useFacilities'
import { useIndicators } from '../hooks/useIndicators'
import { useOverview } from '../hooks/useOverview'
import { useTranslation } from '../../../i18n/useTranslation'
import { buildKpis } from '../kpiMapping'
import type { FacilityItem } from '../types/facility.types'

const WILAYAH_COORDINATES: Record<string, { center: [number, number]; zoom: number }> = {
  ALL: { center: [106.8272, -6.185], zoom: 11.6 },
  'JAKARTA PUSAT': { center: [106.8341, -6.1805], zoom: 13.0 },
  'JAKARTA UTARA': { center: [106.8926, -6.1214], zoom: 12.6 },
  'JAKARTA BARAT': { center: [106.7589, -6.1683], zoom: 12.6 },
  'JAKARTA SELATAN': { center: [106.8097, -6.2615], zoom: 12.6 },
  'JAKARTA TIMUR': { center: [106.9004, -6.225], zoom: 12.6 },
  'KEP. SERIBU': { center: [106.5615, -5.6122], zoom: 11.0 },
}

export function FullScreenMapDashboard() {
  const { t, language } = useTranslation()
  const [activeWilayah, setActiveWilayah] = useState<string>('ALL')
  const [selectedFacility, setSelectedFacility] = useState<FacilityItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)
  const [focusCoords, setFocusCoords] = useState<[number, number] | null>(null)
  const [focusZoom, setFocusZoom] = useState<number | null>(null)
  const [showTransit, setShowTransit] = useState<boolean>(true)
  const activeTransitModes = useMemo(() => ['transjakarta'], [])

  const indicators = useIndicators()
  const overview = useOverview()
  const { facilities } = useFacilities({
    wilayah: activeWilayah === 'ALL' ? undefined : activeWilayah,
  })

  const currentIndicator = useMemo(() => {
    if (!indicators.lookup) return null
    return indicators.lookup[activeWilayah] ?? indicators.lookup['ALL'] ?? null
  }, [indicators.lookup, activeWilayah])

  const kpis = useMemo(() => {
    if (indicators.status !== 'success' || overview.status !== 'success') return null
    const selectedCode = activeWilayah === 'ALL' ? null : activeWilayah
    return buildKpis({
      t,
      language,
      selectedCode,
      indicator: currentIndicator,
      overview: overview.data,
      overviewStatus: overview.status,
    })
  }, [t, language, indicators.status, overview.status, overview.data, currentIndicator, activeWilayah])

  const handleSelectWilayah = useCallback((wilayah: string) => {
    setActiveWilayah(wilayah)
    if (wilayah === 'ALL') {
      setSelectedFacility(null)
    }
    const target = WILAYAH_COORDINATES[wilayah] ?? WILAYAH_COORDINATES['ALL']
    setFocusCoords(target.center)
    setFocusZoom(target.zoom)
  }, [])

  const handleSelectFacility = useCallback((facility: FacilityItem) => {
    setSelectedFacility(facility)
    setFocusCoords([facility.lng, facility.lat])
    setFocusZoom(15)
    setIsDetailModalOpen(true)
  }, [])

  const handleMarkerClick = useCallback((facility: FacilityItem) => {
    setSelectedFacility(facility)
  }, [])

  const handleToggleShowTransit = useCallback(() => {
    setShowTransit((prev) => !prev)
  }, [])

  const handleFocusRoute = useCallback((center: [number, number], zoom: number) => {
    setFocusCoords(center)
    setFocusZoom(zoom)
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-surface-muted">
      {/* 1. Base Layer: Full-Screen Interactive Map Canvas (Clean Esri Canvas) */}
      <InteractiveMap
        height="100%"
        className="h-full w-full"
        facilities={facilities}
        selectedFacilityId={selectedFacility?.id}
        onSelectFacility={handleMarkerClick}
        onOpenDetail={handleSelectFacility}
        focusCoords={focusCoords}
        focusZoom={focusZoom}
        showTransit={showTransit}
        activeTransitModes={activeTransitModes}
        selectedWilayah={activeWilayah}
        onSelectWilayah={handleSelectWilayah}
      />

      {/* Floating Breadcrumb Pill saat berada di Layer 2 (Per-Kota) */}
      {activeWilayah !== 'ALL' && (
        <div className="pointer-events-auto absolute top-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 rounded-full border border-border bg-surface/95 px-4 py-1.5 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 duration-300">
          <button
            type="button"
            onClick={() => handleSelectWilayah('ALL')}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <span className="text-sm leading-none font-extrabold">‹</span>
            <span>Kembali ke Seluruh DKI Jakarta</span>
          </button>
          <span className="text-border">|</span>
          <span className="text-xs font-semibold text-foreground">
            {activeWilayah}
          </span>
        </div>
      )}

      {/* 2. Left Floating Compact Regional Indicator Card */}
      <div className="pointer-events-none absolute top-3 left-3 sm:top-4 sm:left-4 z-20">
        <RegionalIndicatorCard
          kpis={kpis}
          activeWilayah={activeWilayah}
          onSelectWilayah={handleSelectWilayah}
          loading={indicators.status === 'loading' || overview.status === 'loading'}
        />
      </div>

      {/* 3. Left Bottom Floating Transit Routes Widget */}
      <div className="pointer-events-none absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20">
        <TransitRoutesWidget
          showTransit={showTransit}
          onToggleShowTransit={handleToggleShowTransit}
          onFocusRoute={handleFocusRoute}
        />
      </div>

      {/* 4. Reusable Detail Modal for Facility Details */}
      <FacilityDetailModal
        facility={selectedFacility}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  )
}
