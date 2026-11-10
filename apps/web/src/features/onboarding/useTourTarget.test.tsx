import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTourTarget } from './useTourTarget'

const TARGET_SELECTOR = '[data-tour="facility-dock"]'

const DESKTOP_RECT = { left: 100, top: 80, width: 320, height: 44 }
const MOBILE_RECT = { left: 12, top: 640, width: 280, height: 40 }

/**
 * jsdom has no layout engine: getBoundingClientRect always returns zeros.
 * Route rect reads through a per-element registry so tests can fake the
 * visible geometry of each duplicate.
 */
const rectRegistry = new Map<HTMLElement, { left: number; top: number; width: number; height: number }>()

beforeAll(() => {
  // jsdom (without pretendToVisual) lacks rAF, which useTourTarget relies on.
  window.requestAnimationFrame ??= ((callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(performance.now()), 0)) as typeof window.requestAnimationFrame
  window.cancelAnimationFrame ??= ((handle: number) =>
    window.clearTimeout(handle)) as typeof window.cancelAnimationFrame
})

beforeEach(() => {
  // re-applied every test: vitest `restoreMocks: true` resets spies between tests.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const box = rectRegistry.get(this) ?? { left: 0, top: 0, width: 0, height: 0 }
    return {
      ...box,
      right: box.left + box.width,
      bottom: box.top + box.height,
      x: box.left,
      y: box.top,
      toJSON() {
        return box
      },
    } as DOMRect
  })
})

afterEach(() => {
  rectRegistry.clear()
})

function mountDuplicateTargets(): { mobile: HTMLElement; desktop: HTMLElement } {
  // Mirror the responsive layout: DOM-first instance = mobile copy shown
  // below the `sm` breakpoint (`sm:hidden`), second instance = desktop copy
  // hidden below `sm` (`hidden sm:block`).
  const mobile = document.createElement('div')
  mobile.setAttribute('data-tour', 'facility-dock')
  mobile.style.display = 'none'
  const desktop = document.createElement('div')
  desktop.setAttribute('data-tour', 'facility-dock')
  mobile.appendChild(document.createTextNode('mobile dock'))
  desktop.appendChild(document.createTextNode('desktop dock'))
  document.body.append(mobile, desktop)
  return { mobile, desktop }
}

describe('useTourTarget', () => {
  it('resolves the first visible duplicate, skipping display:none targets', async () => {
    const { mobile, desktop } = mountDuplicateTargets()
    rectRegistry.set(desktop, DESKTOP_RECT)

    const { result } = renderHook(() => useTourTarget(TARGET_SELECTOR, true))

    await waitFor(() => expect(result.current).not.toBeNull())
    expect(mobile.getAttribute('data-tour')).toBe('facility-dock')
    expect(result.current).toMatchObject(DESKTOP_RECT)
  })

  it('reports null on steps whose target is hidden or zero-size at the current breakpoint', async () => {
    mountDuplicateTargets()

    const { result } = renderHook(() => useTourTarget(TARGET_SELECTOR, true))

    await waitFor(() => expect(result.current).toBeNull())
  })

  it('follows the visible duplicate when the breakpoint swaps which copy is shown', async () => {
    const { mobile, desktop } = mountDuplicateTargets()
    rectRegistry.set(desktop, DESKTOP_RECT)

    const { result } = renderHook(() => useTourTarget(TARGET_SELECTOR, true))

    await waitFor(() => expect(result.current).toMatchObject(DESKTOP_RECT))

    // Simulate a viewport crossing the `sm` breakpoint: the mobile copy is
    // shown, the desktop copy hides, and geometry changes.
    mobile.style.display = 'block'
    desktop.style.display = 'none'
    rectRegistry.delete(desktop)
    rectRegistry.set(mobile, MOBILE_RECT)
    window.dispatchEvent(new Event('resize'))

    await waitFor(() => expect(result.current).toMatchObject(MOBILE_RECT))
  })
})
