import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { CategoryIconBadge } from '../../../components/ui/CategoryIconBadge'
import { getDataCatalogEntry } from '../../../data/data-catalog'
import { useTranslation } from '../../../i18n/useTranslation'
import type { TranslationKey } from '../../../i18n/dictionaries'
import { AQI_LEVELS, getAqiLevel } from '../utils/airQualityLevels'

export type MobileMapTab = 'explore' | 'legend' | 'sources'

interface MobileMapBottomSheetProps {
  activeTab: MobileMapTab
  onTabChange: (tab: MobileMapTab) => void
  scopeLabel: string
  airAqi: number | null
  airStatus: string
  isAirLive: boolean
  canExpandRegion: boolean
  onNavigateToDataSources?: () => void
}

const LEGEND_ITEMS: Array<{
  category: 'health' | 'green' | 'school' | 'transit' | 'water' | 'boundary'
  label: TranslationKey
  sub: TranslationKey
}> = [
  { category: 'health' as const, label: 'mapFirst.legend.health', sub: 'mapFirst.legend.healthSub' },
  { category: 'green' as const, label: 'mapFirst.legend.green', sub: 'mapFirst.legend.greenSub' },
  { category: 'school' as const, label: 'mapFirst.legend.school', sub: 'mapFirst.legend.schoolSub' },
  { category: 'transit' as const, label: 'mapFirst.legend.transit', sub: 'mapFirst.legend.transitSub' },
  { category: 'water' as const, label: 'mapFirst.legend.water', sub: 'mapFirst.legend.waterSub' },
  { category: 'boundary' as const, label: 'mapFirst.legend.boundary', sub: 'mapFirst.legend.boundarySub' },
]

const COLLAPSED_SHEET_HEIGHT = 136

const AIR_ADVICE_KEYS: TranslationKey[] = [
  'mapFirst.air.advice.good',
  'mapFirst.air.advice.moderate',
  'mapFirst.air.advice.sensitive',
  'mapFirst.air.advice.unhealthy',
  'mapFirst.air.advice.veryUnhealthy',
  'mapFirst.air.advice.hazardous',
]

function BottomNavIcon({ tab }: { tab: MobileMapTab }) {
  if (tab === 'explore') {
    return (
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    )
  }
  if (tab === 'legend') {
    return (
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
        <path d="M9 3v15M15 6v15" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </svg>
  )
}

export function MobileMapBottomSheet({
  activeTab,
  onTabChange,
  scopeLabel,
  airAqi,
  airStatus,
  isAirLive,
  canExpandRegion,
  onNavigateToDataSources,
}: MobileMapBottomSheetProps) {
  const { language, t } = useTranslation()
  const [sheetHeight, setSheetHeight] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const airMetadata = getDataCatalogEntry('airQuality', language)
  const airLevel = getAqiLevel(airAqi ?? 0)
  const airLevelIndex = Math.max(0, AQI_LEVELS.indexOf(airLevel))
  const airAdvice = airAqi === null
    ? t('mapFirst.air.unavailableAdvice')
    : t(AIR_ADVICE_KEYS[airLevelIndex])
  const dragRef = useRef({ startY: 0, startHeight: COLLAPSED_SHEET_HEIGHT })
  const handleRef = useRef<HTMLDivElement | null>(null)
  const panelContentRef = useRef<HTMLDivElement | null>(null)
  const navRef = useRef<HTMLElement | null>(null)
  const resolvedHeight = sheetHeight ?? COLLAPSED_SHEET_HEIGHT
  const isExpanded = canExpandRegion && resolvedHeight > 230
  const canDragSheet = activeTab !== 'explore' || canExpandRegion
  const renderedHeight = canDragSheet ? `${resolvedHeight}px` : 'auto'
  const copy = language === 'id'
    ? {
        local: 'Suasana lokal', explore: 'Jelajahi', legend: 'Legenda Peta', sources: 'Sumber Data',
        detail: 'Detail', transparency: 'Transparansi data', source: 'Sumber', period: 'Periode', unit: 'Satuan',
        sourceTitle: 'Sumber Data Resmi', sourceBody: 'Lihat sumber, cakupan, periode, dan metode pengolahan data Luma.',
      }
    : {
        local: 'Local conditions', explore: 'Explore', legend: 'Map Legend', sources: 'Data Sources',
        detail: 'Details', transparency: 'Data transparency', source: 'Source', period: 'Period', unit: 'Unit',
        sourceTitle: 'Official Data Sources', sourceBody: 'Review the sources, coverage, periods, and processing methods used by Luma.',
      }

  const tabs: Array<{ id: MobileMapTab; label: string }> = [
    { id: 'explore', label: copy.explore },
    { id: 'legend', label: copy.legend },
    { id: 'sources', label: copy.sources },
  ]

  const getFittedPanelHeight = () => {
    const measuredHeight =
      (handleRef.current?.offsetHeight ?? 20) +
      (panelContentRef.current?.scrollHeight ?? 0) +
      (navRef.current?.offsetHeight ?? 54) +
      2
    return Math.min(window.innerHeight * 0.72, Math.max(COLLAPSED_SHEET_HEIGHT, measuredHeight))
  }

  const getMaximumDragHeight = () =>
    activeTab === 'explore'
      ? Math.min(window.innerHeight * 0.5, 320)
      : getFittedPanelHeight()

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activeTab === 'explore' && !canExpandRegion) return
    const sheet = event.currentTarget.parentElement
    dragRef.current = {
      startY: event.clientY,
      startHeight: sheet?.getBoundingClientRect().height ?? resolvedHeight,
    }
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const nextHeight = dragRef.current.startHeight + (dragRef.current.startY - event.clientY)
    setSheetHeight(Math.min(getMaximumDragHeight(), Math.max(COLLAPSED_SHEET_HEIGHT, nextHeight)))
  }

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const currentHeight = sheetHeight ?? dragRef.current.startHeight
    const maximum = getMaximumDragHeight()
    const snapPoints = [COLLAPSED_SHEET_HEIGHT, Math.min(window.innerHeight * 0.48, maximum), maximum]
    const nearest = snapPoints.reduce((best, point) =>
      Math.abs(point - currentHeight) < Math.abs(best - currentHeight) ? point : best,
    )
    setSheetHeight(nearest)
    setIsDragging(false)
  }

  const handleTabChange = (tab: MobileMapTab) => {
    // Sumber Data adalah halaman tujuan, bukan panel perantara. Buka katalog
    // transparansi langsung agar user tidak perlu menekan tombol "Detail"
    // untuk kedua kalinya.
    if (tab === 'sources' && onNavigateToDataSources) {
      onNavigateToDataSources()
      return
    }

    onTabChange(tab)
    if (tab === 'explore') setSheetHeight(COLLAPSED_SHEET_HEIGHT)
    if (tab !== 'explore') {
      window.setTimeout(() => setSheetHeight(getFittedPanelHeight()), 0)
    }
  }

  const airSummary = (
    <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/20 bg-primary/[0.08] px-2 py-1 text-[9px] font-semibold text-foreground min-[360px]:text-[9.5px]">
      <span aria-hidden="true">😷</span>
      <strong className="text-primary">{airAqi ?? '—'} {t('mapFirst.air.unit')}</strong>
      <span className="text-muted">•</span>
      <span className="whitespace-nowrap text-muted">{airStatus}</span>
    </div>
  )

  return (
    <section
      style={{ '--mobile-map-sheet-height': renderedHeight } as CSSProperties}
      className={`pointer-events-auto absolute inset-x-2 bottom-2 z-30 flex h-[var(--mobile-map-sheet-height)] max-h-[72dvh] flex-col overflow-hidden rounded-2xl luma-map-card sm:hidden ${isDragging ? 'transition-none' : 'transition-[height] duration-250 ease-out'}`}
    >
      {canDragSheet ? (
        <div
          ref={handleRef}
          role="separator"
          tabIndex={0}
          aria-label={language === 'id' ? 'Tarik untuk membuka atau meringkas panel' : 'Drag to expand or collapse the panel'}
          aria-orientation="horizontal"
          aria-valuemin={COLLAPSED_SHEET_HEIGHT}
          aria-valuemax={Math.round(window.innerHeight * 0.72)}
          aria-valuenow={Math.round(resolvedHeight)}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              setSheetHeight((current) => Math.min(getMaximumDragHeight(), (current ?? COLLAPSED_SHEET_HEIGHT) + 100))
            }
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setSheetHeight((current) => Math.max(COLLAPSED_SHEET_HEIGHT, (current ?? COLLAPSED_SHEET_HEIGHT) - 100))
            }
          }}
          className="flex h-5 shrink-0 touch-none cursor-row-resize items-center justify-center"
        >
          <span className="h-1 w-10 rounded-full bg-foreground/20" />
        </div>
      ) : null}

      <div ref={panelContentRef} className="min-h-0 overflow-y-auto scrollbar-thin">

      {activeTab === 'explore' ? (
        <div className={`shrink-0 px-3 pb-2.5 ${canDragSheet ? '' : 'pt-2.5'}`}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5">
            <div className="min-w-0">
              <p className="text-[9.5px] font-semibold uppercase tracking-wider text-muted">{copy.local}</p>
              <h3 className="truncate text-sm font-bold text-foreground">{scopeLabel}</h3>
            </div>
            {airSummary}
          </div>
        </div>
      ) : null}

      {activeTab === 'explore' && isExpanded ? (
        <div className="mx-3 mb-2 flex-1 space-y-2 overflow-y-auto pr-0.5 scrollbar-thin">
          <section className="rounded-xl border border-border/55 bg-surface/25 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9.5px] font-semibold uppercase tracking-wider text-muted">{t('mapFirst.air.title')}</p>
                <p className="mt-0.5 text-sm font-bold text-foreground">{airAqi ?? '—'} {t('mapFirst.air.unit')}</p>
              </div>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">{airStatus}</span>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1" aria-hidden="true">
              <span className="h-1.5 rounded-full bg-emerald-500/65" />
              <span className="h-1.5 rounded-full bg-amber-400/65" />
              <span className="h-1.5 rounded-full bg-orange-400/70" />
              <span className="h-1.5 rounded-full bg-rose-500 shadow-[0_0_9px_rgba(244,63,94,0.55)]" />
              <span className="h-1.5 rounded-full bg-purple-500/60" />
            </div>
          </section>

          <section className="rounded-xl border border-border/55 bg-surface/25 px-3 py-2.5">
            <p className="text-[10px] leading-relaxed text-muted">
              <span className="mr-1 font-bold text-foreground">{t('mapFirst.air.guide')}</span>
              {airAdvice}
            </p>
            <details className="group mt-2 border-t border-border/60 pt-2">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-bold text-foreground">
                <span>{copy.transparency}</span>
                <span className="text-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[9.5px] leading-tight">
                <dt className="text-muted">{copy.source}</dt>
                <dd className="text-right font-semibold text-foreground">{airMetadata.source}</dd>
                <dt className="text-muted">{copy.period}</dt>
                <dd className="text-right font-medium text-foreground">{airMetadata.period}</dd>
                <dt className="text-muted">{copy.unit}</dt>
                <dd className="text-right font-medium text-foreground">{airMetadata.unit}</dd>
              </dl>
            </details>
          </section>
        </div>
      ) : null}

      {activeTab === 'legend' ? (
        <div className="px-3 pb-2.5">
          <div className="mb-2 flex items-center justify-between gap-3 border-b border-border/55 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">{copy.legend}</h3>
            {airSummary}
          </div>
          <div className="max-h-[38dvh] space-y-0.5 overflow-y-auto overscroll-contain pr-0.5 scrollbar-thin">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.category} className="grid min-h-10 grid-cols-[24px_minmax(0,1fr)] items-center gap-2 rounded-lg px-1.5 py-1.5">
                <CategoryIconBadge category={item.category} size="sm" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold leading-tight text-foreground">{t(item.label)}</p>
                  <p className="mt-0.5 text-[9.5px] leading-tight text-muted">{t(item.sub)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === 'sources' ? (
        <div className="px-3 pb-3">
          <div className="rounded-xl border border-border/55 bg-surface/25 p-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">✓</span>
              <div>
                <h3 className="text-sm font-bold text-foreground">{copy.sourceTitle}</h3>
                <p className="text-[9.5px] font-semibold text-primary">{isAirLive ? t('mapFirst.air.live') : t('mapFirst.air.unavailable')}</p>
              </div>
            </div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-muted">{copy.sourceBody}</p>
            <button
              type="button"
              onClick={() => onNavigateToDataSources?.()}
              className="mt-2.5 w-full rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-[10.5px] font-bold text-primary transition hover:bg-primary/15"
            >
              {copy.detail} ›
            </button>
          </div>
        </div>
      ) : null}

      </div>

      <nav ref={navRef} className="mt-auto grid shrink-0 grid-cols-3 gap-1 border-t border-border/60 bg-surface/35 px-2.5 py-1.5" aria-label={language === 'id' ? 'Navigasi peta mobile' : 'Mobile map navigation'}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              aria-pressed={selected}
              className={`group flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1 transition-[color,background-color,transform] duration-200 motion-safe:hover:-translate-y-0.5 active:scale-[0.97] ${
                selected ? 'text-primary hover:bg-primary/[0.06]' : 'text-muted hover:bg-primary/[0.06] hover:text-primary'
              }`}
            >
              <span className={`flex size-7 items-center justify-center rounded-lg border transition-[transform,color,background-color,border-color,box-shadow] duration-200 group-hover:scale-105 group-hover:border-primary/30 group-hover:bg-primary/12 group-hover:text-primary group-hover:shadow-sm ${
                selected
                  ? 'border-primary/25 bg-primary/15 shadow-sm'
                  : 'border-transparent bg-surface-muted/45'
              }`}>
                <BottomNavIcon tab={tab.id} />
              </span>
              <span className="whitespace-nowrap text-center text-[9px] font-bold leading-none transition-colors duration-200 min-[380px]:text-[9.5px]">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </section>
  )
}
