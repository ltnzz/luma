import { useCallback, useEffect, useMemo, useState } from 'react'

import { useTranslation } from '../../i18n/useTranslation'
import { SpotlightOverlay } from './SpotlightOverlay'
import { TutorialCard } from './TutorialCard'
import { useTourTarget } from './useTourTarget'
import { OnboardingFacilityPreview } from './components/OnboardingFacilityPreview'
import { OnboardingEnvironmentalPreview } from './components/OnboardingEnvironmentalPreview'
import type { OnboardingController, TourRect, TourStep } from './types'

/** A target that covers (almost) the whole viewport gets a full dim + centered card. */
function isNearFullViewport(rect: TourRect): boolean {
  return rect.width >= window.innerWidth * 0.92 && rect.height >= window.innerHeight * 0.92
}

const MAP_READY_TIMEOUT_MS = 6000
const MAP_READY_POLL_MS = 150

/**
 * The MapLibre canvas mounts lazily; poll until it appears so the opening
 * step can reveal the map (vignette backdrop) instead of guessing.
 */
function useMapReady(enabled: boolean): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let firstFrame = 0
    const check = () => {
      if (document.querySelector('.maplibregl-canvas')) {
        setReady(true)
        return true
      }
      return false
    }
    // Async so the effect body itself never sets state synchronously.
    firstFrame = requestAnimationFrame(() => {
      if (check()) return
      startPolling()
    })
    let elapsed = 0
    let timer = 0
    function startPolling() {
      timer = window.setInterval(() => {
        elapsed += MAP_READY_POLL_MS
        if (check() || elapsed >= MAP_READY_TIMEOUT_MS) {
          window.clearInterval(timer)
        }
      }, MAP_READY_POLL_MS)
    }
    return () => {
      cancelAnimationFrame(firstFrame)
      if (timer !== 0) window.clearInterval(timer)
    }
  }, [enabled])

  return enabled && ready
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
  const [isExiting, setIsExiting] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false,
  )

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const stepCount = steps.length

  const stepIndex = Math.min(
    Math.max(controller.currentStep, 0),
    Math.max(stepCount - 1, 0),
  )
  const step = steps[stepIndex]
  const isHeroStep = stepIndex === 0

  const preview = useMemo(() => {
    if (!isMobile || !step) return null
    if (step.id === 'details') {
      return <OnboardingFacilityPreview />
    }
    if (step.id === 'environment') {
      return <OnboardingEnvironmentalPreview />
    }
    return null
  }, [isMobile, step])

  const rawRect = useTourTarget(step?.selector ?? null, controller.isActive)
  const rect = useMemo(
    () => (rawRect !== null && isNearFullViewport(rawRect) ? null : rawRect),
    [rawRect],
  )

  // Vignette backdrop only when the map canvas is actually rendered.
  const mapReady = useMapReady(controller.isActive && isHeroStep)

  // Progressive dashboard reveal: publish the active step on <body> so CSS
  // can show only components already introduced (see data-tour rules in
  // global.css). Elements stay mounted (visibility only) so no state resets.
  useEffect(() => {
    if (!controller.isActive || !step || isExiting) return
    document.body.dataset.tourStep = String(stepIndex + 1)
    return () => {
      delete document.body.dataset.tourStep
    }
  }, [controller.isActive, stepIndex, step, isExiting])

  // Coordinated finale exit animation: plays the combined Pulse Wave &
  // Atmospheric Horizon Lift sequence before executing controller.finish().
  const handleFinish = useCallback(() => {
    if (isExiting) return

    const isReducedMotion =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ||
        import.meta.env.MODE === 'test')

    if (isReducedMotion) {
      delete document.body.dataset.tourStep
      delete document.body.dataset.tourExiting
      controller.finish()
      return
    }

    setIsExiting(true)

    // Unveil all dashboard components immediately so they are revealed
    // under the dissolving backdrop and horizon sweep
    delete document.body.dataset.tourStep
    document.body.dataset.tourExiting = 'true'

    const timer = window.setTimeout(() => {
      delete document.body.dataset.tourExiting
      controller.finish()
    }, 1050)

    return () => window.clearTimeout(timer)
  }, [isExiting, controller])

  // Block page scrolling only while the mandatory tour is open.
  useEffect(() => {
    if (!controller.isActive) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      delete document.body.dataset.tourStep
      delete document.body.dataset.tourExiting
    }
  }, [controller.isActive])

  if (!step) return null

  return (
    <>
      <SpotlightOverlay
        rect={rect}
        backdrop={isHeroStep && mapReady ? 'vignette' : 'solid'}
        isExiting={isExiting}
      />
      <TutorialCard
        rect={rect}
        placement={step.placement}
        title={t(step.titleKey)}
        body={t(step.bodyKey)}
        stepNumber={stepIndex + 1}
        totalSteps={stepCount}
        isFirst={stepIndex === 0}
        isLast={stepIndex === stepCount - 1}
        isExiting={isExiting}
        variant={isHeroStep ? 'hero' : 'default'}
        preview={preview}
        onBack={controller.back}
        onNext={controller.next}
        onFinish={handleFinish}
        onSkip={controller.canSkip ? controller.skip : undefined}
        labelId={`luma-tour-title-${step.id}`}
        descriptionId={`luma-tour-body-${step.id}`}
      />
    </>
  )
}
