import { useCallback, useEffect, useState } from 'react'

import type { TourRect } from './types'

const DETECT_FRAMES = 24
const DETECT_INTERVAL_MS = 60

function areRectsEqual(a: TourRect | null, b: TourRect | null): boolean {
  if (a === null || b === null) return a === b
  return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height
}

/**
 * Tracks the viewport-space bounding rect of a tour target element.
 *
 * - Re-measures on window resize, capture-phase scroll, and element size
 *   changes (ResizeObserver on the target itself).
 * - Runs a short burst of checks right after activation to catch the lazy
 *   mounted MapLibre canvas and entry animations.
 * - A missing, hidden, or zero-size target reports `null` instead of hanging.
 */
export function useTourTarget(selector: string | null, active: boolean): TourRect | null {
  const [rect, setRect] = useState<TourRect | null>(null)

  const measure = useCallback(() => {
    if (!selector) {
      setRect((prev) => (prev === null ? prev : null))
      return
    }
    const element = document.querySelector(selector)
    if (!(element instanceof HTMLElement)) {
      setRect((prev) => (prev === null ? prev : null))
      return
    }
    const style = window.getComputedStyle(element)
    if (style.display === 'none' || style.visibility === 'hidden') {
      setRect((prev) => (prev === null ? prev : null))
      return
    }
    const box = element.getBoundingClientRect()
    if (box.width <= 0 && box.height <= 0) {
      setRect((prev) => (prev === null ? prev : null))
      return
    }
    const next: TourRect = {
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
    }
    setRect((prev) => (areRectsEqual(prev, next) ? prev : next))
  }, [selector])

  useEffect(() => {
    if (!active) return

    // Measure before the next paint so the spotlight never flashes at the
    // wrong spot (requestAnimationFrame callbacks run pre-paint).
    const firstFrame = requestAnimationFrame(measure)

    let observer: ResizeObserver | null = null
    const attachObserver = () => {
      const element = selector ? document.querySelector(selector) : null
      if (element instanceof HTMLElement && typeof ResizeObserver === 'function') {
        observer = new ResizeObserver(measure)
        observer.observe(element)
      }
    }
    attachObserver()

    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)

    let detectTimer = 0
    let frame = 0
    detectTimer = window.setInterval(() => {
      measure()
      frame += 1
      if (frame >= DETECT_FRAMES) window.clearInterval(detectTimer)
    }, DETECT_INTERVAL_MS)

    return () => {
      cancelAnimationFrame(firstFrame)
      observer?.disconnect()
      observer = null
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      if (detectTimer !== 0) window.clearInterval(detectTimer)
    }
  }, [active, selector, measure])

  return active ? rect : null
}
