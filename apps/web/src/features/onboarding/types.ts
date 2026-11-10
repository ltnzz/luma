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
  /** User completion status. Never written by replay sessions or Skip. */
  completed: boolean
  /**
   * Resume slot of an unfinished first-visit session. Only consumed while
   * `completed` is false — replay steps never affect mandatory resume, and
   * completed users never auto-start, so it is inert afterwards.
   */
  currentStep: number
}

/** Lifecycle of the onboarding experience (spec Task 2 state machine). */
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed'

/** Why a tutorial session exists: mandatory first visit or Help replay. */
export type OnboardingSessionMode = 'first_visit' | 'replay'

/**
 * An in-flight tutorial session. First-visit sessions persist their step for
 * refresh resume; replay sessions stay in memory and simply vanish on Skip,
 * Finish, or refresh — the stored `completed` flag is never touched.
 */
export interface ActiveTourSession {
  mode: OnboardingSessionMode
  step: number
}

export interface OnboardingController {
  /** Whether the guided tour is currently shown. */
  isActive: boolean
  /** Zero-based index of the active step. */
  currentStep: number
  totalSteps: number
  /** Regular completion state. Rinai dari keberjalanannya bermain Replay. */
  completed: boolean
  /** Lifecycle stage, separate from the transient session. */
  status: OnboardingStatus
  /** Mode of the running session, `null` while no session is active. */
  mode: OnboardingSessionMode | null
  /** Skip is offered exclusively to replay sessions (mode, not step-based). */
  canSkip: boolean
  next: () => void
  back: () => void
  finish: () => void
  /** Open the tutorial again (Help entry point): replay when completed. */
  restart: () => void
  /** Close the tour without touching the completion status (replay only). */
  skip: () => void
}
