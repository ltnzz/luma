import type { OnboardingState } from './types'

export const ONBOARDING_STORAGE_KEY = 'luma_onboarding_v1'

export const ONBOARDING_STATE_VERSION = 1

function isValidState(value: unknown): value is OnboardingState {
  if (value === null || typeof value !== 'object') return false
  const state = value as Partial<OnboardingState>
  return (
    state.version === ONBOARDING_STATE_VERSION &&
    typeof state.completed === 'boolean' &&
    typeof state.currentStep === 'number' &&
    Number.isFinite(state.currentStep) &&
    state.currentStep >= 0 &&
    Number.isInteger(state.currentStep)
  )
}

/**
 * Read the persisted onboarding state. Returns `null` when the value is
 * missing, corrupted, incompatible (older version), or storage is blocked.
 */
export function loadOnboardingState(): OnboardingState | null {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidState(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** Persist the state; failures (private mode, quota) are silently ignored. */
export function saveOnboardingState(state: OnboardingState): void {
  try {
    window.localStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ ...state, version: ONBOARDING_STATE_VERSION }),
    )
  } catch {
    // Intentionally non-fatal: a fresh visit simply replays the tutorial.
  }
}

export function clearOnboardingState(): void {
  try {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY)
  } catch {
    // Intentionally non-fatal.
  }
}
