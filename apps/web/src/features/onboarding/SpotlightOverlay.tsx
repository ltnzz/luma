import { useEffect, useMemo, useState } from 'react'

import type { TourRect } from './types'

const HOLE_PAD = 6
const HOLE_RADIUS = 14

export const OVERLAY_DIM_COLOR = 'rgba(5, 12, 8, 0.68)'

type BackdropMode = 'solid' | 'vignette'

interface SpotlightOverlayProps {
  /** Rect of the highlighted target in viewport space, or `null` for full dim. */
  rect: TourRect | null
  /**
   * `solid` = uniform dim (default). `vignette` = soft-edged dim that keeps
   * the map visible in the middle; only used for target-less hero steps.
   */
  backdrop?: BackdropMode
}

interface HoleBox {
  x: number
  y: number
  right: number
  bottom: number
  width: number
  height: number
}

function getHoleBox(rect: TourRect, viewportWidth: number, viewportHeight: number): HoleBox | null {
  const x = Math.max(0, rect.left - HOLE_PAD)
  const y = Math.max(0, rect.top - HOLE_PAD)
  const right = Math.min(viewportWidth, rect.left + rect.width + HOLE_PAD)
  const bottom = Math.min(viewportHeight, rect.top + rect.height + HOLE_PAD)
  const width = right - x
  const height = bottom - y
  if (width <= 0 || height <= 0) return null
  return { x, y, right, bottom, width, height }
}

function getHolePath(box: HoleBox, viewportWidth: number, viewportHeight: number): string {
  const r = Math.min(HOLE_RADIUS, box.width / 2, box.height / 2)
  return (
    `M0 0 H${viewportWidth} V${viewportHeight} H0 Z ` +
    `M${box.x + r} ${box.y} H${box.right - r} A${r} ${r} 0 0 1 ${box.right} ${box.y + r} V${box.bottom - r} ` +
    `A${r} ${r} 0 0 1 ${box.right - r} ${box.bottom} H${box.x + r} ` +
    `A${r} ${r} 0 0 1 ${box.x} ${box.bottom - r} V${box.y + r} ` +
    `A${r} ${r} 0 0 1 ${box.x + r} ${box.y} Z`
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getRingRect(box: HoleBox): TourRect {
  return { left: box.x, top: box.y, width: box.width, height: box.height }
}

/**
 * Rear masks that block pointer interactions on the dimmed area only.
 * The hole region stays free, so steps that target interactive controls
 * (language switcher, theme toggle) let the user actually use them.
 */
function getBlockerRects(
  box: HoleBox | null,
  viewportWidth: number,
  viewportHeight: number,
): TourRect[] {
  if (!box) {
    return [{ left: 0, top: 0, width: viewportWidth, height: viewportHeight }]
  }
  return [
    // Above the hole
    { left: 0, top: 0, width: viewportWidth, height: Math.max(0, box.y) },
    // Below the hole
    {
      left: 0,
      top: box.bottom,
      width: viewportWidth,
      height: Math.max(0, viewportHeight - box.bottom),
    },
    // Left of the hole
    { left: 0, top: box.y, width: Math.max(0, box.x), height: box.height },
    // Right of the hole
    {
      left: box.right,
      top: box.y,
      width: Math.max(0, viewportWidth - box.right),
      height: box.height,
    },
  ].filter((blocker) => blocker.width > 0 && blocker.height > 0)
}

/**
 * Fixed overlay layer above the whole application UI.
 * Visual pass: semi-transparent backdrop with an evenodd punch-through hole at
 * the target plus an emerald focus ring. Interaction pass: four masks that
 * swallow clicks on the dimmed dashboard while leaving the hole click-through
 * for interactive tour targets. No dismiss path exists anywhere in the layer.
 *
 * The spotlight never touches MapLibre internals — it is a standalone layer.
 */
export function SpotlightOverlay({ rect, backdrop = 'solid' }: SpotlightOverlayProps) {
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    // Passive: reads only; layout work stays inside the coalesced measure.
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Geometry recomputes only when rect or viewport actually change.
  const geometry = useMemo(() => {
    const holeBox = rect !== null ? getHoleBox(rect, viewport.width, viewport.height) : null
    const backdropPath = holeBox
      ? getHolePath(holeBox, viewport.width, viewport.height)
      : `M0 0 H${viewport.width} V${viewport.height} H0 Z`
    return {
      holeBox,
      backdropPath,
      ringRect: holeBox !== null ? getRingRect(holeBox) : null,
      blockers: getBlockerRects(holeBox, viewport.width, viewport.height),
    }
  }, [rect, viewport.width, viewport.height])

  return (
    <>
      {/* Visual layer: dim + spotlight hole + ring (never captures events). */}
      <div
        className="pointer-events-none fixed inset-0 z-[90]"
        aria-hidden="true"
        data-testid="tour-spotlight"
      >
        {backdrop === 'vignette' && rect === null ? (
          <div className="luma-tour-vignette absolute inset-0" />
        ) : (
          <svg width={viewport.width} height={viewport.height} className="block">
            <path d={geometry.backdropPath} fill={OVERLAY_DIM_COLOR} fillRule="evenodd" className="luma-tour-backdrop" />
          </svg>
        )}
        {geometry.ringRect ? (
          <div
            className="luma-tour-ring pointer-events-none absolute rounded-[14px] border-2 border-primary shadow-[0_0_0_5px_rgba(34,197,94,0.22),0_0_24px_rgba(34,197,94,0.18)] transition-[left,top,width,height] duration-200 ease-out motion-reduce:transition-none"
            style={{
              left: geometry.ringRect.left,
              top: geometry.ringRect.top,
              width: geometry.ringRect.width,
              height: geometry.ringRect.height,
            }}
          />
        ) : null}
      </div>

      {/* Interaction layer: blocks clicks everywhere except the spotlight hole. */}
      <div className="pointer-events-none fixed inset-0 z-[90]" data-testid="tour-blockers">
        {geometry.blockers.map((blocker, index) => (
          // Stable keys: geometry stays in the style prop, so rect updates
          // mutate in place instead of remounting the four masks.
          <div
            key={`blocker-${index}`}
            className="pointer-events-auto absolute"
            style={{
              left: clamp(blocker.left, 0, viewport.width),
              top: clamp(blocker.top, 0, viewport.height),
              width: blocker.width,
              height: blocker.height,
            }}
          />
        ))}
      </div>
    </>
  )
}
