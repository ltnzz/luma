import { useEffect, useMemo } from 'react'

import { useTranslation } from '../../i18n/useTranslation'
import { SpotlightOverlay } from './SpotlightOverlay'
import { TutorialCard } from './TutorialCard'
import { useTourTarget } from './useTourTarget'
import type { OnboardingController, TourRect, TourStep } from './types'

/** A target that covers (almost) the whole viewport gets a full dim + centered card. */
function isNearFullViewport(rect: TourRect): boolean {
  return rect.width >= window.innerWidth * 0.92 && rect.height >= window.innerHeight * 0.92
}

interface OnboardingOverlayProps {
  controller: OnboardingController
  /** Ordered step configuration, separated from this presentation layer. */
  steps: TourStep[]
}

/**
 * Root of the mandatory onboarding experience: renders the spotlight layer,
 * the step card, and handles body-scroll locking. Renders nothing when the
 * tour is inactive or completed.
 */
export function OnboardingOverlay({ controller, steps }: OnboardingOverlayProps) {
  const { t } = useTranslation()
  const stepCount = steps.length

  const stepIndex = Math.min(
    Math.max(controller.currentStep, 0),
    Math.max(stepCount - 1, 0),
  )
  const step = steps[stepIndex]

  const rawRect = useTourTarget(step?.selector ?? null, controller.isActive)
  const rect = useMemo(
    () => (rawRect !== null && isNearFullViewport(rawRect) ? null : rawRect),
    [rawRect],
  )

  // Block page scrolling only while the mandatory tour is open.
  useEffect(() => {
    if (!controller.isActive) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [controller.isActive])

  if (!step) return null

  return (
    <>
      <SpotlightOverlay rect={rect} />
      <TutorialCard
        rect={rect}
        placement={step.placement}
        title={t(step.titleKey)}
        body={t(step.bodyKey)}
        stepNumber={stepIndex + 1}
        totalSteps={stepCount}
        isFirst={stepIndex === 0}
        isLast={stepIndex === stepCount - 1}
        onBack={controller.back}
        onNext={controller.next}
        onFinish={controller.finish}
        labelId={`luma-tour-title-${step.id}`}
        descriptionId={`luma-tour-body-${step.id}`}
      />
    </>
  )
}
