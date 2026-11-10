import { useState, useEffect, lazy, Suspense } from 'react'
import { FullScreenMapDashboard } from './features/dashboard/components/FullScreenMapDashboard'
import { DashboardHeader } from './features/dashboard/components/DashboardHeader'
import { useOnboarding } from './features/onboarding/useOnboarding'
import { TOUR_STEPS } from './features/onboarding/tour-steps'

const OnboardingOverlay = lazy(() =>
  import('./features/onboarding/OnboardingOverlay').then((m) => ({
    default: m.OnboardingOverlay,
  }))
)

const DataSourcesComingSoonPage = lazy(() =>
  import('./features/dashboard/components/DataSourcesComingSoonPage').then((m) => ({
    default: m.DataSourcesComingSoonPage,
  }))
)

export default function App() {
  const [activeWilayah, setActiveWilayah] = useState<string>('ALL')
  const [currentView, setCurrentView] = useState<'dashboard' | 'sumber-data'>(() => {
    if (typeof window === 'undefined') return 'dashboard'
    return window.location.pathname.startsWith('/sumber-data') || window.location.hash === '#sumber-data'
      ? 'sumber-data'
      : 'dashboard'
  })
  const onboarding = useOnboarding(TOUR_STEPS.length)

  // Sinkronisasi navigasi dengan browser history (clean paths) & bersihkan legacy hash
  useEffect(() => {
    // Bersihkan legacy hash (#sumber-data atau #) dari URL jika ada
    if (window.location.hash === '#sumber-data') {
      window.history.replaceState({}, '', '/sumber-data')
    } else if (window.location.hash) {
      window.history.replaceState({}, '', window.location.pathname || '/')
    }

    function handlePopState() {
      if (window.location.pathname.startsWith('/sumber-data')) {
        setCurrentView('sumber-data')
      } else {
        setCurrentView('dashboard')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleNavigateToDataSources = () => {
    if (window.location.pathname !== '/sumber-data') {
      window.history.pushState({}, '', '/sumber-data')
    }
    setCurrentView('sumber-data')
  }

  const handleBackToDashboard = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/')
    }
    setCurrentView('dashboard')
  }

  return (
    <div className="flex flex-col h-screen h-dvh bg-background text-foreground overflow-hidden select-none">
      {/* 1. Single Unified Navbar */}
      <DashboardHeader
        activeWilayah={activeWilayah}
        onSelectWilayah={
          currentView === 'dashboard'
            ? (wilayah) => {
                setActiveWilayah(wilayah)
              }
            : undefined
        }
        onRestartTutorial={onboarding.restart}
        onNavigateToDashboard={handleBackToDashboard}
      />

      {/* 2. Main Full-Screen Map Viewport atau Halaman Sumber Data (Coming Soon) */}
      <main className="flex-1 min-h-0 w-full relative overflow-hidden">
        {currentView === 'dashboard' ? (
          <FullScreenMapDashboard
            activeWilayah={activeWilayah}
            onSelectWilayah={setActiveWilayah}
            onNavigateToDataSources={handleNavigateToDataSources}
          />
        ) : (
          <Suspense fallback={null}>
            <DataSourcesComingSoonPage onBack={handleBackToDashboard} />
          </Suspense>
        )}
      </main>

      {/* 3. Mandatory first-visit guided tour (spotlight layer above all UI) */}
      {onboarding.isActive ? (
        <Suspense fallback={null}>
          <OnboardingOverlay controller={onboarding} steps={TOUR_STEPS} />
        </Suspense>
      ) : null}
    </div>
  )
}
