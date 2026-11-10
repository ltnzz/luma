import { useCallback, useEffect, useRef, useState } from 'react'

import type { TourRect } from './types'

/** Paint-aligned settle checks right after activation/step changes. */
const SETTLE_FRAMES = 18

function areRectsEqual(a: TourRect | null, b: TourRect | null): boolean {
  if (a === null || b === null) return a === b
  return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height
}

/**
 * Responsive layouts may mount the same tour target twice (the facility
 * category dock exists as a mobile copy inside the left stack and a desktop
 * copy at the bottom center). Resolve the first *visible* match instead of
 * the DOM-first one, so the spotlight never silently follows a
 * `display: none` duplicate.
 */
function resolveVisibleTarget(selector: string): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(selector))
  for (const element of candidates) {
    const style = window.getComputedStyle(element)
    if (style.display === 'none' || style.visibility === 'hidden') continue
    const box = element.getBoundingClientRect()
    if (box.width <= 0 && box.height <= 0) continue
    return element
  }
  return null
}

/**
 * Tracks the viewport-space bounding rect of a tour target element.
 *
 * All layout reads are rAF-coalesced: at most one `getBoundingClientRect()`
 * per paint, instead of timer-driven reads between paints. Setup uses a
 * short paint-aligned settle burst (replacing the old 24 x 60 ms interval)
 * to catch the lazy-mount MapLibre canvas and mount animations; afterwards
 * a ResizeObserver plus passive scroll/resize listeners schedule re-measures.
 * A missing, hidden, or zero-size target reports `null` instead of hanging.
 */
export function useTourTarget(selector: string | null, active: boolean): TourRect | null {
  const [rect, setRect] = useState<TourRect | null>(null)
  const observedRef = useRef<HTMLElement | null>(null)

  const measure = useCallback(() => {
    if (!selector) {
      setRect((prev) => (prev === null ? prev : null))
      return null
    }
    const element = resolveVisibleTarget(selector)
    if (!element) {
      setRect((prev) => (prev === null ? prev : null))
      return null
    }
    const box = element.getBoundingClientRect()
    const next: TourRect = {
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
    }
    setRect((prev) => (areRectsEqual(prev, next) ? prev : next))
    return element
  }, [selector])

  useEffect(() => {
    if (!active) return
    let disposed = false
    let pendingFrame = 0
    let settleFrames = 0
    let observer: ResizeObserver | null = null

    // Track the element that currently owns the ResizeObserver: crossing a
    // breakpoint swaps the visible duplicate, so the observer must follow.
    const attachObserver = (element: HTMLElement) => {
      if (observedRef.current === element) return
      observer?.disconnect()
      observer = null
      observedRef.current = element
      if (typeof ResizeObserver !== 'function') return
      observer = new ResizeObserver(() => scheduleMeasure())
      observer.observe(element)
    }

    const scheduleMeasure = () => {
      if (pendingFrame !== 0 || disposed) return
      pendingFrame = requestAnimationFrame(() => {
        if (disposed) return
        pendingFrame = 0
        const element = measure()
        if (element) attachObserver(element)
        if (settleFrames > 0) {
          settleFrames -= 1
          scheduleMeasure()
        }
      })
    }

    // One early read + a short settle burst, all paint-aligned: catches the
    // lazy MapLibre canvas and entry animations without interval timers.
    settleFrames = SETTLE_FRAMES
    scheduleMeasure()

    const handleViewportChange = () => scheduleMeasure()
    window.addEventListener('resize', handleViewportChange, { passive: true })
    window.addEventListener('scroll', handleViewportChange, { capture: true, passive: true })

    return () => {
      disposed = true
      if (pendingFrame !== 0) cancelAnimationFrame(pendingFrame)
      observer?.disconnect()
      observer = null
      observedRef.current = null
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [active, selector, measure])

  return active ? rect : null
}
