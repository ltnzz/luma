import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { computeCardPosition, computeHeroPosition, type Position } from './card-position'
import { OnboardingOverlay } from './OnboardingOverlay'
import { useOnboarding } from './useOnboarding'
import { TOUR_STEPS } from './tour-steps'
import { I18nProvider } from '../../i18n/I18nProvider'
import { getOnboardingFacilityPreview } from './data/facility-preview-provider'
import { getOnboardingEnvironmentalPreview } from './data/environmental-preview-provider'
import type { TourRect } from './types'

function overlaps(
  pos: Position,
  cardSize: { width: number; height: number },
  rect: TourRect,
): boolean {
  return !(
    pos.left + cardSize.width <= rect.left ||
    pos.left >= rect.left + rect.width ||
    pos.top + cardSize.height <= rect.top ||
    pos.top >= rect.top + rect.height
  )
}

describe('TASK 1: Mobile Tooltip Responsiveness & Collision Avoidance (Step 2)', () => {
  // Mobile map-controls typical bounds on the bottom-right
  const getMobileMapControlsRect = (viewportWidth: number, viewportHeight: number): TourRect => ({
    left: viewportWidth - 44, // 12px margin + 32px width
    top: viewportHeight - 160,
    width: 32,
    height: 120,
  })

  const testViewports = [
    { name: '320 × 640 (Compact mobile)', width: 320, height: 640 },
    { name: '360 × 740 (Standard Android / Galaxy)', width: 360, height: 740 },
    { name: '375 × 667 (iPhone SE / 8)', width: 375, height: 667 },
    { name: '390 × 844 (iPhone 12/13/14)', width: 390, height: 844 },
    { name: '412 × 915 (Pixel 9 / Samsung A51)', width: 412, height: 915 },
    { name: '430 × 932 (iPhone Pro Max)', width: 430, height: 932 },
    { name: '640 × 360 (Mobile Landscape compact)', width: 640, height: 360 },
    { name: '844 × 390 (Mobile Landscape iPhone)', width: 844, height: 390 },
  ]

  for (const vp of testViewports) {
    it(`keeps Step 2 card within viewport and avoids overlapping map controls on ${vp.name}`, () => {
      const rect = getMobileMapControlsRect(vp.width, vp.height)
      const cardWidth = Math.min(340, vp.width - 24)
      const cardHeight = 210

      const pos = computeCardPosition(rect, { width: cardWidth, height: cardHeight }, 'left', {
        width: vp.width,
        height: vp.height,
      })

      // 1. Must stay within viewport boundaries
      expect(pos.left).toBeGreaterThanOrEqual(12)
      expect(pos.top).toBeGreaterThanOrEqual(12)
      expect(pos.left + cardWidth).toBeLessThanOrEqual(vp.width - 12)
      expect(pos.top + cardHeight).toBeLessThanOrEqual(vp.height - 12)

      // 2. Must NEVER overlap the map controls spotlight target
      const collides = overlaps(pos, { width: cardWidth, height: cardHeight }, rect)
      expect(collides).toBe(false)
    })
  }

  it('preserves desktop positioning to the left of the map controls without collision', () => {
    const desktopViewport = { width: 1280, height: 800 }
    const desktopRect: TourRect = {
      left: 1232,
      top: 600,
      width: 32,
      height: 120,
    }
    const cardSize = { width: 340, height: 210 }

    const pos = computeCardPosition(desktopRect, cardSize, 'left', desktopViewport)

    // On desktop, it fits directly to the left (1232 - 12 - 340 = 880)
    expect(pos.left).toBe(1232 - 12 - cardSize.width)
    expect(pos.top).toBeGreaterThanOrEqual(12)
    expect(overlaps(pos, cardSize, desktopRect)).toBe(false)
  })
})

describe('TASK 2: Mobile-Specific Facility Detail Preview (Step 7)', () => {
  it('provides representative facility data from actual dataset', () => {
    const facility = getOnboardingFacilityPreview()
    expect(facility).toBeDefined()
    expect(facility.name).toBe('Puskesmas Kecamatan Gambir')
    expect(facility.category).toBe('kesehatan')
    expect(facility.wilayah).toBe('JAKARTA PUSAT')
    expect(facility.address).toContain('Gambir')
    expect(facility.specs?.Status).toBe('Puskesmas Terakreditasi Paripurna')
    expect(facility.budget?.source).toBe('APBD DKI Jakarta')
  })

  it('renders facility preview on mobile and omits on desktop', () => {
    function TourStep7Harness({ isMobile }: { isMobile: boolean }) {
      // Mock window.innerWidth
      window.innerWidth = isMobile ? 375 : 1024

      const controller = useOnboarding(TOUR_STEPS.length)
      // Step 7 is index 6
      const modifiedController = {
        ...controller,
        isActive: true,
        currentStep: 6,
      }

      return (
        <I18nProvider>
          <OnboardingOverlay controller={modifiedController} steps={TOUR_STEPS} />
        </I18nProvider>
      )
    }

    // On mobile: preview is displayed
    const { unmount } = render(<TourStep7Harness isMobile={true} />)
    expect(screen.getByTestId('onboarding-facility-preview')).toBeInTheDocument()
    expect(screen.getByText('Puskesmas Kecamatan Gambir')).toBeInTheDocument()
    unmount()

    // On desktop: preview is NOT displayed (preserves desktop layout)
    render(<TourStep7Harness isMobile={false} />)
    expect(screen.queryByTestId('onboarding-facility-preview')).not.toBeInTheDocument()
  })
})

describe('TASK 3: Mobile-Specific Environmental Preview (Step 8)', () => {
  it('provides transparent environmental data with accurate provenance', () => {
    const envData = getOnboardingEnvironmentalPreview()
    expect(envData).toBeDefined()
    expect(envData.air.aqi).toBe(74)
    expect(envData.air.status).toBe('Sedang')
    expect(envData.air.pm25).toBe('22.4 µg/m³')
    expect(envData.air.isDirectSensor).toBe(false) // Never claims to be direct SPKU sensor
    expect(envData.air.source).toContain('Open-Meteo')
    expect(envData.water.source).toContain('PAM JAYA')
    expect(envData.water.name).toContain('Kalimalang')
  })

  it('renders environmental preview on mobile and omits on desktop', () => {
    function TourStep8Harness({ isMobile }: { isMobile: boolean }) {
      window.innerWidth = isMobile ? 390 : 1280

      const controller = useOnboarding(TOUR_STEPS.length)
      // Step 8 is index 7
      const modifiedController = {
        ...controller,
        isActive: true,
        currentStep: 7,
      }

      return (
        <I18nProvider>
          <OnboardingOverlay controller={modifiedController} steps={TOUR_STEPS} />
        </I18nProvider>
      )
    }

    // On mobile: preview is displayed
    const { unmount } = render(<TourStep8Harness isMobile={true} />)
    expect(screen.getByTestId('onboarding-environmental-preview')).toBeInTheDocument()
    expect(screen.getByText('Saluran Pasokan Air Baku Kalimalang (Tarum Barat)')).toBeInTheDocument()
    unmount()

    // On desktop: preview is NOT displayed (preserves desktop layout)
    render(<TourStep8Harness isMobile={false} />)
    expect(screen.queryByTestId('onboarding-environmental-preview')).not.toBeInTheDocument()
  })
})

describe('Fix: Mobile Onboarding Welcome Screen (Step 1) Centering', () => {
  const testViewports = [
    { name: '320 × 640 (Compact mobile)', width: 320, height: 640 },
    { name: '360 × 740 (Standard Android / Galaxy)', width: 360, height: 740 },
    { name: '375 × 667 (iPhone SE / 8)', width: 375, height: 667 },
    { name: '390 × 844 (iPhone 12/13/14)', width: 390, height: 844 },
    { name: '412 × 915 (Pixel 9 / Samsung A51)', width: 412, height: 915 },
    { name: '430 × 932 (iPhone Pro Max)', width: 430, height: 932 },
    { name: '640 × 360 (Mobile Landscape compact)', width: 640, height: 360 },
    { name: '844 × 390 (Mobile Landscape iPhone)', width: 844, height: 390 },
  ]

  for (const vp of testViewports) {
    it(`centers Step 1 horizontally and vertically on ${vp.name} within safe margins`, () => {
      const isMobile = vp.width < 640
      const cardWidth = Math.min(560, vp.width - 24)
      const cardHeight = 320

      const pos = computeHeroPosition({ width: cardWidth, height: cardHeight }, vp, isMobile)

      // 1. Must stay within safe viewport margins (>= 12)
      expect(pos.left).toBeGreaterThanOrEqual(12)
      expect(pos.top).toBeGreaterThanOrEqual(12)
      expect(pos.left + cardWidth).toBeLessThanOrEqual(vp.width - 12)
      expect(pos.top + cardHeight).toBeLessThanOrEqual(vp.height - 12)

      // 2. On mobile, must be centered vertically and horizontally
      if (isMobile) {
        const expectedLeft = Math.round((vp.width - cardWidth) / 2)
        const expectedTop = Math.round((vp.height - cardHeight) / 2)
        expect(Math.abs(pos.left - expectedLeft)).toBeLessThanOrEqual(1)
        expect(Math.abs(pos.top - expectedTop)).toBeLessThanOrEqual(1)
      }
    })
  }

  it('preserves desktop bottom-anchored hero panel position on desktop screens', () => {
    const desktopViewport = { width: 1280, height: 800 }
    const cardSize = { width: 560, height: 280 }

    const pos = computeHeroPosition(cardSize, desktopViewport, false)

    // On desktop, it is anchored to the bottom edge: viewport.height - cardSize.height - 28
    expect(pos.top).toBe(800 - 280 - 28)
    expect(pos.left).toBe((1280 - 560) / 2)
  })

  it('renders Step 1 with full title, category chips, description, and CTA button visible', () => {
    function TourStep1Harness() {
      window.innerWidth = 375
      window.innerHeight = 667

      const controller = useOnboarding(TOUR_STEPS.length)
      const step1Controller = {
        ...controller,
        isActive: true,
        currentStep: 0,
      }

      return (
        <I18nProvider>
          <OnboardingOverlay controller={step1Controller} steps={TOUR_STEPS} />
        </I18nProvider>
      )
    }

    render(<TourStep1Harness />)

    // Title & Brand
    expect(screen.getByText('Pahami kotamu, lewat data.')).toBeInTheDocument()
    expect(screen.getByText(/Luma ·/i)).toBeInTheDocument()

    // Real dashboard categories
    expect(screen.getByText('Faskes')).toBeInTheDocument()
    expect(screen.getByText('Ruang Hijau')).toBeInTheDocument()
    expect(screen.getByText('Sekolah')).toBeInTheDocument()
    expect(screen.getByText('Transum')).toBeInTheDocument()
    expect(screen.getByText('Air Bersih')).toBeInTheDocument()

    // CTA action button
    expect(screen.getByRole('button', { name: /Mulai Tur/i })).toBeInTheDocument()
  })
})
