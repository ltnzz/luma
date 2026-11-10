import { describe, expect, it } from 'vitest'
import { createFacilityMarkerElement } from './map-marker'

describe('createFacilityMarkerElement', () => {
  it('tags the wrapper with the onboarding visibility hook (no visual side effects)', () => {
    const { wrapperEl } = createFacilityMarkerElement('kesehatan')
    expect(wrapperEl.classList.contains('luma-facility-marker')).toBe(true)
    expect(wrapperEl.className).toContain('relative flex items-center justify-center')
  })
})
