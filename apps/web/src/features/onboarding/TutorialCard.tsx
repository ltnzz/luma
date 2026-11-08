import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { useTranslation } from '../../i18n/useTranslation'
import type { TranslationKey } from '../../i18n/dictionaries'
import { CategoryIconBadge, type CategoryIconKind } from '../../components/ui/CategoryIconBadge'
import type { TourPlacement, TourRect } from './types'

const GAP = 16
const VIEWPORT_MARGIN = 12

export const TOUR_CARD_WIDTH = 'min(340px, calc(100vw - 1.5rem))'
export const TOUR_HERO_WIDTH = 'min(560px, calc(100vw - 1.5rem))'

/** Real dashboard categories shown as hero pillar chips (labels via i18n). */
const HERO_PILLARS: Array<{ category: CategoryIconKind; labelKey: TranslationKey }> = [
  { category: 'health', labelKey: 'mapFirst.dock.health' },
  { category: 'green', labelKey: 'mapFirst.dock.green' },
  { category: 'school', labelKey: 'mapFirst.dock.school' },
  { category: 'transit', labelKey: 'mapFirst.dock.transit' },
  { category: 'water', labelKey: 'mapFirst.dock.water' },
]

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

interface Position {
  left: number
  top: number
}

interface ViewportSize {
  width: number
  height: number
}

/**
 * Picks a card position near the target rect without clipping.
 * Candidates are ordered: preferred placement, opposite placement, then the
 * two horizontal/vertical splits. The first candidate that fits inside the
 * viewport margins wins; otherwise the card is clamped into the margins.
 */
function computeCardPosition(
  rect: TourRect | null,
  cardSize: { width: number; height: number },
  placement: TourPlacement,
  viewport: ViewportSize,
): Position {
  if (!rect) {
    return {
      left: Math.max(VIEWPORT_MARGIN, (viewport.width - cardSize.width) / 2),
      top: Math.max(VIEWPORT_MARGIN, (viewport.height - cardSize.height) / 2),
    }
  }

  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  const candidates: Record<TourPlacement, Position> = {
    top: { left: centerX - cardSize.width / 2, top: rect.top - GAP - cardSize.height },
    bottom: { left: centerX - cardSize.width / 2, top: rect.top + rect.height + GAP },
    left: { left: rect.left - GAP - cardSize.width, top: centerY - cardSize.height / 2 },
    right: { left: rect.left + rect.width + GAP, top: centerY - cardSize.height / 2 },
    center: { left: centerX - cardSize.width / 2, top: centerY - cardSize.height / 2 },
  }

  const opposite: Record<TourPlacement, TourPlacement> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
    center: 'center',
  }

  const order: TourPlacement[] = [
    placement,
    opposite[placement],
    placement === 'top' || placement === 'bottom' ? 'right' : 'bottom',
    placement === 'top' || placement === 'bottom' ? 'left' : 'top',
  ]

  const fits = (position: Position) =>
    position.left >= VIEWPORT_MARGIN &&
    position.top >= VIEWPORT_MARGIN &&
    position.left + cardSize.width <= viewport.width - VIEWPORT_MARGIN &&
    position.top + cardSize.height <= viewport.height - VIEWPORT_MARGIN

  for (const candidate of order) {
    const position = candidates[candidate]
    if (fits(position)) return position
  }

  // No candidate fits (small viewports): clamp into the margins.
  return {
    left: clamp(
      candidates[placement].left,
      VIEWPORT_MARGIN,
      Math.max(VIEWPORT_MARGIN, viewport.width - cardSize.width - VIEWPORT_MARGIN),
    ),
    top: clamp(
      candidates[placement].top,
      VIEWPORT_MARGIN,
      Math.max(VIEWPORT_MARGIN, viewport.height - cardSize.height - VIEWPORT_MARGIN),
    ),
  }
}

interface TutorialCardProps {
  rect: TourRect | null
  placement: TourPlacement
  title: string
  body: string
  /** One-based step index for display. */
  stepNumber: number
  totalSteps: number
  isFirst: boolean
  isLast: boolean
  /**
   * `default` = standard spotlight step card (steps 2–9).
   * `hero` = editorial opening panel anchored to the bottom edge (step 1).
   */
  variant?: 'default' | 'hero'
  onBack: () => void
  onNext: () => void
  onFinish: () => void
  /**
   * Present only in replay sessions (`canSkip`). First-visit tours stay
   * mandatory → no Skip, no Close.
   */
  onSkip?: () => void
  labelId: string
  descriptionId: string
}

/**
 * Presentation of a single tour step. Attached to the viewport (position:
 * fixed), positioned by the shared positioning algorithm and re-measured with
 * a ResizeObserver so content changes never clip the card.
 */
export function TutorialCard({
  rect,
  placement,
  title,
  body,
  stepNumber,
  totalSteps,
  isFirst,
  isLast,
  variant = 'default',
  onBack,
  onNext,
  onFinish,
  onSkip,
  labelId,
  descriptionId,
}: TutorialCardProps) {
  const { t } = useTranslation()
  const cardRef = useRef<HTMLElement | null>(null)
  const actionRef = useRef<HTMLButtonElement | null>(null)
  const [cardSize, setCardSize] = useState<{ width: number; height: number }>(() => ({
    width: 340,
    height: 220,
  }))
  const [viewport, setViewport] = useState<ViewportSize>(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  const updateViewport = useCallback(() => {
    setViewport({ width: window.innerWidth, height: window.innerHeight })
  }, [])

  const measureCard = useCallback(() => {
    const element = cardRef.current
    if (!element) return
    setCardSize({ width: element.offsetWidth, height: element.offsetHeight })
  }, [])

  useEffect(() => {
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [updateViewport])

  useLayoutEffect(() => {
    measureCard()
    const element = cardRef.current
    if (!element || typeof ResizeObserver !== 'function') return
    const observer = new ResizeObserver(measureCard)
    observer.observe(element)
    return () => observer.disconnect()
  }, [measureCard])

  // Move focus to the primary action whenever the step changes.
  useEffect(() => {
    actionRef.current?.focus({ preventScroll: true })
  }, [stepNumber])

  const position = useMemo(
    () =>
      variant === 'hero'
        ? {
            left: Math.max(VIEWPORT_MARGIN, (viewport.width - cardSize.width) / 2),
            top: Math.max(VIEWPORT_MARGIN, viewport.height - cardSize.height - 28),
          }
        : computeCardPosition(rect, cardSize, placement, viewport),
    [rect, cardSize, placement, viewport, variant],
  )

  const progress = totalSteps > 0 ? (stepNumber / totalSteps) * 100 : 100
  const isHero = variant === 'hero'

  return (
    <section
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      aria-describedby={descriptionId}
      data-step={stepNumber}
      data-variant={variant}
      className="luma-tour-card fixed z-[100] flex flex-col gap-2.5 overflow-hidden rounded-2xl border border-border bg-surface/95 p-4 text-foreground shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-[top,left,width] duration-300 ease-out motion-reduce:transition-none"
      style={{
        left: position.left,
        top: position.top,
        width: isHero ? TOUR_HERO_WIDTH : TOUR_CARD_WIDTH,
      }}
    >
      {/* Keyed by step: swaps content with a light 180 ms fade/translate so
          step transitions read as one motion, with zero extra mounts of the
          card itself (bounds measuring, ResizeObserver and focus survive). */}
      <div key={stepNumber} className="luma-tour-step-enter flex flex-col gap-2.5">
      {isHero ? (
        <>
          {/* Eyebrow: brand + tagline */}
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Luma · {t('app.tagline')}
          </span>

          {/* Editorial display heading */}
          <h2
            id={labelId}
            className="text-2xl font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-3xl"
          >
            {title}
          </h2>

          {/* Metro route divider (animated march) */}
          <svg
            viewBox="0 0 240 8"
            preserveAspectRatio="none"
            className="h-2 w-full text-muted/50"
            aria-hidden="true"
          >
            <line
              x1="0"
              y1="4"
              x2="240"
              y2="4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="5 7"
              strokeLinecap="round"
              className="luma-tour-route-dash"
            />
          </svg>

          {/* Real dashboard categories as pillar chips */}
          <div className="flex flex-wrap gap-1.5">
            {HERO_PILLARS.map((pillar, index) => (
              <span
                key={pillar.category}
                className="luma-tour-chip inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted/70 px-2.5 py-1 text-[10.5px] font-semibold text-foreground"
                style={{ animationDelay: `${140 + index * 60}ms` }}
              >
                <CategoryIconBadge category={pillar.category} size="sm" />
                {t(pillar.labelKey)}
              </span>
            ))}
          </div>

          <p id={descriptionId} className="text-xs leading-relaxed text-muted">
            {body}
          </p>
        </>
      ) : (
        <>
          {/* Header: step counter + progress */}
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center rounded-full border border-primary/25 bg-primary-soft px-2.5 py-1 text-[10px] font-bold tracking-wide text-primary-soft-text">
              {t('tour.stepLabel')} {stepNumber}/{totalSteps}
            </span>
            <div
              className="h-1 w-full overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-label={t('tour.progressAria')}
              aria-valuemin={0}
              aria-valuemax={totalSteps}
              aria-valuenow={stepNumber}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <h2 id={labelId} className="text-[15px] font-bold leading-snug text-foreground">
              {title}
            </h2>
            <p id={descriptionId} className="text-xs leading-relaxed text-muted">
              {body}
            </p>
          </div>
        </>
      )}

      {/* Actions */}
      <div className={isHero ? 'flex items-center justify-between gap-3' : 'mt-1 flex items-center justify-between gap-3'}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onBack}
            disabled={isFirst}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
            aria-label={t('tour.back')}
          >
            {t('tour.back')}
          </button>
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
              aria-label={t('tour.skip')}
            >
              {t('tour.skip')}
            </button>
          )}
        </div>
        <button
          ref={actionRef}
          type="button"
          onClick={isLast ? onFinish : onNext}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-[0_6px_18px_-4px_rgba(16,163,74,0.4)] transition-colors hover:bg-primary-hover"
          aria-label={isLast ? t('tour.finish') : isHero ? t('tour.welcome.cta') : t('tour.next')}
        >
          {isLast
            ? t('tour.finish')
            : isHero
              ? t('tour.welcome.cta')
              : t('tour.next')}
        </button>
        </div>
      </div>
    </section>
  )
}
