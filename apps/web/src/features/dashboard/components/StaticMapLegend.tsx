import { CategoryIconBadge } from '../../../components/ui/CategoryIconBadge'
import { useTranslation } from '../../../i18n/useTranslation'

/**
 * StaticMapLegend — Legenda Simbol Peta Ringkas & Statis
 * Memberikan informasi murni makna simbol/layer tanpa data angka,
 * didesain sangat ramping agar pas di layar tanpa memicu scrollbar.
 */
interface StaticMapLegendProps {
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

export function StaticMapLegend({ isOpen = false, onOpenChange }: StaticMapLegendProps) {
  const { t } = useTranslation()

  return (
    <details
      data-dashboard="legend-dropdown"
      open={isOpen}
      onToggle={(event) => onOpenChange?.(event.currentTarget.open)}
      className="group pointer-events-auto w-[min(72vw,270px)] overflow-hidden rounded-xl luma-map-card luma-glass-hover select-none animate-in fade-in slide-in-from-left-2 duration-300 scrollbar-none sm:w-[280px]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 marker:content-none">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wide text-foreground">
            {t('dashboard.legend.title')}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted">{t('mapFirst.legend.symbols')}</span>
          <svg className="size-3.5 text-muted transition-transform duration-200 group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </summary>

      {/* Daftar Simbol Murni (Tanpa Data Angka) */}
      <div className="mx-3 flex flex-col gap-0.5 border-t border-border/60 pb-2 pt-1.5 text-xs">
        {/* 1. Fasilitas Kesehatan */}
        <div className="luma-glass-row grid min-h-7 grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1.5 py-0.5">
          <CategoryIconBadge category="health" size="sm" />
          <span className="font-medium leading-tight text-foreground text-[11px]">
            {t('mapFirst.legend.health')}
          </span>
          <span className="break-words text-right text-[9.5px] font-medium leading-tight text-muted">{t('mapFirst.legend.healthSub')}</span>
        </div>

        {/* 2. Ruang Terbuka Hijau */}
        <div className="luma-glass-row grid min-h-7 grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1.5 py-0.5">
          <CategoryIconBadge category="green" size="sm" />
          <span className="font-medium leading-tight text-foreground text-[11px]">
            {t('mapFirst.legend.green')}
          </span>
          <span className="break-words text-right text-[9.5px] font-medium leading-tight text-muted">{t('mapFirst.legend.greenSub')}</span>
        </div>

        {/* 3. Sekolah Negeri */}
        <div className="luma-glass-row grid min-h-7 grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1.5 py-0.5">
          <CategoryIconBadge category="school" size="sm" />
          <span className="font-medium leading-tight text-foreground text-[11px]">
            {t('mapFirst.legend.school')}
          </span>
          <span className="break-words text-right text-[9.5px] font-medium leading-tight text-muted">{t('mapFirst.legend.schoolSub')}</span>
        </div>

        {/* 4. Rute Transum */}
        <div className="luma-glass-row grid min-h-7 grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1.5 py-0.5">
          <CategoryIconBadge category="transit" size="sm" />
          <span className="font-medium leading-tight text-foreground text-[11px]">
            {t('mapFirst.legend.transit')}
          </span>
          <span className="break-words text-right text-[9.5px] font-medium leading-tight text-muted">{t('mapFirst.legend.transitSub')}</span>
        </div>

        {/* 5. Jaringan Pipa Air Bersih PAM JAYA */}
        <div className="luma-glass-row grid min-h-7 grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1.5 py-0.5">
          <CategoryIconBadge category="water" size="sm" />
          <span className="font-medium leading-tight text-foreground text-[11px]">
            {t('mapFirst.legend.water')}
          </span>
          <span className="break-words text-right text-[9.5px] font-medium leading-tight text-muted">{t('mapFirst.legend.waterSub')}</span>
        </div>

        {/* 6. Batas Wilayah */}
        <div className="luma-glass-row grid min-h-7 grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1.5 py-0.5">
          <CategoryIconBadge category="boundary" size="sm" />
          <span className="font-medium leading-tight text-foreground text-[11px]">
            {t('mapFirst.legend.boundary')}
          </span>
          <span className="break-words text-right text-[9.5px] font-medium leading-tight text-muted">{t('mapFirst.legend.boundarySub')}</span>
        </div>
      </div>
    </details>
  )
}
