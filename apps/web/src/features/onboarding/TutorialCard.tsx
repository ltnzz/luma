import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { useTranslation } from '../../i18n/useTranslation'
import type { TourPlacement, TourRect } from './types'

const GAP = 16
const VIEWPORT_MARGIN = 12

export const TOUR_CARD_WIDTH = 'min(340px, calc(100vw - 1.5rem))'

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
  onBack: () => void
  onNext: () => void
  onFinish: () => void
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
  onBack,
  onNext,
  onFinish,
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
    () => computeCardPosition(rect, cardSize, placement, viewport),
    [rect, cardSize, placement, viewport],
  )

  const progress = totalSteps > 0 ? (stepNumber / totalSteps) * 100 : 100

  return (
    <section
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      aria-describedby={descriptionId}
      data-step={stepNumber}
      className="luma-tour-card fixed z-[100] flex flex-col gap-2.5 overflow-hidden rounded-2xl border border-emerald-400/20 bg-[#0d1712]/95 p-4 text-[#e7efe9] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-[top,left] duration-200 ease-out motion-reduce:transition-none"
      style={{ left: position.left, top: position.top, width: TOUR_CARD_WIDTH }}
    >
      {/* Header: step counter + progress */}
      <div className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-300">
          {t('tour.stepLabel')} {stepNumber}/{totalSteps}
        </span>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label={t('tour.progressAria')}
          aria-valuemin={0}
          aria-valuemax={totalSteps}
          aria-valuenow={stepNumber}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5">
        <h2 id={labelId} className="text-[15px] font-bold leading-snug text-white">
          {title}
        </h2>
        <p id={descriptionId} className="text-xs leading-relaxed text-white/70">
          {body}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-1 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          aria-label={t('tour.back')}
        >
          {t('tour.back')}
        </button>
        <button
          ref={actionRef}
          type="button"
          onClick={isLast ? onFinish : onNext}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-[#05270f] shadow-[0_6px_18px_-4px_rgba(16,163,74,0.65)] transition-colors hover:bg-emerald-400"
          aria-label={isLast ? t('tour.finish') : t('tour.next')}
        >
          {isLast ? t('tour.finish') : t('tour.next')}
        </button>
      </div>
    </section>
  )
}
