import { useState } from 'react'
import { ComingSoonView } from './features/dashboard/components/ComingSoonView'
import { FullScreenMapDashboard } from './features/dashboard/components/FullScreenMapDashboard'
import { DashboardHeader, type ViewMode } from './features/dashboard/components/DashboardHeader'

export type AppViewMode = ViewMode

export default function App() {
  const [viewMode, setViewMode] = useState<AppViewMode>('fullscreen-map')

  return (
    <div className="flex flex-col h-screen h-dvh bg-background text-foreground overflow-hidden">
      {/* 1. Single Unified Navbar (Clean 3-Column Header) */}
      <DashboardHeader viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* 2. Main Viewport — Map is the primary workspace */}
      <main className="flex-1 min-h-0 w-full relative overflow-hidden bg-background">
        {viewMode === 'fullscreen-map' ? (
          <FullScreenMapDashboard />
        ) : (
          <div className="flex h-full items-center justify-center p-6 sm:p-10">
            <ComingSoonView onBackToMap={() => setViewMode('fullscreen-map')} />
          </div>
        )}
      </main>
    </div>
  )
}
