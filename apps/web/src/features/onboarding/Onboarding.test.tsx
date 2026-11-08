import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { I18nProvider } from '../../i18n/I18nProvider'
import { OnboardingOverlay } from './OnboardingOverlay'
import { useOnboarding } from './useOnboarding'
import { TOUR_STEPS } from './tour-steps'
import type { TourStep } from './types'

const STORAGE_KEY = 'luma_onboarding_v1'

function Fixture() {
  const controller = useOnboarding(TOUR_STEPS.length)
  if (!controller.isActive) return <div data-testid="tour-inactive" />
  return <OnboardingOverlay controller={controller} steps={TOUR_STEPS} />
}

const probeStep: TourStep = {
  id: 'probe',
  selector: '[data-tour="probe-target"]',
  titleKey: 'tour.step1.title',
  bodyKey: 'tour.step1.body',
  placement: 'bottom',
}

function ProbeFixture() {
  const controller = useOnboarding(1)
  if (!controller.isActive) return <div data-testid="tour-inactive" />
  return (
    <div>
      <button type="button" data-tour="probe-target">
        target
      </button>
      <OnboardingOverlay controller={controller} steps={[probeStep]} />
    </div>
  )
}

function renderTour() {
  return render(
    <I18nProvider>
      <Fixture />
    </I18nProvider>,
  )
}

describe('mandatory onboarding', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('starts automatically on the first visit', () => {
    renderTour()
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Selamat datang di Luma/)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Lanjut' })).toBeInTheDocument()
    // Mandatory: no Finish before the final step, Back disabled on step one.
    expect(within(dialog).queryByRole('button', { name: 'Selesai' })).not.toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Kembali' })).toBeDisabled()
  })

  it('advances steps with Next and persists progress', () => {
    renderTour()
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
    expect(screen.getByRole('dialog')).toHaveAttribute('data-step', '2')
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
      version: 1,
      completed: false,
      currentStep: 1,
    })
  })

  it('resumes an unfinished tour on the persisted step', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, completed: false, currentStep: 3 }),
    )
    renderTour()
    expect(screen.getByRole('dialog')).toHaveAttribute('data-step', '4')
  })

  it('only shows Finish on the final step and marks the tour completed', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, completed: false, currentStep: TOUR_STEPS.length - 1 }),
    )
    renderTour()
    fireEvent.click(screen.getByRole('button', { name: 'Selesai' }))
    expect(screen.getByTestId('tour-inactive')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
      version: 1,
      completed: true,
    })
  })

  it('does not auto-start after completion', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, completed: true, currentStep: TOUR_STEPS.length - 1 }),
    )
    renderTour()
    expect(screen.getByTestId('tour-inactive')).toBeInTheDocument()
  })

  it('renders the card with a live target element present', () => {
    render(
      <I18nProvider>
        <ProbeFixture />
      </I18nProvider>,
    )
    expect(screen.getByRole('dialog', { name: /Selamat datang di Luma/ })).toBeInTheDocument()
  })

  it('ignores corrupted and outdated stored state', () => {
    window.localStorage.setItem(STORAGE_KEY, 'not json')
    renderTour()
    expect(screen.getByRole('dialog')).toHaveAttribute('data-step', '1')
  })

  it('ignores stored state with an incompatible version', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, completed: true }))
    renderTour()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
