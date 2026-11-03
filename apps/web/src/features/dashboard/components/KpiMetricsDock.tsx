import { CategoryIconBadge } from '../../../components/ui/CategoryIconBadge'
import { useTranslation } from '../../../i18n/useTranslation'

export type KpiCategory = 'air' | 'kesehatan' | 'rth' | 'sekolah' | 'transum'

interface KpiMetricsDockProps {
  waterCoverage?: number
  waterCoverageLabel?: string
  isWaterActive?: boolean
  faskesCount: number
  rthCount: number
  schoolCount: number
  transitCorridorCount?: number
  activeCategory?: KpiCategory | null
  onFilterCategory?: (category: KpiCategory) => void
}

/**
 * KpiMetricsDock — Dock Ringkasan Metrik Makro Utama & Kontroler Filter Kategori
 * Didesain proporsional, ringkas, dan responsif:
 * - 5 kategori lengkap (Air Bersih, Faskes, Ruang Hijau, Sekolah, Transum) selalu terlihat utuh
 * - Status aktif jelas dengan highlight tema warna dan titik indikator
 * - Dimensi seimbang dan tidak bertabrakan dengan legenda di kolom kiri
 */
export function KpiMetricsDock({
  waterCoverage = 68,
  waterCoverageLabel = 'Akses',
  isWaterActive = true,
  faskesCount,
  rthCount,
  schoolCount,
  transitCorridorCount = 13,
  activeCategory = null,
  onFilterCategory,
}: KpiMetricsDockProps) {
  const { t } = useTranslation()

  return (
    <div
      className="pointer-events-auto flex w-[calc(100vw-1rem)] items-center justify-start gap-0.5 overflow-x-auto rounded-xl luma-map-card luma-glass-hover pl-3.5 pr-2.5 py-1.5 select-none scrollbar-none snap-x snap-mandatory animate-in fade-in slide-in-from-bottom-3 duration-300 sm:w-max sm:max-w-[96vw] sm:justify-between sm:gap-1"
      aria-label={t('mapFirst.dock.aria')}
    >
      {/* 1. Air Bersih */}
      <button
        type="button"
        onClick={() => onFilterCategory?.('air')}
        className={`luma-glass-item ml-0.5 snap-start flex min-w-[116px] items-center gap-2 shrink-0 text-left rounded-lg px-2.5 py-1 cursor-pointer border whitespace-nowrap ${
          activeCategory === 'air'
            ? 'bg-sky-500/[0.08] border-transparent'
            : 'border-transparent hover:bg-surface-muted/45'
        } ${isWaterActive ? 'opacity-100' : 'opacity-60'}`}
        title={t('mapFirst.dock.water')}
        data-tooltip={t('mapFirst.dock.water')}
      >
        <CategoryIconBadge category="water" active={activeCategory === 'air'} />
        <div className="flex flex-col whitespace-nowrap">
          <div className="flex items-center gap-1">
            <span className="text-[9.5px] font-semibold text-muted leading-tight">{t('mapFirst.dock.water')}</span>
            <span
              className={`flex h-1.5 w-1.5 rounded-full ${
                isWaterActive ? 'bg-sky-500' : 'bg-muted'
              }`}
            />
          </div>
          <span className="flex items-baseline gap-1 text-xs sm:text-[13px] font-bold text-foreground leading-tight">
            <span>{waterCoverage}%</span>
            <span className="text-[8.5px] font-medium text-muted">{waterCoverageLabel === 'Akses' ? t('mapFirst.dock.access') : waterCoverageLabel}</span>
          </span>
        </div>
      </button>

      {/* 2. Faskes */}
      <button
        type="button"
        onClick={() => onFilterCategory?.('kesehatan')}
        className={`luma-glass-item snap-start flex items-center gap-1.5 sm:gap-2 shrink-0 text-left rounded-lg px-2 py-1 cursor-pointer border whitespace-nowrap ${
          activeCategory === 'kesehatan'
            ? 'bg-rose-500/[0.08] border-transparent'
            : 'border-transparent hover:bg-surface-muted/45'
        }`}
        title={t('mapFirst.dock.health')}
        data-tooltip={t('mapFirst.dock.health')}
      >
        <CategoryIconBadge category="health" active={activeCategory === 'kesehatan'} />
        <div className="flex flex-col whitespace-nowrap">
          <div className="flex items-center gap-1">
            <span className="text-[9.5px] font-semibold text-muted leading-tight">{t('mapFirst.dock.health')}</span>
            {activeCategory === 'kesehatan' && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
          </div>
          <span className="text-xs sm:text-[13px] font-bold text-foreground leading-tight">
            {faskesCount} <span className="text-[8.5px] font-medium text-muted">{t('mapFirst.dock.healthUnit')}</span>
          </span>
        </div>
      </button>

      {/* 3. Ruang Hijau */}
      <button
        type="button"
        onClick={() => onFilterCategory?.('rth')}
        className={`luma-glass-item snap-start flex items-center gap-1.5 sm:gap-2 shrink-0 text-left rounded-lg px-2 py-1 cursor-pointer border whitespace-nowrap ${
          activeCategory === 'rth'
            ? 'bg-emerald-500/[0.08] border-transparent'
            : 'border-transparent hover:bg-surface-muted/45'
        }`}
        title={t('mapFirst.dock.green')}
        data-tooltip={t('mapFirst.dock.green')}
      >
        <CategoryIconBadge category="green" active={activeCategory === 'rth'} />
        <div className="flex flex-col whitespace-nowrap">
          <div className="flex items-center gap-1">
            <span className="text-[9.5px] font-semibold text-muted leading-tight">{t('mapFirst.dock.green')}</span>
            {activeCategory === 'rth' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          </div>
          <span className="text-xs sm:text-[13px] font-bold text-foreground leading-tight">
            {rthCount} <span className="text-[8.5px] font-medium text-muted">{t('mapFirst.dock.greenUnit')}</span>
          </span>
        </div>
      </button>

      {/* 4. Sekolah */}
      <button
        type="button"
        onClick={() => onFilterCategory?.('sekolah')}
        className={`luma-glass-item snap-start flex items-center gap-1.5 sm:gap-2 shrink-0 text-left rounded-lg px-2 py-1 cursor-pointer border whitespace-nowrap ${
          activeCategory === 'sekolah'
            ? 'bg-blue-500/[0.08] border-transparent'
            : 'border-transparent hover:bg-surface-muted/45'
        }`}
        title={t('mapFirst.dock.school')}
        data-tooltip={t('mapFirst.dock.school')}
      >
        <CategoryIconBadge category="school" active={activeCategory === 'sekolah'} />
        <div className="flex flex-col whitespace-nowrap">
          <div className="flex items-center gap-1">
            <span className="text-[9.5px] font-semibold text-muted leading-tight">{t('mapFirst.dock.school')}</span>
            {activeCategory === 'sekolah' && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
          </div>
          <span className="text-xs sm:text-[13px] font-bold text-foreground leading-tight">
            {schoolCount.toLocaleString('id-ID')}{' '}
            <span className="text-[8.5px] font-medium text-muted">{t('mapFirst.dock.schoolUnit')}</span>
          </span>
        </div>
      </button>

      {/* 5. Transum (Diberikan Padding Kanan Ekstra agar Tidak Tertutup Lengkungan Sudut) */}
      <button
        type="button"
        onClick={() => onFilterCategory?.('transum')}
        className={`luma-glass-item snap-start flex items-center gap-1.5 sm:gap-2 shrink-0 text-left rounded-lg px-2.5 py-1 cursor-pointer border whitespace-nowrap ${
          activeCategory === 'transum'
            ? 'bg-purple-500/[0.08] border-transparent'
            : 'border-transparent hover:bg-surface-muted/45'
        }`}
        title={t('mapFirst.dock.transit')}
        data-tooltip={t('mapFirst.dock.transit')}
      >
        <CategoryIconBadge category="transit" active={activeCategory === 'transum'} />
        <div className="flex flex-col whitespace-nowrap">
          <div className="flex items-center gap-1">
            <span className="text-[9.5px] font-semibold text-muted leading-tight">{t('mapFirst.dock.transit')}</span>
            {activeCategory === 'transum' && <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />}
          </div>
          <span className="text-xs sm:text-[13px] font-bold text-foreground leading-tight">
            {transitCorridorCount}{' '}
            <span className="text-[8.5px] font-medium text-muted">{t('mapFirst.dock.transitUnit')}</span>
          </span>
        </div>
      </button>
    </div>
  )
}
