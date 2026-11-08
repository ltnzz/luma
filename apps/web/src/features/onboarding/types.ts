import type { TranslationKey } from '../../i18n/dictionaries'

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center'

export interface TourStep {
  /** Stable id used as React key. */
  id: string
  /**
   * DOM selector of the spotlight target (data-tour attribute).
   * `null` renders a centered card with a fully dimmed backdrop.
   */
  selector: string | null
  titleKey: TranslationKey
  bodyKey: TranslationKey
  /** Preferred placement of the tutorial card relative to the target. */
  placement: TourPlacement
}

export interface TourRect {
  left: number
  top: number
  width: number
  height: number
}

/** Persisted onboarding state shape (versioned localStorage). */
export interface OnboardingState {
  version: number
  completed: boolean
  currentStep: number
}

export interface OnboardingController {
  /** Whether the guided tour is currently shown. */
  isActive: boolean
  /** Zero-based index of the active step. */
  currentStep: number
  totalSteps: number
  completed: boolean
  next: () => void
  back: () => void
  finish: () => void
  /** Restart the tutorial from the first step (Help entry point). */
  restart: () => void
}
