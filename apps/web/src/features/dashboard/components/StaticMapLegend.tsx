import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CategoryIconBadge } from '../../../components/ui/CategoryIconBadge'
import { AlertCircleIcon } from '../../../components/ui/Icons'
import { useTranslation } from '../../../i18n/useTranslation'

/**
 * StaticMapLegend — Legenda Simbol Peta Ringkas & Statis
 * Memberikan informasi murni makna simbol/layer tanpa data angka,
 * didesain sangat ramping agar pas di layar tanpa memicu scrollbar.
 */
interface StaticMapLegendProps {
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

interface LegendItem {
  id: 'health' | 'green' | 'school' | 'transit' | 'water' | 'boundary'
  titleKey: 'mapFirst.legend.health' | 'mapFirst.legend.green' | 'mapFirst.legend.school' | 'mapFirst.legend.transit' | 'mapFirst.legend.water' | 'mapFirst.legend.boundary'
  descKey: 'mapFirst.legend.healthSub' | 'mapFirst.legend.greenSub' | 'mapFirst.legend.schoolSub' | 'mapFirst.legend.transitSub' | 'mapFirst.legend.waterSub' | 'mapFirst.legend.boundarySub'
}

const LEGEND_ITEMS: readonly LegendItem[] = [
  { id: 'health', titleKey: 'mapFirst.legend.health', descKey: 'mapFirst.legend.healthSub' },
  { id: 'green', titleKey: 'mapFirst.legend.green', descKey: 'mapFirst.legend.greenSub' },
  { id: 'school', titleKey: 'mapFirst.legend.school', descKey: 'mapFirst.legend.schoolSub' },
  { id: 'transit', titleKey: 'mapFirst.legend.transit', descKey: 'mapFirst.legend.transitSub' },
  { id: 'water', titleKey: 'mapFirst.legend.water', descKey: 'mapFirst.legend.waterSub' },
  { id: 'boundary', titleKey: 'mapFirst.legend.boundary', descKey: 'mapFirst.legend.boundarySub' },
] as const

interface TooltipState {
  text: string
  top: number
  left: number
  placement: 'left' | 'right'
}

export function StaticMapLegend({ isOpen = false, onOpenChange }: StaticMapLegendProps) {
  const { t } = useTranslation()
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const showTooltip = (text: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const screenWidth = window.innerWidth
    const canPopRight = rect.right + 200 <= screenWidth

    setTooltip({
      text,
      top: rect.top + rect.height / 2,
      left: canPopRight ? rect.right + 8 : rect.left - 8,
      placement: canPopRight ? 'right' : 'left',
    })
  }

  const hideTooltip = () => setTooltip(null)

  useEffect(() => {
    if (!tooltip) return
    const onDismiss = () => setTooltip(null)
    window.addEventListener('scroll', onDismiss, { capture: true, passive: true })
    window.addEventListener('resize', onDismiss, { passive: true })
    return () => {
      window.removeEventListener('scroll', onDismiss, { capture: true })
      window.removeEventListener('resize', onDismiss)
    }
  }, [tooltip])

  return (
    <details
      data-dashboard="legend-dropdown"
      open={isOpen}
      onToggle={(event) => onOpenChange?.(event.currentTarget.open)}
      className="group pointer-events-auto w-[calc(100vw-1rem)] max-w-[330px] rounded-xl luma-map-card luma-glass-hover select-none animate-in fade-in slide-in-from-left-2 duration-300 sm:w-64"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 marker:content-none">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wide text-foreground">
            {t('dashboard.legend.title')}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] font-medium text-muted">{t('mapFirst.legend.symbols')}</span>
          <svg className="size-3.5 text-muted transition-transform duration-200 group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </summary>

      {/* Daftar Simbol Murni: Single Label + Tooltip detail di luar kartu via portal */}
      <div className="mx-3.5 flex max-h-52 flex-col gap-0.5 overflow-y-auto overscroll-contain border-t border-border/60 pb-2.5 pt-1.5 text-xs scrollbar-none sm:max-h-60">
        {LEGEND_ITEMS.map((item) => {
          const title = t(item.titleKey)
          const desc = t(item.descKey)
          return (
            <div
              key={item.id}
              className="luma-glass-row flex items-center justify-between rounded-lg px-2 py-1 transition-colors hover:bg-surface-muted/40"
            >
              <div className="flex min-w-0 items-center gap-2">
                <CategoryIconBadge category={item.id} size="sm" />
                <span className="truncate text-xs font-medium leading-none text-foreground">
                  {title}
                </span>
              </div>
              <button
                type="button"
                className="group/tooltip flex shrink-0 cursor-help items-center justify-center rounded-full p-0.5 text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                aria-label={`${title}: ${desc}`}
                onMouseEnter={(e) => showTooltip(desc, e.currentTarget)}
                onMouseLeave={hideTooltip}
                onFocus={(e) => showTooltip(desc, e.currentTarget)}
                onBlur={hideTooltip}
              >
                <AlertCircleIcon size={13} className="opacity-70 transition-opacity group-hover/tooltip:opacity-100" />
              </button>
            </div>
          )
        })}
      </div>

      {tooltip && typeof document !== 'undefined'
        ? createPortal(
            <div
              role="tooltip"
              style={{
                position: 'fixed',
                top: `${tooltip.top}px`,
                left: `${tooltip.left}px`,
                transform: tooltip.placement === 'right' ? 'translate(0, -50%)' : 'translate(-100%, -50%)',
              }}
              className="luma-portal-tooltip pointer-events-none z-[9999] px-2.5 py-1.5 animate-in fade-in zoom-in-95 duration-140 select-none"
            >
              {tooltip.text}
            </div>,
            document.body,
          )
        : null}
    </details>
  )
}
