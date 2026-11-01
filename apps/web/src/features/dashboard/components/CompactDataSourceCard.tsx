import { CheckCircleIcon, ChevronRightIcon } from '../../../components/ui/Icons'

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
  return (
    <button
      type="button"
      onClick={onNavigateToDataSources}
      className="group pointer-events-auto flex w-60 sm:w-64 items-center justify-between gap-2 rounded-2xl luma-glass px-2.5 sm:px-3 py-1.5 sm:py-2 hover:shadow-[0_16px_36px_rgba(0,0,0,0.16)] transition-all duration-200 select-none text-left cursor-pointer hover:border-emerald-500/50 active:scale-[0.99] animate-in fade-in slide-in-from-left-2 duration-200"
      title="Buka katalog sumber data resmi DKI Jakarta"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/25 transition-colors">
          <CheckCircleIcon size={12} />
        </span>
        <span className="text-[11px] font-bold text-foreground leading-tight truncate">
          Sumber Data Resmi
        </span>
      </div>

      <div className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-150 shrink-0 shadow-2xs">
        <span>Detail</span>
        <ChevronRightIcon
          size={11}
          className="stroke-[2.5] transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </button>
  )
}
