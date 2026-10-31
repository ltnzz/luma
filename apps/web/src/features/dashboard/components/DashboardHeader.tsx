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
 * Unified Command-Center Navbar:
 * - Kiri: Brand Luma + Tagline + status chip
 * - Tengah: Segmented Tab Peta Spasial vs Ringkasan Sektoral (Soon)
 * - Kanan: Switch Bahasa [ID | EN] dan ThemeToggle (Icon-Only)
 */
export function DashboardHeader({
  viewMode = 'fullscreen-map',
  onViewModeChange,
}: DashboardHeaderProps) {
  const { language, setLanguage, t } = useTranslation()

  return (
    <header
      className="z-40 shrink-0 border-b border-border bg-surface/80 backdrop-blur-md bg-background px-4 sm:px-6"
      style={{ height: '4.5rem' }}
    >
      <div className="flex h-full items-center justify-between gap-4">
        {/* 1. Kiri: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-black text-on-primary shadow-sm select-none"
          >
            L
          </span>
          <div className="flex flex-col justify-center">
            <span className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-none">
              {t('app.name')}
            </span>
          <span className="text-[10px] font-medium text-muted leading-tight mt-0.5 truncate max-w-[14rem]">
            {t('app.tagline')}
          </span>
          </div>
        </div>

        {/* 2. Kanan: Navigasi Map/Analytics, Bahasa, dan Theme Toggle */}
        <div className="flex items-center gap-2">
          {onViewModeChange ? (
            <nav aria-label="Mode Tampilan" className="flex items-center rounded-xl border border-border bg-surface-muted p-1 shadow-sm">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onViewModeChange('fullscreen-map')}
                  className={`flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'fullscreen-map'
                      ? 'bg-surface text-foreground shadow-xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <MapIcon size={14} className={viewMode === 'fullscreen-map' ? 'text-primary' : ''} />
                  <span className="hidden xs:inline">{t('dashboard.map.title')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange('dashboard')}
                  className={`flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'dashboard'
                      ? 'bg-surface text-foreground shadow-xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <BarChartIcon size={14} className={viewMode === 'dashboard' ? 'text-primary' : ''} />
                  <span className="hidden xs:inline">{t('dashboard.indicators.heading')}</span>
                </button>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                {t('dashboard.map.exploreSoon')}
              </span>
            </nav>
          ) : null}

          <div className="flex items-center rounded-xl border border-border bg-surface-muted p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLanguage('id')}
              className={`rounded-lg px-2.5 py-1 text-[11px] transition-colors cursor-pointer ${
                language === 'id' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'
              }`}
              title="Bahasa Indonesia"
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-lg px-2.5 py-1 text-[11px] transition-colors cursor-pointer ${
                language === 'en' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'
              }`}
              title="English"
            >
              EN
            </button>
          </div>

          <ThemeToggle showLabel={false} className="ml-1" />
        </div>
      </div>
    </header>
  )
}
