import { useMemo, useRef, useState, useEffect, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { ErrorBanner } from '../../../components/ui/ErrorBanner'
import { Modal } from '../../../components/ui/Modal'
import { Skeleton } from '../../../components/ui/Skeleton'
import type { Facility } from '../../../lib/api'
import type { FacilityItem } from '../types/facility.types'
import { useFacilityDetail } from '../hooks/useFacilityDetail'
import { useTranslation } from '../../../i18n/useTranslation'
import { getDataCatalogEntry, type DataCatalogEntry } from '../../../data/data-catalog'
import type { Language } from '../../../i18n/dictionaries'
import type { RealtimeAirQuality } from '../hooks/useRealtimeAirQuality'
import { AQI_LEVELS, getAqiLevel } from '../utils/airQualityLevels'

const AQI_CATEGORY_KEYS = [
  'mapFirst.air.good',
  'mapFirst.air.moderate',
  'mapFirst.air.sensitive',
  'mapFirst.air.unhealthy',
  'mapFirst.air.veryUnhealthy',
  'mapFirst.air.hazardous',
] as const

interface FacilityDetailModalProps {
  facilityId?: string | null
  facility?: FacilityItem | Facility | null
  isOpen?: boolean
  onClose: () => void
  variant?: 'center' | 'side-glass'
  regionalAirQuality?: RealtimeAirQuality | null
  onMobileHeightChange?: (height: number) => void
}

type FacilityDetailTab = 'overview' | 'specs' | 'budget'

function formatMetadataDate(value: string, language: 'id' | 'en'): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
    dateStyle: 'medium',
  }).format(date)
}

function catalogForFacility(category: string | null | undefined, language: Language): DataCatalogEntry | null {
  switch (category?.toLowerCase()) {
    case 'kesehatan': return getDataCatalogEntry('kesehatan', language)
    case 'fasum': return getDataCatalogEntry('rth', language)
    case 'pendidikan': return getDataCatalogEntry('sekolah', language)
    case 'transum': return getDataCatalogEntry('transum', language)
    case 'lingkungan': return getDataCatalogEntry('airQuality', language)
    default: return null
  }
}

function getGoogleMapsUrl(facility: Facility): string | null {
  const latitude = Number(facility.lat)
  const longitude = Number(facility.lng)
  const query = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? `${latitude},${longitude}`
    : [facility.name, facility.address, facility.wilayah].filter(Boolean).join(', ')

  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null
}

export function FacilityDetailModal({
  facilityId,
  facility: propFacility,
  isOpen,
  onClose,
  variant = 'center',
  regionalAirQuality,
  onMobileHeightChange,
}: FacilityDetailModalProps) {
  const { language, t } = useTranslation()
  const copy = language === 'id'
    ? {
        environment: 'Kondisi Lingkungan & Akses', airQuality: 'Kualitas Udara',
        scale: 'Skala 1.0 – 5.0', transit: 'Akses Transit', budget: 'Transparansi Realisasi Anggaran',
        totalBudget: 'Total Anggaran Dialokasikan', funding: 'Sumber Pendanaan', year: 'Tahun Anggaran',
        contractor: 'Pelaksana / Kontraktor', status: 'Status Operasional', specifications: 'Spesifikasi & Fasilitas',
        documents: 'Dokumen Keterbukaan Publik', publicDocument: 'Dokumen Publik', department: 'Dinas Terkait',
        download: 'Unduh', downloadTitle: 'Unduh berkas dokumen', detail: 'Detail fasilitas',
        panelAria: 'Detail Fasilitas', close: 'Tutup detail fasilitas', loading: 'Memuat detail fasilitas',
        loadingDescription: 'Memuat informasi fasilitas dari server…',
        dataInfo: 'Informasi Data', source: 'Sumber', coverage: 'Cakupan', unit: 'Satuan', method: 'Metode',
        period: 'Periode', updated: 'Diperbarui',
        unavailable: 'Sebagian metadata belum dicantumkan oleh sumber.',
        moreDetails: 'Detail lainnya', budgetShort: 'Anggaran', sourceShort: 'Sumber data',
        facilitiesShort: 'Fasilitas & layanan', documentsShort: 'Dokumen publik',
        regionalAirQuality: 'Kualitas udara wilayah', regionalStation: 'Acuan wilayah',
        openMaps: 'Buka di Google Maps', openMapsTitle: 'Buka lokasi fasilitas di Google Maps',
        directions: 'Petunjuk Arah', overviewTab: 'Ringkasan', specsTab: 'Fasilitas', budgetTab: 'Anggaran',
        accreditation: 'Akreditasi', emptySpecs: 'Data spesifikasi belum tersedia.',
        emptyBudget: 'Data anggaran belum tersedia.', emptyDocs: 'Dokumen publik belum tersedia.',
        resizeSheet: 'Tarik untuk mengatur tinggi panel detail',
      }
    : {
        environment: 'Environment & Access', airQuality: 'Air Quality',
        scale: 'Scale 1.0 – 5.0', transit: 'Transit Access', budget: 'Budget Realization Transparency',
        totalBudget: 'Total Allocated Budget', funding: 'Funding Source', year: 'Budget Year',
        contractor: 'Implementer / Contractor', status: 'Operational Status', specifications: 'Specifications & Facilities',
        documents: 'Public Disclosure Documents', publicDocument: 'Public Document', department: 'Relevant Agency',
        download: 'Download', downloadTitle: 'Download document', detail: 'Facility details',
        panelAria: 'Facility Details', close: 'Close facility details', loading: 'Loading facility details',
        loadingDescription: 'Loading facility information from the server…',
        dataInfo: 'Data Information', source: 'Source', coverage: 'Coverage', unit: 'Unit', method: 'Method',
        period: 'Period', updated: 'Updated',
        unavailable: 'Some metadata was not provided by the source.',
        moreDetails: 'More details', budgetShort: 'Budget', sourceShort: 'Data source',
        facilitiesShort: 'Facilities & services', documentsShort: 'Public documents',
        regionalAirQuality: 'Regional air quality', regionalStation: 'Regional reference',
        openMaps: 'Open in Google Maps', openMapsTitle: 'Open the facility location in Google Maps',
        directions: 'Directions', overviewTab: 'Overview', specsTab: 'Facilities', budgetTab: 'Budget',
        accreditation: 'Accreditation', emptySpecs: 'Specification data is not available yet.',
        emptyBudget: 'Budget data is not available yet.', emptyDocs: 'Public documents are not available yet.',
        resizeSheet: 'Drag to resize the detail panel',
      }

  // If facilityId is passed (e.g. from page.tsx), load it via hook
  const detail = useFacilityDetail(facilityId ?? null)

  const activeFacility = propFacility ?? detail.data
  const modalOpen =
    isOpen !== undefined
      ? isOpen
      : Boolean(propFacility) || (facilityId !== null && facilityId !== undefined)

  // Pola React resmi: sinkronisasi state saat prop berubah tanpa useEffect
  const [prevFacility, setPrevFacility] = useState<FacilityItem | Facility | null>(activeFacility)
  const [cachedFacility, setCachedFacility] = useState<FacilityItem | Facility | null>(activeFacility)
  const [activeTab, setActiveTab] = useState<FacilityDetailTab>('overview')
  const [mobileSheetHeight, setMobileSheetHeight] = useState<number | null>(null)
  const [isDraggingSheet, setIsDraggingSheet] = useState(false)
  const sheetDragRef = useRef({ startY: 0, startHeight: 0 })
  const sheetRef = useRef<HTMLElement | null>(null)
  const sheetBodyRef = useRef<HTMLDivElement | null>(null)
  const sheetBodyContentRef = useRef<HTMLDivElement | null>(null)

  if (activeFacility !== prevFacility) {
    setPrevFacility(activeFacility)
    if (activeFacility) {
      setCachedFacility(activeFacility)
      setActiveTab('overview')
      setMobileSheetHeight(null)
    }
  }

  const displayFacility = activeFacility ?? cachedFacility

  const getMaximumSheetHeight = () => {
    const viewportMaximum = window.innerHeight * 0.72
    const minimum = window.innerHeight * 0.28
    const sheet = sheetRef.current
    const body = sheetBodyRef.current
    const bodyContent = sheetBodyContentRef.current
    if (!sheet || !body || !bodyContent) return viewportMaximum

    const fixedHeight = Array.from(sheet.children).reduce((total, child) => {
      if (child === body) return total
      return total + (child as HTMLElement).offsetHeight
    }, 0)
    const contentHeight = fixedHeight + bodyContent.scrollHeight + 4
    return Math.min(viewportMaximum, Math.max(minimum, contentHeight))
  }

  const handleSheetPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const sheet = event.currentTarget.parentElement
    if (!sheet) return
    event.currentTarget.setPointerCapture(event.pointerId)
    sheetDragRef.current = {
      startY: event.clientY,
      startHeight: sheet.getBoundingClientRect().height,
    }
    setIsDraggingSheet(true)
  }

  const handleSheetPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingSheet) return
    const minHeight = window.innerHeight * 0.28
    const maxHeight = getMaximumSheetHeight()
    const nextHeight = sheetDragRef.current.startHeight + sheetDragRef.current.startY - event.clientY
    setMobileSheetHeight(Math.min(maxHeight, Math.max(minHeight, nextHeight)))
  }

  const finishSheetDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingSheet) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const currentHeight = mobileSheetHeight ?? sheetDragRef.current.startHeight
    const minHeight = window.innerHeight * 0.28
    const maxHeight = getMaximumSheetHeight()
    const snapPoints = [minHeight, Math.min(window.innerHeight * 0.48, maxHeight), maxHeight]
    const nearest = snapPoints.reduce((best, point) =>
      Math.abs(point - currentHeight) < Math.abs(best - currentHeight) ? point : best,
    )
    setMobileSheetHeight(nearest)
    setIsDraggingSheet(false)
  }

  // Keyboard shortcut: Esc to close side-glass modal
  useEffect(() => {
    if (variant !== 'side-glass' || !modalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [variant, modalOpen, onClose])

  useEffect(() => {
    const sheet = sheetRef.current
    if (variant !== 'side-glass' || !modalOpen || !sheet || !onMobileHeightChange) return

    const reportHeight = () => {
      onMobileHeightChange(window.innerWidth < 640 ? sheet.getBoundingClientRect().height : 0)
    }
    reportHeight()
    const observer = new ResizeObserver(reportHeight)
    observer.observe(sheet)
    window.addEventListener('resize', reportHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', reportHeight)
      onMobileHeightChange(0)
    }
  }, [variant, modalOpen, onMobileHeightChange])

  // Normalisasi spesifikasi fasilitas baik format object Record maupun Array relasional [{ specKey, specValue }]
  const specs = useMemo<Record<string, string>>(() => {
    const raw = displayFacility?.specs
    if (!raw) return {}
    if (Array.isArray(raw)) {
      const res: Record<string, string> = {}
      for (const item of raw) {
        if (item && typeof item === 'object') {
          const spec = item as Record<string, unknown>
          const k = spec.specKey ?? spec.spec_key ?? spec.key
          const v = spec.specValue ?? spec.spec_value ?? spec.value
          if (k && v !== undefined && v !== null) {
            res[String(k)] = String(v)
          }
        }
      }
      return res
    }
    if (typeof raw === 'object') {
      const res: Record<string, string> = {}
      for (const [k, v] of Object.entries(raw)) {
        if (v !== undefined && v !== null && typeof v !== 'object') {
          res[k] = String(v)
        }
      }
      return res
    }
    return {}
  }, [displayFacility?.specs])

  if (!modalOpen && !displayFacility) {
    return null
  }

  const googleMapsUrl = displayFacility ? getGoogleMapsUrl(displayFacility) : null
  const coordinateLabel = displayFacility && Number.isFinite(displayFacility.lat) && Number.isFinite(displayFacility.lng)
    ? `GPS: ${displayFacility.lat.toFixed(4)}, ${displayFacility.lng.toFixed(4)}`
    : null

  const docs = displayFacility
    ? ('documents' in displayFacility && Array.isArray(displayFacility.documents)
        ? displayFacility.documents
        : ('docs' in displayFacility && Array.isArray(displayFacility.docs) ? displayFacility.docs : []))
    : []

  const metrics = (displayFacility?.metrics ?? {}) as Record<string, unknown>
  const hasFacilityAqi = metrics.aqi !== undefined && metrics.aqi !== null
  const displayedAqi = hasFacilityAqi ? metrics.aqi : regionalAirQuality?.aqi
  const displayedPm25 = metrics.pm25 ?? regionalAirQuality?.pm25
  const aqiStatus = metrics.aqiStatus ?? metrics.aqi_status ?? regionalAirQuality?.category
  const transitAccess = metrics.transitAccess ?? metrics.transit_access
  const hasEnvironmentData =
    (displayedAqi !== undefined && displayedAqi !== null) ||
    metrics.walkability !== undefined ||
    transitAccess !== undefined
  const environmentMetricCount =
    Number(displayedAqi !== undefined && displayedAqi !== null) +
    Number(metrics.walkability !== undefined) +
    Number(transitAccess !== undefined)
  const environmentGridClass =
    environmentMetricCount >= 3
      ? 'grid-cols-3'
      : environmentMetricCount === 2
        ? 'grid-cols-2'
        : 'grid-cols-1'
  const numericAqi = Number(displayedAqi)
  const aqiStatusClass = !Number.isFinite(numericAqi)
    ? 'text-muted'
    : numericAqi <= 50
      ? 'text-emerald-600 dark:text-emerald-300'
      : numericAqi <= 100
        ? 'text-amber-600 dark:text-amber-300'
        : 'text-danger'
  const localizedAqiStatus = Number.isFinite(numericAqi)
    ? t(AQI_CATEGORY_KEYS[Math.max(0, AQI_LEVELS.indexOf(getAqiLevel(numericAqi)))])
    : aqiStatus
  const budget = (displayFacility?.budget ?? {}) as Record<string, string | null | undefined>
  const catalogEntry = catalogForFacility(displayFacility?.category, language)
  const tabs: Array<{ id: FacilityDetailTab; label: string }> = [
    { id: 'overview', label: copy.overviewTab },
    { id: 'specs', label: copy.specsTab },
    { id: 'budget', label: copy.budgetTab },
  ]

  const renderTabNavigation = () => (
    <div className="grid shrink-0 grid-cols-3 gap-1 border-b border-border/50 bg-surface/25 px-3 py-2 dark:border-white/10 sm:p-2" role="tablist" aria-label={copy.moreDetails}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`facility-tab-${tab.id}`}
            onClick={() => {
              setActiveTab(tab.id)
            }}
            className={`min-w-0 rounded-lg px-1.5 py-1.5 transition-[background-color,color,box-shadow,transform] duration-200 active:scale-[0.98] ${
              isActive
                ? 'bg-surface text-foreground shadow-sm dark:bg-white/10 dark:text-white'
                : 'text-muted hover:bg-surface/45 hover:text-foreground dark:text-white/60 dark:hover:text-white'
            }`}
          >
            <span className="block truncate text-[9.5px] font-bold sm:text-[10.5px]">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )

  const renderDetailContent = () => (
    <div id={`facility-tab-${activeTab}`} role="tabpanel" className="flex flex-col gap-2.5 pt-0.5 pb-4">
      {activeTab === 'overview' ? (
        <>
          {hasEnvironmentData ? (
            <section className="flex flex-col gap-1.5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-primary dark:text-emerald-400">{copy.environment}</h3>
              <dl className={`grid w-full gap-1.5 ${environmentGridClass}`}>
                {displayedAqi !== undefined && displayedAqi !== null ? (
                  <div className="min-w-0 rounded-lg border border-border/55 bg-surface/25 p-2 dark:border-white/10 dark:bg-black/10">
                    <dt className="text-[9.5px] font-medium text-muted">{hasFacilityAqi ? copy.airQuality : copy.regionalAirQuality}</dt>
                    <dd className="mt-1 break-words text-xs font-bold leading-tight text-foreground dark:text-white">
                      {String(displayedAqi)} AQI
                      {localizedAqiStatus ? <span className={`ml-1 text-[9px] ${aqiStatusClass}`}>{String(localizedAqiStatus)}</span> : null}
                    </dd>
                    {displayedPm25 !== undefined && displayedPm25 !== null ? <p className="mt-0.5 text-[9px] text-muted">PM2.5: {String(displayedPm25)}</p> : null}
                  </div>
                ) : null}
                {metrics.walkability !== undefined ? (
                  <div className="min-w-0 rounded-lg border border-border/55 bg-surface/25 p-2 dark:border-white/10 dark:bg-black/10">
                    <dt className="text-[9.5px] font-medium text-muted">Walkability</dt>
                    <dd className="mt-1 text-xs font-bold text-foreground dark:text-white">{String(metrics.walkability)}</dd>
                    <p className="mt-0.5 text-[9px] text-muted">{copy.scale}</p>
                  </div>
                ) : null}
                {transitAccess !== undefined ? (
                  <div className="min-w-0 rounded-lg border border-border/55 bg-surface/25 p-2 dark:border-white/10 dark:bg-black/10">
                    <dt className="text-[9.5px] font-medium text-muted">{copy.transit}</dt>
                    <dd className="mt-1 break-words text-[10.5px] font-bold leading-snug text-foreground dark:text-white">{String(transitAccess)}</dd>
                  </div>
                ) : null}
              </dl>
              {!hasFacilityAqi && regionalAirQuality ? (
                <p className="text-[9px] leading-relaxed text-muted">
                  {copy.regionalStation}: {regionalAirQuality.stationName.replace(/^SPKU\s*/i, '')} · {regionalAirQuality.source} · {regionalAirQuality.updatedAt}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-lg border border-border/55 bg-surface/20 p-2.5 dark:border-white/10 dark:bg-black/10">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-primary dark:text-emerald-400">{copy.dataInfo}</h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[9.5px]">
              <dt className="text-muted">{copy.source}</dt>
              <dd className="text-right font-semibold text-foreground dark:text-white/90">
                {catalogEntry ? <a href={catalogEntry.sourceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{catalogEntry.source} ↗</a> : '—'}
              </dd>
              <dt className="text-muted">{copy.coverage}</dt>
              <dd className="text-right font-semibold text-foreground dark:text-white/90">{catalogEntry?.coverage ?? displayFacility?.wilayah ?? '—'}</dd>
              <dt className="text-muted">{copy.period}</dt>
              <dd className="text-right font-semibold text-foreground dark:text-white/90">{catalogEntry?.period ?? budget.year ?? '—'}</dd>
              <dt className="text-muted">{copy.updated}</dt>
              <dd className="text-right font-semibold text-foreground dark:text-white/90">
                {displayFacility && 'updatedAt' in displayFacility && displayFacility.updatedAt ? formatMetadataDate(displayFacility.updatedAt, language) : '—'}
              </dd>
            </dl>
          </section>
        </>
      ) : null}

      {activeTab === 'specs' ? (
        <section>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-primary dark:text-emerald-400">{copy.specifications}</h3>
          {Object.keys(specs).length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {Object.entries(specs).map(([key, val]) => (
                <div key={key} className="rounded-lg border border-border/55 bg-surface/20 px-2.5 py-2 dark:border-white/10 dark:bg-black/10">
                  <p className="text-[9.5px] font-semibold text-primary/75 dark:text-emerald-300/75">{key}</p>
                  <p className="mt-0.5 break-words text-[11px] font-semibold leading-snug text-foreground dark:text-white/90">{val}</p>
                </div>
              ))}
            </div>
          ) : <p className="rounded-lg border border-dashed border-border p-3 text-center text-[10px] text-muted">{copy.emptySpecs}</p>}
        </section>
      ) : null}

      {activeTab === 'budget' ? (
        <div className="flex flex-col gap-2.5">
          <section>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-primary dark:text-emerald-400">{copy.budget}</h3>
            {Object.keys(budget).length > 0 ? (
              <dl className="grid grid-cols-2 gap-2 rounded-lg border border-border/55 bg-surface/20 p-2.5 text-[9.5px] dark:border-white/10 dark:bg-black/10">
                <div className="col-span-2 border-b border-border/40 pb-2 dark:border-white/10">
                  <dt className="text-muted">{copy.totalBudget}</dt>
                  <dd className="mt-0.5 text-sm font-extrabold text-primary dark:text-emerald-400">{budget.total ?? budget.nilai ?? '—'}</dd>
                </div>
                {budget.source ? <div><dt className="text-muted">{copy.funding}</dt><dd className="mt-0.5 font-semibold text-foreground dark:text-white/90">{budget.source}</dd></div> : null}
                {budget.year ? <div><dt className="text-muted">{copy.year}</dt><dd className="mt-0.5 font-semibold text-foreground dark:text-white/90">{budget.year}</dd></div> : null}
                {budget.contractor ? <div className="col-span-2"><dt className="text-muted">{copy.contractor}</dt><dd className="mt-0.5 font-semibold text-foreground dark:text-white/90">{budget.contractor}</dd></div> : null}
                {budget.status ? <div className="col-span-2"><dt className="text-muted">{copy.status}</dt><dd className="mt-0.5 font-semibold text-primary dark:text-emerald-400">{budget.status}</dd></div> : null}
              </dl>
            ) : <p className="rounded-lg border border-dashed border-border p-3 text-center text-[10px] text-muted">{copy.emptyBudget}</p>}
          </section>

          <section className="pb-2 sm:pb-1">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-primary dark:text-emerald-400">{copy.documents}</h3>
            {docs.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {docs.map((doc, idx) => {
                  const title = 'title' in doc ? doc.title : copy.publicDocument
                  const dept = 'dept' in doc ? doc.dept : undefined
                  const size = 'size' in doc ? doc.size : undefined
                  const url = 'url' in doc && doc.url ? String(doc.url) : '#'
                  return (
                    <div key={idx} className="flex items-center justify-between gap-2 rounded-lg border border-border/55 bg-surface/20 p-2 dark:border-white/10 dark:bg-black/10">
                      <div className="min-w-0"><p className="truncate text-[10.5px] font-semibold text-foreground dark:text-white">{title}</p><p className="text-[9px] text-muted">{dept ?? copy.department}{size ? ` · ${size}` : ''}</p></div>
                      <a href={url} download={title} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-[9.5px] font-bold text-primary hover:bg-primary/20" title={copy.downloadTitle}>{copy.download}</a>
                    </div>
                  )
                })}
              </div>
            ) : <p className="rounded-lg border border-dashed border-border p-3 text-center text-[10px] text-muted">{copy.emptyDocs}</p>}
          </section>
        </div>
      ) : null}
    </div>
  )

  // =========================================================================
  // VARIAN 1: SIDE-GLASS (Floating Glass Panel di Kanan Layar Peta)
  // =========================================================================
  if (variant === 'side-glass') {
    if (!modalOpen || !displayFacility) return null

    return (
      <aside
        ref={sheetRef}
        aria-label={copy.panelAria}
        style={{ '--mobile-sheet-height': mobileSheetHeight ? `${mobileSheetHeight}px` : '30dvh' } as CSSProperties}
        className={`luma-facility-detail fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom,0px))] z-40 flex h-[var(--mobile-sheet-height)] max-h-[72dvh] w-auto flex-col overflow-hidden rounded-[1.5rem] luma-map-card text-foreground dark:text-white animate-in fade-in slide-in-from-bottom-4 duration-250 select-text sm:bottom-auto sm:left-auto sm:right-4 sm:top-18 sm:h-auto sm:w-[310px] sm:max-h-[calc(100dvh-15.5rem)] sm:rounded-2xl sm:slide-in-from-right-4 ${isDraggingSheet ? 'transition-none' : 'transition-[height] ease-out'}`}
      >
        <div
          role="separator"
          tabIndex={0}
          aria-label={copy.resizeSheet}
          aria-orientation="horizontal"
          aria-valuemin={28}
          aria-valuemax={72}
          aria-valuenow={Math.round(((mobileSheetHeight ?? window.innerHeight * 0.3) / window.innerHeight) * 100)}
          onPointerDown={handleSheetPointerDown}
          onPointerMove={handleSheetPointerMove}
          onPointerUp={finishSheetDrag}
          onPointerCancel={finishSheetDrag}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              setMobileSheetHeight((current) => Math.min(getMaximumSheetHeight(), (current ?? window.innerHeight * 0.3) + 80))
            }
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setMobileSheetHeight((current) => Math.max(window.innerHeight * 0.28, (current ?? window.innerHeight * 0.3) - 80))
            }
          }}
          className="flex h-5 shrink-0 touch-none cursor-row-resize items-center justify-center sm:hidden"
        >
          <span className="h-1 w-10 rounded-full bg-foreground/25" aria-hidden="true" />
        </div>

        {/* Header Glass */}
        <header className="flex shrink-0 items-start justify-between gap-2 border-b border-border/50 bg-transparent px-3 py-2.5 dark:border-white/10 sm:gap-2.5 sm:p-3.5">
          <div className="flex flex-col gap-0.5 min-w-0 pr-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-white/70 sm:text-[11px]">{displayFacility.wilayah}</span>
            <h2 className="mt-0.5 line-clamp-1 text-[13px] font-bold leading-snug tracking-tight text-foreground dark:text-white sm:line-clamp-2 sm:text-base">
              {displayFacility.name}
            </h2>
            {displayFacility.address && (
              <p className="mt-0.5 flex min-w-0 items-start justify-between gap-1.5 text-[10px] font-medium leading-snug text-muted dark:text-white/75 sm:text-[11px] sm:leading-relaxed">
                <span className="min-w-0 line-clamp-1 break-words sm:line-clamp-none">{displayFacility.address}</span>
                {googleMapsUrl && coordinateLabel ? (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${copy.openMaps}: ${coordinateLabel}`}
                    data-tooltip={copy.openMaps}
                    data-tooltip-side="bottom"
                    data-tooltip-align="end"
                    className="mt-0.5 inline-flex shrink-0 text-primary transition-[transform,color] duration-200 hover:scale-110 hover:text-primary-hover focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 dark:text-emerald-400"
                  >
                    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </a>
                ) : (
                  <svg className="mt-0.5 size-3.5 shrink-0 text-primary dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                )}
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label={copy.close}
            onClick={onClose}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border/60 bg-surface/80 text-muted transition-[transform,color,background-color,border-color] duration-200 motion-safe:hover:rotate-90 motion-safe:hover:scale-105 hover:border-primary/35 hover:bg-primary/10 hover:text-foreground active:scale-95 dark:border-white/15 dark:bg-white/10 dark:text-white/70 dark:hover:text-white sm:size-7"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        {renderTabNavigation()}

        {/* Scrollable Body */}
        <div ref={sheetBodyRef} className="flex min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2.5 text-foreground scrollbar-thin dark:text-white sm:p-3.5">
          <div ref={sheetBodyContentRef} className="flex w-full flex-col gap-2 pb-5 sm:gap-3 sm:pb-5">
            {detail.status === 'loading' && !displayFacility ? (
              <div className="space-y-2.5" aria-label={copy.loading}>
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ) : null}

            {detail.status === 'error' && !displayFacility ? (
              <ErrorBanner
                error={detail.error}
                className="rounded-xl border border-red-400/30 bg-red-500/10 p-2.5 text-xs text-foreground dark:text-white backdrop-blur-md"
              />
            ) : null}

            {displayFacility ? renderDetailContent() : null}

          </div>
        </div>
      </aside>
    )
  }

  // =========================================================================
  // VARIAN 2: CENTER MODAL (Digunakan pada ringkasan sektoral / page.tsx)
  // =========================================================================
  return (
    <Modal
      isOpen={modalOpen}
      onClose={onClose}
      size="lg"
      title={
        displayFacility ? (
          <div className="flex flex-col gap-1.5 pr-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/60">{displayFacility.wilayah}</span>
            <span className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
              {displayFacility.name}
            </span>
          </div>
        ) : (
          copy.detail
        )
      }
      description={
        displayFacility?.address ? (
          <span className="flex items-center justify-between gap-1.5 text-xs text-white/70">
            <span className="min-w-0">{displayFacility.address}</span>
            {googleMapsUrl && coordinateLabel ? (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${copy.openMaps}: ${coordinateLabel}`}
                data-tooltip={copy.openMaps}
                data-tooltip-align="end"
                className="shrink-0 text-emerald-400 transition-transform hover:scale-110 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50"
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </a>
            ) : null}
          </span>
        ) : (
          detail.status === 'loading' ? copy.loadingDescription : undefined
        )
      }
    >
      {detail.status === 'loading' && !displayFacility ? (
        <div className="space-y-3" aria-label={copy.loading}>
          <Skeleton className="h-20 w-full bg-white/10 rounded-2xl" />
          <Skeleton className="h-40 w-full bg-white/10 rounded-2xl" />
          <Skeleton className="h-28 w-full bg-white/10 rounded-2xl" />
        </div>
      ) : null}

      {detail.status === 'error' && !displayFacility ? (
        <ErrorBanner
          error={detail.error}
          className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-white backdrop-blur-md"
        />
      ) : null}

      {displayFacility ? (
        <div className="flex flex-col gap-3">
          {renderTabNavigation()}
          {renderDetailContent()}
        </div>
      ) : null}
    </Modal>
  )
}
