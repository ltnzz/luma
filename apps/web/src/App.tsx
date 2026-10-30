import { useState } from 'react'
import { DashboardPage } from './features/dashboard/page'
import { FullScreenMapDashboard } from './features/dashboard/components/FullScreenMapDashboard'
import { DashboardHeader } from './features/dashboard/components/DashboardHeader'

export type AppViewMode = 'dashboard' | 'fullscreen-map'

export default function App() {
  const [viewMode, setViewMode] = useState<AppViewMode>('fullscreen-map')

  return (
    <div className="flex flex-col h-screen h-dvh bg-background text-foreground overflow-hidden">
      {/* 1. Single Unified Navbar (Clean 3-Column Header) */}
      <DashboardHeader viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* 2. Main Viewport */}
      {viewMode === 'fullscreen-map' ? (
        <main className="flex-1 min-h-0 w-full relative overflow-hidden">
          <FullScreenMapDashboard />
        </main>
      ) : (
        <main className="flex-1 min-h-0 px-4 py-8 sm:px-8 max-w-6xl mx-auto w-full overflow-y-auto">
          <DashboardPage />
        </main>
      )}
    </div>
  )
}
