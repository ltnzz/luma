import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { useTranslation } from '../../i18n/useTranslation'
import type { TranslationKey } from '../../i18n/dictionaries'
import { CategoryIconBadge, type CategoryIconKind } from '../../components/ui/CategoryIconBadge'
import type { TourPlacement, TourRect } from './types'
import {
  computeCardPosition,
  computeHeroPosition,
  TOUR_CARD_WIDTH,
  TOUR_HERO_WIDTH,
  type ViewportSize,
} from './card-position'

/** Real dashboard categories shown as hero pillar chips (labels via i18n). */
const HERO_PILLARS: Array<{ category: CategoryIconKind; labelKey: TranslationKey }> = [
  { category: 'health', labelKey: 'mapFirst.dock.health' },
  { category: 'green', labelKey: 'mapFirst.dock.green' },
  { category: 'school', labelKey: 'mapFirst.dock.school' },
  { category: 'transit', labelKey: 'mapFirst.dock.transit' },
  { category: 'water', labelKey: 'mapFirst.dock.water' },
]

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
  /** Whether the tour finale exit animation is currently playing. */
  isExiting?: boolean
  /**
   * `default` = standard spotlight step card (steps 2–9).
   * `hero` = editorial opening panel anchored to the bottom edge (step 1).
   */
  variant?: 'default' | 'hero'
  preview?: ReactNode
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
 * fixed), positioned by the responsive collision-aware positioning algorithm,
 * constrained by viewport safe areas, and re-measured with ResizeObserver.
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
  isExiting = false,
  variant = 'default',
  preview,
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

  const getViewportSize = useCallback((): ViewportSize => {
    if (typeof window === 'undefined') return { width: 1024, height: 768 }
    const vv = window.visualViewport
    return {
      width: vv ? vv.width : window.innerWidth,
      height: vv ? vv.height : window.innerHeight,
    }
  }, [])

  const [viewport, setViewport] = useState<ViewportSize>(getViewportSize)

  const updateViewport = useCallback(() => {
    setViewport(getViewportSize())
  }, [getViewportSize])

  const measureCard = useCallback(() => {
    const element = cardRef.current
    if (!element) return
    setCardSize({ width: element.offsetWidth, height: element.offsetHeight })
  }, [])

  useEffect(() => {
    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', updateViewport)
    const vv = window.visualViewport
    if (vv) {
      vv.addEventListener('resize', updateViewport)
      vv.addEventListener('scroll', updateViewport)
    }
    return () => {
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
      if (vv) {
        vv.removeEventListener('resize', updateViewport)
        vv.removeEventListener('scroll', updateViewport)
      }
    }
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

  const isHero = variant === 'hero'
  const isMobile = viewport.width < 640

  const position = useMemo(
    () =>
      isHero
        ? computeHeroPosition(cardSize, viewport, isMobile)
        : computeCardPosition(rect, cardSize, placement, viewport),
    [rect, cardSize, placement, viewport, isHero, isMobile],
  )

  // No Back on the Welcome screen (isFirst): it only appears from step 2
  // onward, in both first-visit and replay sessions. The last step keeps it
  // alongside the Finish button.
  const showBack = !isFirst
  const hasLeftActions = showBack || Boolean(onSkip)

  return (
    <section
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      aria-describedby={descriptionId}
      data-step={stepNumber}
      data-variant={variant}
      className={`luma-tour-card fixed z-[100] flex flex-col overflow-hidden rounded-2xl border border-border bg-surface/95 p-3.5 text-foreground shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-[top,left,width] duration-300 ease-out motion-reduce:transition-none sm:p-4 ${
        isExiting ? 'luma-tour-card-exit' : ''
      }`}
      style={{
        left: position.left,
        top: position.top,
        width: isHero ? TOUR_HERO_WIDTH : TOUR_CARD_WIDTH,
        maxHeight: isMobile
          ? 'min(580px, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 24px))'
          : isHero
            ? 'calc(100dvh - 32px)'
            : 'min(580px, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 24px))',
      }}
    >
      {/* Keyed by step: swaps content with a light 180 ms fade/translate so
          step transitions read as one motion, with zero extra mounts of the
          card itself (bounds measuring, ResizeObserver and focus survive). */}
      <div key={stepNumber} className="luma-tour-step-enter flex flex-1 min-h-0 flex-col gap-2.5">
        {isHero ? (
          <>
            {/* Scrollable container for Hero content on constrained viewports */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 flex flex-col gap-2.5 scrollbar-thin">
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
            </div>
          </>
        ) : (
          <>
            {/* Header: step counter + progress (Shrink-0 to always stay visible) */}
            <div className="shrink-0 flex flex-col gap-2">
              {isLast ? (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/35 bg-primary-soft px-2.5 py-1 text-[10px] font-bold tracking-wide text-primary-soft-text shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {t('tour.completedBadge')}
                </span>
              ) : (
                <span className="inline-flex w-fit items-center rounded-full border border-primary/25 bg-primary-soft px-2.5 py-1 text-[10px] font-bold tracking-wide text-primary-soft-text">
                  {t('tour.stepLabel')} {stepNumber}/{totalSteps}
                </span>
              )}
              {/* Segmented progress: one segment per tour step */}
              <div
                className="flex w-full items-center gap-1"
                role="progressbar"
                aria-label={t('tour.progressAria')}
                aria-valuemin={0}
                aria-valuemax={totalSteps}
                aria-valuenow={isLast ? totalSteps : stepNumber}
              >
                {Array.from({ length: totalSteps }, (_, index) => {
                  const segment = index + 1
                  const isCompleted = isLast || segment < stepNumber
                  const isActive = !isLast && segment === stepNumber
                  return (
                    <span
                      key={segment}
                      aria-hidden="true"
                      className={`h-1 flex-1 rounded-full transition-[background-color,box-shadow] duration-300 ease-out motion-reduce:transition-none ${
                        isActive
                          ? 'bg-accent shadow-[0_0_8px_rgba(102,187,106,0.55)]'
                          : isCompleted
                            ? 'bg-primary'
                            : 'bg-border'
                      }`}
                    />
                  )
                })}
              </div>
            </div>

            {/* Scrollable Content Body: Text description + Mobile Previews */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 flex flex-col gap-1.5 scrollbar-thin">
              <h2 id={labelId} className="text-[15px] font-bold leading-snug text-foreground">
                {title}
              </h2>
              <p id={descriptionId} className="text-xs leading-relaxed text-muted">
                {body}
              </p>
              {preview}
            </div>
          </>
        )}

        {/* Actions (Shrink-0: Buttons remain fixed and pinned at the bottom of the card) */}
        <div
          className={
            isHero
              ? `shrink-0 flex items-center gap-3 ${hasLeftActions ? 'justify-between' : 'justify-center'}`
              : 'shrink-0 mt-1 flex items-center justify-between gap-3 pt-2 border-t border-border/30'
          }
        >
          {hasLeftActions && (
            <div className="flex items-center gap-2">
              {showBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="whitespace-nowrap rounded-xl border border-border bg-surface-muted/50 px-4 py-2 text-xs font-semibold text-muted transition-all hover:border-primary/40 hover:bg-surface-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:bg-surface-muted/50 disabled:hover:text-muted motion-reduce:transition-none motion-reduce:active:scale-100"
                  aria-label={t('tour.back')}
                >
                  {t('tour.back')}
                </button>
              )}
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="whitespace-nowrap rounded-xl border border-border bg-surface-muted/50 px-4 py-2 text-xs font-semibold text-muted transition-all hover:border-primary/40 hover:bg-surface-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:bg-surface-muted/50 disabled:hover:text-muted motion-reduce:transition-none motion-reduce:active:scale-100"
                  aria-label={t('tour.skip')}
                >
                  {t('tour.skip')}
                </button>
              )}
            </div>
          )}
          <button
            ref={actionRef}
            type="button"
            disabled={isExiting}
            onClick={isLast ? onFinish : onNext}
            className={`rounded-xl bg-primary px-4 py-2 text-xs font-bold whitespace-nowrap text-on-primary shadow-[0_6px_18px_-4px_rgba(16,163,74,0.4)] transition-all hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 ${
              isExiting ? 'opacity-70 cursor-not-allowed scale-95' : 'active:scale-95'
            } ${isLast ? 'shadow-[0_6px_20px_-4px_rgba(16,163,74,0.55)]' : ''} motion-reduce:transition-none motion-reduce:active:scale-100`}
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
