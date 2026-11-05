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
 * - 5 kategori lengkap (Air Bersih, Faskes, Ruang Hijau, Sekolah, Transum) selalu terlihat utuh
 * - Status aktif jelas melalui highlight tema warna tanpa indikator dekoratif berulang
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
  const { language, t } = useTranslation()
  const formatCount = (value: number | null) =>
    value === null ? '—' : value.toLocaleString(language === 'id' ? 'id-ID' : 'en-US')

  return (
    <div
      className="pointer-events-auto flex w-[calc(100vw-1rem)] items-center justify-start gap-0.5 overflow-x-auto rounded-xl luma-map-card luma-glass-hover pl-3.5 pr-2.5 py-1.5 select-none scrollbar-none snap-x snap-mandatory animate-in fade-in slide-in-from-bottom-3 duration-300 sm:w-max sm:max-w-[96vw] sm:justify-between sm:gap-1 sm:overflow-visible"
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
        aria-pressed={activeCategory === 'air'}
      >
        <CategoryIconBadge category="water" active={activeCategory === 'air'} />
        <div className="flex flex-col whitespace-nowrap">
          <span className="text-[10.5px] font-semibold leading-tight text-muted">{t('mapFirst.dock.water')}</span>
          <span className="flex items-baseline gap-1 text-sm font-bold leading-tight text-foreground">
            <span>{waterCoverage}%</span>
            <span className="text-[9.5px] font-medium text-muted">{waterCoverageLabel === 'Akses' ? t('mapFirst.dock.access') : waterCoverageLabel}</span>
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
        aria-pressed={activeCategory === 'kesehatan'}
      >
        <CategoryIconBadge category="health" active={activeCategory === 'kesehatan'} />
        <div className="flex flex-col whitespace-nowrap">
          <span className="text-[10.5px] font-semibold leading-tight text-muted">{t('mapFirst.dock.health')}</span>
          <span className="text-sm font-bold leading-tight text-foreground">
            {formatCount(faskesCount)} <span className="text-[9.5px] font-medium text-muted">{t('mapFirst.dock.healthUnit')}</span>
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
        aria-pressed={activeCategory === 'rth'}
      >
        <CategoryIconBadge category="green" active={activeCategory === 'rth'} />
        <div className="flex flex-col whitespace-nowrap">
          <span className="text-[10.5px] font-semibold leading-tight text-muted">{t('mapFirst.dock.green')}</span>
          <span className="text-sm font-bold leading-tight text-foreground">
            {formatCount(rthCount)} <span className="text-[9.5px] font-medium text-muted">{t('mapFirst.dock.greenUnit')}</span>
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
        aria-pressed={activeCategory === 'sekolah'}
      >
        <CategoryIconBadge category="school" active={activeCategory === 'sekolah'} />
        <div className="flex flex-col whitespace-nowrap">
          <span className="text-[10.5px] font-semibold leading-tight text-muted">{t('mapFirst.dock.school')}</span>
          <span className="text-sm font-bold leading-tight text-foreground">
            {formatCount(schoolCount)}{' '}
            <span className="text-[9.5px] font-medium text-muted">{t('mapFirst.dock.schoolUnit')}</span>
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
        aria-pressed={activeCategory === 'transum'}
      >
        <CategoryIconBadge category="transit" active={activeCategory === 'transum'} />
        <div className="flex flex-col whitespace-nowrap">
          <span className="text-[10.5px] font-semibold leading-tight text-muted">{t('mapFirst.dock.transit')}</span>
          <span className="text-sm font-bold leading-tight text-foreground">
            {transitCorridorCount}{' '}
            <span className="text-[9.5px] font-medium text-muted">{t('mapFirst.dock.transitUnit')}</span>
          </span>
        </div>
      </button>
    </div>
  )
}
