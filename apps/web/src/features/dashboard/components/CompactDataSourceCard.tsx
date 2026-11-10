import { ChevronRightIcon } from '../../../components/ui/Icons'
import { CategoryIconBadge } from '../../../components/ui/CategoryIconBadge'
import { useTranslation } from '../../../i18n/useTranslation'

interface CompactDataSourceCardProps {
  onNavigateToDataSources?: () => void
}

/**
 * CompactDataSourceCard — Provenance Sumber Data Resmi (Minimalis & Elegan)
 * Mengusung estetika ultra-minimalis, presisi, dan harmonis dengan panel dashboard:
 * - Badge icon status terverifikasi resmi (emerald)
 * - Typography rapi & bersih tanpa kotak tombol terpotong / berjejal
 * - Direct action pill interaktif yang elegan dengan ChevronRightIcon presisi
 */
export function CompactDataSourceCard({ onNavigateToDataSources }: CompactDataSourceCardProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onNavigateToDataSources}
      data-tour="data-sources"
      className="group pointer-events-auto flex w-[min(72vw,270px)] items-center justify-between gap-2 rounded-xl luma-map-card luma-glass-hover luma-no-lift px-3 py-2 select-none text-left cursor-pointer animate-in fade-in slide-in-from-left-2 sm:w-[280px] sm:px-3.5 sm:py-2.5"
      aria-label={t('mapFirst.data.open')}
    >
      <div className="flex items-center gap-2 min-w-0">
        <CategoryIconBadge category="verified" size="sm" className="group-hover:scale-105" />
        <span className="truncate text-xs font-bold leading-tight text-foreground">
          {t('mapFirst.data.title')}
        </span>
      </div>

      <div className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-emerald-700 transition-colors duration-150 group-hover:text-emerald-600 dark:text-emerald-300">
        <span>{t('mapFirst.data.detail')}</span>
        <ChevronRightIcon
          size={11}
          className="stroke-[2.5] transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </button>
  )
}
