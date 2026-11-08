import { useEffect, useState } from 'react'

import type { TourRect } from './types'

const HOLE_PAD = 6
const HOLE_RADIUS = 14

export const OVERLAY_DIM_COLOR = 'rgba(5, 12, 8, 0.68)'

interface SpotlightOverlayProps {
  /** Rect of the highlighted target in viewport space, or `null` for full dim. */
  rect: TourRect | null
}

function getHolePath(rect: TourRect, viewportWidth: number, viewportHeight: number): string | null {
  const x = Math.max(0, rect.left - HOLE_PAD)
  const y = Math.max(0, rect.top - HOLE_PAD)
  const right = Math.min(viewportWidth, rect.left + rect.width + HOLE_PAD)
  const bottom = Math.min(viewportHeight, rect.top + rect.height + HOLE_PAD)
  const width = right - x
  const height = bottom - y
  if (width <= 0 || height <= 0) return null
  const r = Math.min(HOLE_RADIUS, width / 2, height / 2)
  return (
    `M0 0 H${viewportWidth} V${viewportHeight} H0 Z ` +
    `M${x + r} ${y} H${right - r} A${r} ${r} 0 0 1 ${right} ${y + r} V${bottom - r} ` +
    `A${r} ${r} 0 0 1 ${right - r} ${bottom} H${x + r} ` +
    `A${r} ${r} 0 0 1 ${x} ${bottom - r} V${y + r} ` +
    `A${r} ${r} 0 0 1 ${x + r} ${y} Z`
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getRingRect(rect: TourRect, viewportWidth: number, viewportHeight: number): TourRect | null {
  const width = clamp(rect.width + HOLE_PAD * 2, 0, viewportWidth)
  const height = clamp(rect.height + HOLE_PAD * 2, 0, viewportHeight)
  if (width <= 0 || height <= 0) return null
  return {
    left: clamp(rect.left - HOLE_PAD, 0, viewportWidth - width),
    top: clamp(rect.top - HOLE_PAD, 0, viewportHeight - height),
    width,
    height,
  }
}

/**
 * Fixed overlay layer above the whole application UI.
 * Renders a semi-transparent backdrop with an evenodd punch-through hole at
 * the target, plus an emerald focus ring around the hole. The backdrop
 * intercepts all pointer events, so the underlying dashboard is not
 * interactive while the mandatory tour is open; there is no dismiss path.
 *
 * The spotlight never touches MapLibre internals — it is a standalone layer.
 */
export function SpotlightOverlay({ rect }: SpotlightOverlayProps) {
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const holePath =
    rect !== null ? getHolePath(rect, viewport.width, viewport.height) : null
  const ringRect = rect !== null ? getRingRect(rect, viewport.width, viewport.height) : null

  const backdropPath =
    holePath ??
    `M0 0 H${viewport.width} V${viewport.height} H0 Z`

  return (
    <div className="fixed inset-0 z-[90]" aria-hidden="true" data-testid="tour-spotlight">
      <svg width={viewport.width} height={viewport.height} className="block">
        <path
          d={backdropPath}
          fill={OVERLAY_DIM_COLOR}
          fillRule="evenodd"
          className="luma-tour-backdrop"
        />
      </svg>
      {ringRect ? (
        <div
          className="luma-tour-ring pointer-events-none absolute rounded-[14px] border-2 border-primary shadow-[0_0_0_5px_rgba(34,197,94,0.22),0_0_24px_rgba(34,197,94,0.18)]"
          style={{
            left: ringRect.left,
            top: ringRect.top,
            width: ringRect.width,
            height: ringRect.height,
          }}
        />
      ) : null}
    </div>
  )
}
