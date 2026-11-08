import { useCallback, useEffect, useMemo, useState } from 'react'

import { loadOnboardingState, saveOnboardingState } from './onboarding-storage'
import type {
  ActiveTourSession,
  OnboardingController,
  OnboardingStatus,
} from './types'

const STATE_VERSION = 1

function clampStep(step: number, totalSteps: number): number {
  return Math.min(Math.max(Math.floor(step), 0), Math.max(totalSteps - 1, 0))
}

/**
 * Controller of the conditional mandatory onboarding (Task 2).
 *
 * State model separates the user completion status from the transient
 * tutorial session:
 * - `completed` (persisted): set once by `finish()`. Replay sessions and
 *   Skip never write it false again.
 * - `session` (in-memory): `first_visit` resumes from the persisted step so
 *   a refresh continues the mandatory tour; `replay` sessions are started
 *   only from Help, live per page-load, and are closed by Skip/Finish.
 *
 * Persistence writes `{version, completed, currentStep}` where `currentStep`
 * mirrors the active first-visit session — with `completed: true` stored,
 * readers ignore it, so replay step writes cannot turn a completed user into
 * an unfinished one.
 */
export function useOnboarding(totalSteps: number): OnboardingController {
  const [completed, setCompleted] = useState<boolean>(() => {
    return loadOnboardingState()?.completed ?? false
  })

  const [session, setSession] = useState<ActiveTourSession | null>(() => {
    const stored = loadOnboardingState()
    if (!stored) return { mode: 'first_visit', step: 0 }
    if (!stored.completed) {
      return { mode: 'first_visit', step: clampStep(stored.currentStep, totalSteps) }
    }
    // Completed returning user: dashboard first; Help opens a replay session.
    return null
  })

  // Persist on every transition so a refresh resumes the exact mandatory step.
  useEffect(() => {
    saveOnboardingState({
      version: STATE_VERSION,
      completed,
      currentStep: session ? session.step : 0,
    })
  }, [completed, session])

  const next = useCallback(() => {
    setSession((current) => {
      if (!current) return current
      return { ...current, step: clampStep(current.step + 1, totalSteps) }
    })
  }, [totalSteps])

  const back = useCallback(() => {
    setSession((current) => {
      if (!current) return current
      return { ...current, step: clampStep(current.step - 1, totalSteps) }
    })
  }, [totalSteps])

  /** Finish: completion is the one irreversible user status. */
  const finish = useCallback(() => {
    setCompleted(true)
    setSession(null)
  }, [])

  /** Help entry point: replay (skippable) for completed users, otherwise
   * re-arms the mandatory session. Never resets the completion status. */
  const restart = useCallback(() => {
    setSession((current) => {
      if (current) return current
      return {
        mode: completed ? 'replay' : 'first_visit',
        step: 0,
      }
    })
  }, [completed])

  /** Skip (replay only): closes the session; `completed` stays untouched. */
  const skip = useCallback(() => {
    setSession((current) => (current?.mode === 'replay' ? null : current))
  }, [])

  const isActive = session !== null
  const status: OnboardingStatus = session
    ? 'in_progress'
    : completed
      ? 'completed'
      : 'not_started'
  const canSkip = session?.mode === 'replay'

  return useMemo(
    () => ({
      isActive,
      currentStep: session ? session.step : 0,
      totalSteps,
      completed,
      status,
      mode: session ? session.mode : null,
      canSkip,
      next,
      back,
      finish,
      restart,
      skip,
    }),
    [
      isActive,
      session,
      totalSteps,
      completed,
      status,
      canSkip,
      next,
      back,
      finish,
      restart,
      skip,
    ],
  )
}
