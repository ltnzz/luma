import { CategoryIconBadge } from '../../../components/ui/CategoryIconBadge'
import { useTranslation } from '../../../i18n/useTranslation'

export type KpiCategory = 'air' | 'kesehatan' | 'rth' | 'sekolah' | 'transum'

interface KpiMetricsDockProps {
  waterCoverage?: number
  waterCoverageLabel?: string
  isWaterActive?: boolean
  faskesCount: number | null
  rthCount: number | null
  schoolCount: number | null
  transitCorridorCount?: number
  activeCategory?: KpiCategory | null
  onFilterCategory?: (category: KpiCategory) => void
}

/**
 * KpiMetricsDock — Dock Ringkasan Metrik Makro Utama & Kontroler Filter Kategori
 * Didesain proporsional, ringkas, dan responsif:
 * - Setiap kategori tampil sebagai kartu mandiri dalam baris yang dapat digeser
 * - Status aktif jelas melalui highlight tema warna tanpa indikator dekoratif berulang
 * - Dimensi seimbang dan tidak bertabrakan dengan legenda di kolom kiri
 */
export function KpiMetricsDock({
  waterCoverage = 68,
  isWaterActive = true,
  faskesCount,
  rthCount,
  schoolCount,
  transitCorridorCount = 13,
  activeCategory = null,
  onFilterCategory,
}: KpiMetricsDockProps) {
  const { language, t } = useTranslation()
  const mobileLabels = language === 'id'
    ? { water: 'Air', health: 'Kesehatan', green: 'RTH', school: 'Sekolah', transit: 'Transit' }
    : { water: 'Water', health: 'Health', green: 'Green', school: 'Schools', transit: 'Transit' }
  const formatCount = (value: number | null) =>
    value === null ? '—' : value.toLocaleString(language === 'id' ? 'id-ID' : 'en-US')
  const itemClassName = 'luma-map-card luma-glass-hover luma-kpi-pill snap-start flex h-12 w-[88px] min-w-[88px] shrink-0 cursor-pointer items-center justify-start gap-1.5 rounded-xl border border-border/45 px-2 py-1.5 text-left whitespace-nowrap transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:w-[118px] sm:min-w-[118px] sm:gap-2 sm:px-2.5'

  return (
    <div
      className="pointer-events-auto flex w-full max-w-[360px] touch-pan-x snap-x snap-mandatory items-center justify-start gap-2 overflow-x-auto overscroll-x-contain px-0.5 py-1 select-none scrollbar-none animate-in fade-in slide-in-from-bottom-3 duration-300 sm:w-max sm:max-w-[96vw] sm:gap-2.5 sm:overflow-visible"
      aria-label={t('mapFirst.dock.aria')}
      data-tour="facility-dock"
    >
      {/* 1. Air Bersih */}
      <button
        type="button"
        onClick={() => onFilterCategory?.('air')}
        className={`${itemClassName} ml-0.5 ${
          activeCategory === 'air'
            ? 'border-sky-400/55 bg-sky-500/[0.12]'
            : 'hover:border-sky-400/30 hover:bg-sky-500/[0.06]'
        }`}
        data-water-active={isWaterActive}
        aria-label={t('mapFirst.dock.water')}
        aria-pressed={activeCategory === 'air'}
      >
        <CategoryIconBadge category="water" active={activeCategory === 'air'} />
        <div className="flex min-w-0 flex-col items-start whitespace-nowrap">
          <span className="max-w-full truncate text-[8.5px] font-semibold leading-tight text-muted sm:hidden">{mobileLabels.water}</span>
          <span className="hidden max-w-full truncate text-[10.5px] font-semibold leading-tight text-muted sm:block">{t('mapFirst.dock.water')}</span>
          <span className="flex items-baseline text-xs font-bold leading-tight text-foreground sm:text-sm">
            <span>{waterCoverage}%</span>
          </span>
        </div>
      </button>

      {/* 2. Faskes */}
      <button
        type="button"
        onClick={() => onFilterCategory?.('kesehatan')}
        className={`${itemClassName} ${
          activeCategory === 'kesehatan'
            ? 'border-rose-400/55 bg-rose-500/[0.12]'
            : 'hover:border-rose-400/30 hover:bg-rose-500/[0.06]'
        }`}
        aria-label={t('mapFirst.dock.health')}
        aria-pressed={activeCategory === 'kesehatan'}
      >
        <CategoryIconBadge category="health" active={activeCategory === 'kesehatan'} />
        <div className="flex min-w-0 flex-col items-start whitespace-nowrap">
          <span className="max-w-full truncate text-[8.5px] font-semibold leading-tight text-muted sm:hidden">{mobileLabels.health}</span>
          <span className="hidden max-w-full truncate text-[10.5px] font-semibold leading-tight text-muted sm:block">{t('mapFirst.dock.health')}</span>
          <span className="flex items-baseline text-xs font-bold leading-tight text-foreground sm:text-sm">
            <span>{formatCount(faskesCount)}</span>
          </span>
        </div>
      </button>

      {/* 3. Ruang Hijau */}
      <button
        type="button"
        onClick={() => onFilterCategory?.('rth')}
        className={`${itemClassName} ${
          activeCategory === 'rth'
            ? 'border-emerald-400/55 bg-emerald-500/[0.12]'
            : 'hover:border-emerald-400/30 hover:bg-emerald-500/[0.06]'
        }`}
        aria-label={t('mapFirst.dock.green')}
        aria-pressed={activeCategory === 'rth'}
      >
        <CategoryIconBadge category="green" active={activeCategory === 'rth'} />
        <div className="flex min-w-0 flex-col items-start whitespace-nowrap">
          <span className="max-w-full truncate text-[8.5px] font-semibold leading-tight text-muted sm:hidden">{mobileLabels.green}</span>
          <span className="hidden max-w-full truncate text-[10.5px] font-semibold leading-tight text-muted sm:block">{t('mapFirst.dock.green')}</span>
          <span className="flex items-baseline text-xs font-bold leading-tight text-foreground sm:text-sm">
            <span>{formatCount(rthCount)}</span>
          </span>
        </div>
      </button>

      {/* 4. Sekolah */}
      <button
        type="button"
        onClick={() => onFilterCategory?.('sekolah')}
        className={`${itemClassName} ${
          activeCategory === 'sekolah'
            ? 'border-blue-400/55 bg-blue-500/[0.12]'
            : 'hover:border-blue-400/30 hover:bg-blue-500/[0.06]'
        }`}
        aria-label={t('mapFirst.dock.school')}
        aria-pressed={activeCategory === 'sekolah'}
      >
        <CategoryIconBadge category="school" active={activeCategory === 'sekolah'} />
        <div className="flex min-w-0 flex-col items-start whitespace-nowrap">
          <span className="max-w-full truncate text-[8.5px] font-semibold leading-tight text-muted sm:hidden">{mobileLabels.school}</span>
          <span className="hidden max-w-full truncate text-[10.5px] font-semibold leading-tight text-muted sm:block">{t('mapFirst.dock.school')}</span>
          <span className="flex items-baseline text-xs font-bold leading-tight text-foreground sm:text-sm">
            <span>{formatCount(schoolCount)}</span>
          </span>
        </div>
      </button>

      {/* 5. Transum (Diberikan Padding Kanan Ekstra agar Tidak Tertutup Lengkungan Sudut) */}
      <button
        type="button"
        onClick={() => onFilterCategory?.('transum')}
        className={`${itemClassName} ${
          activeCategory === 'transum'
            ? 'border-purple-400/55 bg-purple-500/[0.12]'
            : 'hover:border-purple-400/30 hover:bg-purple-500/[0.06]'
        }`}
        aria-label={t('mapFirst.dock.transit')}
        aria-pressed={activeCategory === 'transum'}
      >
        <CategoryIconBadge category="transit" active={activeCategory === 'transum'} />
        <div className="flex min-w-0 flex-col items-start whitespace-nowrap">
          <span className="max-w-full truncate text-[8.5px] font-semibold leading-tight text-muted sm:hidden">{mobileLabels.transit}</span>
          <span className="hidden max-w-full truncate text-[10.5px] font-semibold leading-tight text-muted sm:block">{t('mapFirst.dock.transit')}</span>
          <span className="flex items-baseline text-xs font-bold leading-tight text-foreground sm:text-sm">
            <span>{transitCorridorCount}</span>
          </span>
        </div>
      </button>
    </div>
  )
}
