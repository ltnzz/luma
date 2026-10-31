import { useTranslation } from '../../../i18n/useTranslation'
import ThemeToggle from '../../../components/ThemeToggle'
import { MapIcon, BarChartIcon } from '../../../components/ui/Icons'

export type ViewMode = 'fullscreen-map' | 'dashboard'

interface DashboardHeaderProps {
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  scopeLabel?: string
}

/**
 * Unified Modern Navbar (Clean & Bebas Clutter):
 * - Kiri: Brand Luma + Tagline Kepanjangan
 * - Tengah: Segmented Tab Peta Spasial vs Ringkasan Sektoral (Soon)
 * - Kanan: Switch Bahasa [ID | EN] dan ThemeToggle (Icon-Only)
 */
export function DashboardHeader({
  viewMode = 'fullscreen-map',
  onViewModeChange,
}: DashboardHeaderProps) {
  const { language, setLanguage, t } = useTranslation()

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
        <div className="flex flex-col justify-center">
          <span className="text-sm sm:text-base font-bold tracking-tight text-foreground leading-none">
            {t('app.name')}
          </span>
          <span className="text-[10px] font-medium text-muted leading-tight whitespace-nowrap mt-0.5">
            {t('app.tagline')}
          </span>
        </div>
      </div>

      {/* 2. Kanan: Segmented Switcher Tab + Minimalist Utilities (Bahasa [ID | EN] & Theme Icon) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onViewModeChange ? (
          <nav aria-label="Mode Tampilan" className="flex items-center rounded-xl border border-border bg-surface-muted p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => onViewModeChange('fullscreen-map')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'fullscreen-map'
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <MapIcon size={14} className={viewMode === 'fullscreen-map' ? 'text-primary' : ''} />
              <span className="hidden xs:inline">Peta Spasial</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('dashboard')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'dashboard'
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <BarChartIcon size={14} className={viewMode === 'dashboard' ? 'text-primary' : ''} />
              <span className="hidden xs:inline">Ringkasan Sektoral</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1 py-0.2 rounded">
                Soon
              </span>
            </button>
          </nav>
        ) : null}

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

        <ThemeToggle />
      </div>
    </header>
  )
}
