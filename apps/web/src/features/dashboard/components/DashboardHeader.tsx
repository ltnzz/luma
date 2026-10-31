import { useTranslation } from '../../../i18n/useTranslation'
import { MapIcon, BarChartIcon } from '../../../components/ui/Icons'

interface DashboardHeaderProps {
  viewMode?: 'fullscreen-map' | 'dashboard'
  onViewModeChange?: (mode: 'fullscreen-map' | 'dashboard') => void
  scopeLabel?: string
}

/**
 * Unified Modern Navbar (Clean & Bebas Clutter):
 * - Kiri: Brand Luma + Tag Jakarta Spasial
 * - Tengah: Segmented Tab Peta Spasial vs Ringkasan Sektoral
 * - Kanan: Switch Bahasa [ID | EN]
 *   Note: ThemeToggle sengaja TIDAK ada di header — pengaturan tema kini
 *   eksklusif via kontrol peta kanan-bawah (InteractiveMap) agar tidak
 *   ada dua toggle tema yang redundan. ThemeProvider & persistensi tema
 *   tetap utuh (light/dark tetap didukung).
 */
export function DashboardHeader({
  viewMode = 'fullscreen-map',
  onViewModeChange,
}: DashboardHeaderProps) {
  const { language, setLanguage } = useTranslation()

  return (
    <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6 shadow-2xs">
      {/* 1. Kiri: Brand Logo & Title */}
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-black text-on-primary shadow-xs select-none"
        >
          L
        </span>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-tight text-foreground">Luma</span>
          <span className="hidden sm:inline-flex rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-muted">
            DKI Jakarta
          </span>
        </div>
      </div>

      {/* 2. Tengah: Segmented Switcher Tab (Peta Spasial vs Ringkasan Sektoral) */}
      {onViewModeChange ? (
        <nav aria-label="Mode Tampilan" className="flex items-center rounded-xl border border-border bg-surface-muted p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => onViewModeChange('fullscreen-map')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'fullscreen-map'
                ? 'bg-surface text-foreground shadow-xs'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <MapIcon size={14} className={viewMode === 'fullscreen-map' ? 'text-primary' : ''} />
            <span className="hidden sm:inline">Peta Spasial</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('dashboard')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'dashboard'
                ? 'bg-surface text-foreground shadow-xs'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <BarChartIcon size={14} className={viewMode === 'dashboard' ? 'text-primary' : ''} />
            <span className="hidden sm:inline">Ringkasan Sektoral</span>
          </button>
        </nav>
      ) : null}

      {/* 3. Kanan: Minimalist Utilities (Bahasa [ID | EN]) */}
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-xl border border-border bg-surface-muted p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLanguage('id')}
            className={`rounded-lg px-2 py-1 text-[11px] transition-colors cursor-pointer ${
              language === 'id' ? 'bg-surface text-foreground shadow-2xs' : 'text-muted hover:text-foreground'
            }`}
            title="Bahasa Indonesia"
          >
            ID
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`rounded-lg px-2 py-1 text-[11px] transition-colors cursor-pointer ${
              language === 'en' ? 'bg-surface text-foreground shadow-2xs' : 'text-muted hover:text-foreground'
            }`}
            title="English"
          >
            EN
          </button>
        </div>
      </div>
    </header>
  )
}
