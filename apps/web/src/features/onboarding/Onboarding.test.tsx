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

function ReplayFixture() {
  const controller = useOnboarding(TOUR_STEPS.length)
  if (!controller.isActive) {
    return (
      <div data-testid="tour-inactive">
        <button type="button" onClick={controller.restart}>
          Bantuan
        </button>
      </div>
    )
  }
  return (
    <div>
      <OnboardingOverlay controller={controller} steps={TOUR_STEPS} />
      <button type="button">Bantuan</button>
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

/** Simulate a Help-button replay session over the full tour skeleton. */
function renderReplay() {
  return render(
    <I18nProvider>
      <ReplayFixture />
    </I18nProvider>,
  )
}

describe('mandatory onboarding', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('includes language and theme steps between region and categories', () => {
    expect(TOUR_STEPS).toHaveLength(9)
    expect(TOUR_STEPS.map((step) => step.id)).toEqual([
      'welcome',
      'map',
      'region',
      'language',
      'theme',
      'categories',
      'details',
      'environment',
      'data-sources',
    ])
    expect(TOUR_STEPS[3].selector).toBe('[data-tour="language-switcher"]')
    expect(TOUR_STEPS[3].titleKey).toBe('tour.stepLanguage.title')
    expect(TOUR_STEPS[4].selector).toBe('[data-tour="theme-toggle"]')
    expect(TOUR_STEPS[4].titleKey).toBe('tour.stepTheme.title')
  })

  it('starts automatically on the first visit with the hero panel', () => {
    renderTour()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('data-variant', 'hero')
    expect(document.body.dataset.tourStep).toBe('1')
    expect(within(dialog).getByText(/Pahami kotamu, lewat data\./)).toBeInTheDocument()
    expect(within(dialog).getByText(/Luma · Local Urban Mapping and Analytics/)).toBeInTheDocument()
    expect(within(dialog).getAllByText('Faskes').length).toBeGreaterThan(0)
    expect(within(dialog).getByRole('button', { name: 'Mulai Tur' })).toBeInTheDocument()
    // Mandatory: no Finish before the final step, Back disabled on step one.
    expect(within(dialog).queryByRole('button', { name: 'Selesai' })).not.toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Kembali' })).toBeDisabled()
  })

  it('the hero CTA advances to the standard spotlight step card', () => {
    renderTour()
    fireEvent.click(screen.getByRole('button', { name: 'Mulai Tur' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('data-variant', 'default')
    expect(dialog).toHaveAttribute('data-step', '2')
    expect(document.body.dataset.tourStep).toBe('2')
  })

  it('publishes the progressive reveal step on <body> and restores it after finishing', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, completed: false, currentStep: TOUR_STEPS.length - 1 }),
    )
    renderTour()
    expect(document.body.dataset.tourStep).toBe(String(TOUR_STEPS.length))
    fireEvent.click(screen.getByRole('button', { name: 'Selesai' }))
    expect(document.body.dataset.tourStep).toBeUndefined()
  })

  it('advances steps with Next and persists progress', () => {
    renderTour()
    fireEvent.click(screen.getByRole('button', { name: 'Mulai Tur' }))
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

  it('never renders Skip during a mandatory first-visit tour', () => {
    renderTour()
    expect(screen.queryByRole('button', { name: 'Lewati Tur' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mulai Tur' }))
    expect(screen.queryByRole('button', { name: 'Lewati Tur' })).not.toBeInTheDocument()
  })

  it('Help opens a replay session from step one and offers Skip', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, completed: true, currentStep: 0 }),
    )
    renderReplay()
    expect(screen.getByTestId('tour-inactive')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Bantuan' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('data-variant', 'hero')
    expect(dialog).toHaveAttribute('data-step', '1')
    expect(document.body.dataset.tourStep).toBe('1')
    expect(within(dialog).getByRole('button', { name: 'Lewati Tur' })).toBeInTheDocument()
  })

  it('Skip in replay closes the tour, keeps completed, and stays closed on refresh', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, completed: true, currentStep: 0 }),
    )
    const view = renderReplay()
    fireEvent.click(screen.getByRole('button', { name: 'Bantuan' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lewati Tur' }))
    expect(screen.getByTestId('tour-inactive')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
      version: 1,
      completed: true,
    })
    // A "refresh" (fresh mount) returns straight to the dashboard.
    view.unmount()
    renderReplay()
    expect(screen.getByTestId('tour-inactive')).toBeInTheDocument()
  })

  it('a completed replay keeps its completed status', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, completed: true, currentStep: 0 }),
    )
    renderReplay()
    fireEvent.click(screen.getByRole('button', { name: 'Bantuan' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mulai Tur' }))
    // Re-query per step: content is keyed by step and remounts through a
    // light enter animation, so a captured node goes stale after one click.
    for (let index = 0; index < TOUR_STEPS.length - 2; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
    }
    fireEvent.click(screen.getByRole('button', { name: 'Selesai' }))
    expect(screen.getByTestId('tour-inactive')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
      version: 1,
      completed: true,
    })
  })

  it('Skip works on every replay step, not only the first', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, completed: true, currentStep: 0 }),
    )
    renderReplay()
    fireEvent.click(screen.getByRole('button', { name: 'Bantuan' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mulai Tur' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
    expect(screen.getByRole('dialog')).toHaveAttribute('data-step', '3')
    fireEvent.click(screen.getByRole('button', { name: 'Lewati Tur' }))
    expect(screen.getByTestId('tour-inactive')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
      completed: true,
    })
  })

  it('renders the card with a live target element present', () => {
    render(
      <I18nProvider>
        <ProbeFixture />
      </I18nProvider>,
    )
    expect(screen.getByRole('dialog', { name: /Pahami kotamu/ })).toBeInTheDocument()
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
