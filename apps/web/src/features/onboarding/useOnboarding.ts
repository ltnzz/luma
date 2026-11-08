import { useCallback, useEffect, useMemo, useState } from 'react'

import { loadOnboardingState, saveOnboardingState } from './onboarding-storage'
import type { OnboardingController } from './types'

const STATE_VERSION = 1

/**
 * Controller hook of the mandatory onboarding tour.
 *
 * - First visit (no stored state): the tour starts automatically.
 * - Unfinished tour (currentStep > 0, completed false): resumes on mount.
 * - Completed tour: never auto-starts; only `restart()` brings it back.
 * - Progress is persisted so a page refresh continues where the user left off.
 */
export function useOnboarding(totalSteps: number): OnboardingController {
  const [completed, setCompleted] = useState<boolean>(() => {
    return loadOnboardingState()?.completed ?? false
  })
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const stored = loadOnboardingState()
    if (!stored) return 0
    return Math.min(Math.max(stored.currentStep, 0), Math.max(totalSteps - 1, 0))
  })
  const [isRunning, setIsRunning] = useState<boolean>(() => {
    const stored = loadOnboardingState()
    return !stored || !stored.completed
  })

  // Persist on every transition so a refresh resumes the exact step.
  useEffect(() => {
    saveOnboardingState({ version: STATE_VERSION, completed, currentStep })
  }, [completed, currentStep])

  const next = useCallback(() => {
    setCurrentStep((step) => Math.min(step + 1, Math.max(totalSteps - 1, 0)))
  }, [totalSteps])

  const back = useCallback(() => {
    setCurrentStep((step) => Math.max(step - 1, 0))
  }, [])

  const finish = useCallback(() => {
    setCompleted(true)
    setIsRunning(false)
  }, [])

  const restart = useCallback(() => {
    setCompleted(false)
    setCurrentStep(0)
    setIsRunning(true)
  }, [])

  const isActive = isRunning && !completed

  return useMemo(
    () => ({
      isActive,
      currentStep,
      totalSteps,
      completed,
      next,
      back,
      finish,
      restart,
    }),
    [isActive, completed, currentStep, totalSteps, next, back, finish, restart],
  )
}
