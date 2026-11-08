import { useState, useEffect } from 'react'
import { FullScreenMapDashboard } from './features/dashboard/components/FullScreenMapDashboard'
import { DashboardHeader } from './features/dashboard/components/DashboardHeader'
import { DataSourcesComingSoonPage } from './features/dashboard/components/DataSourcesComingSoonPage'
import { OnboardingOverlay } from './features/onboarding/OnboardingOverlay'
import { useOnboarding } from './features/onboarding/useOnboarding'
import { TOUR_STEPS } from './features/onboarding/tour-steps'

export default function App() {
  const [activeWilayah, setActiveWilayah] = useState<string>('ALL')
  const [currentView, setCurrentView] = useState<'dashboard' | 'sumber-data'>(() => {
    return window.location.hash === '#sumber-data' ? 'sumber-data' : 'dashboard'
  })
  const onboarding = useOnboarding(TOUR_STEPS.length)

  // Sinkronisasi navigasi dengan browser hash
  useEffect(() => {
    function handleHashChange() {
      if (window.location.hash === '#sumber-data') {
        setCurrentView('sumber-data')
      } else {
        setCurrentView('dashboard')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleNavigateToDataSources = () => {
    window.location.hash = 'sumber-data'
    setCurrentView('sumber-data')
  }

  const handleBackToDashboard = () => {
    window.location.hash = ''
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
          <DataSourcesComingSoonPage onBack={handleBackToDashboard} />
        )}
      </main>

      {/* 3. Mandatory first-visit guided tour (spotlight layer above all UI) */}
      {onboarding.isActive ? <OnboardingOverlay controller={onboarding} steps={TOUR_STEPS} /> : null}
    </div>
  )
}
