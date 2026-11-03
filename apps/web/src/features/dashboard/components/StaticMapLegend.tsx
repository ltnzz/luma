import { CategoryIconBadge } from '../../../components/ui/CategoryIconBadge'
import { useTranslation } from '../../../i18n/useTranslation'

/**
 * StaticMapLegend — Legenda Simbol Peta Ringkas & Statis
 * Memberikan informasi murni makna simbol/layer tanpa data angka,
 * didesain sangat ramping agar pas di layar tanpa memicu scrollbar.
 */
export function StaticMapLegend() {
  const { t } = useTranslation()

  return (
    <div className="pointer-events-auto flex w-[calc(100vw-1rem)] max-w-[330px] flex-col gap-2 rounded-xl luma-map-card luma-glass-hover p-3 select-none animate-in fade-in slide-in-from-left-2 duration-300 sm:w-64">
      {/* Header Legenda */}
      <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <h4 className="text-[10.5px] font-bold text-foreground uppercase tracking-wider">
            {t('dashboard.legend.title')}
          </h4>
        </div>
        <span className="text-[9.5px] text-muted">{t('mapFirst.legend.symbols')}</span>
      </div>

      {/* Daftar Simbol Murni (Tanpa Data Angka) */}
      <div className="flex flex-col gap-1 text-[11px]">
        {/* 1. Fasilitas Kesehatan */}
        <div className="luma-glass-row grid grid-cols-[20px_minmax(0,1fr)_76px] items-center gap-2 rounded-lg px-1 py-0.5">
          <CategoryIconBadge category="health" size="sm" />
          <span className="font-medium text-foreground leading-none">
            {t('mapFirst.legend.health')}
          </span>
          <span className="text-right text-[9.5px] leading-tight text-muted font-normal">{t('mapFirst.legend.healthSub')}</span>
        </div>

        {/* 2. Ruang Terbuka Hijau */}
        <div className="luma-glass-row grid grid-cols-[20px_minmax(0,1fr)_76px] items-center gap-2 rounded-lg px-1 py-0.5">
          <CategoryIconBadge category="green" size="sm" />
          <span className="font-medium text-foreground leading-none">
            {t('mapFirst.legend.green')}
          </span>
          <span className="text-right text-[9.5px] leading-tight text-muted font-normal">{t('mapFirst.legend.greenSub')}</span>
        </div>

        {/* 3. Sekolah Negeri */}
        <div className="luma-glass-row grid grid-cols-[20px_minmax(0,1fr)_76px] items-center gap-2 rounded-lg px-1 py-0.5">
          <CategoryIconBadge category="school" size="sm" />
          <span className="font-medium text-foreground leading-none">
            {t('mapFirst.legend.school')}
          </span>
          <span className="text-right text-[9.5px] leading-tight text-muted font-normal">{t('mapFirst.legend.schoolSub')}</span>
        </div>

        {/* 4. Rute Transum */}
        <div className="luma-glass-row grid grid-cols-[20px_minmax(0,1fr)_76px] items-center gap-2 rounded-lg px-1 py-0.5">
          <CategoryIconBadge category="transit" size="sm" />
          <span className="font-medium text-foreground leading-none">
            {t('mapFirst.legend.transit')}
          </span>
          <span className="text-right text-[9.5px] leading-tight text-muted font-normal">{t('mapFirst.legend.transitSub')}</span>
        </div>

        {/* 5. Jaringan Pipa Air Bersih PAM JAYA */}
        <div className="luma-glass-row grid grid-cols-[20px_minmax(0,1fr)_76px] items-center gap-2 rounded-lg px-1 py-0.5">
          <CategoryIconBadge category="water" size="sm" />
          <span className="font-medium text-foreground leading-none">
            {t('mapFirst.legend.water')}
          </span>
          <span className="text-right text-[9.5px] leading-tight text-muted font-normal">{t('mapFirst.legend.waterSub')}</span>
        </div>

        {/* 6. Batas Wilayah */}
        <div className="luma-glass-row grid grid-cols-[20px_minmax(0,1fr)_76px] items-center gap-2 rounded-lg px-1 py-0.5">
          <CategoryIconBadge category="boundary" size="sm" />
          <span className="font-medium text-foreground leading-none">
            {t('mapFirst.legend.boundary')}
          </span>
          <span className="text-right text-[9.5px] leading-tight text-muted font-normal">{t('mapFirst.legend.boundarySub')}</span>
        </div>
      </div>
    </div>
  )
}
