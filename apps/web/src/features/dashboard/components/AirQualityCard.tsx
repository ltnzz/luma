import { useMemo } from 'react'
import { CategoryIconBadge } from '../../../components/ui/CategoryIconBadge'
import { getAqiLevel, AQI_LEVELS } from '../utils/airQualityLevels'
import { useTranslation } from '../../../i18n/useTranslation'
import { getDataCatalogEntry } from '../../../data/data-catalog'

const CATEGORY_KEYS = [
  'mapFirst.air.good',
  'mapFirst.air.moderate',
  'mapFirst.air.sensitive',
  'mapFirst.air.unhealthy',
  'mapFirst.air.veryUnhealthy',
  'mapFirst.air.hazardous',
] as const

const ADVICE_KEYS = [
  'mapFirst.air.advice.good',
  'mapFirst.air.advice.moderate',
  'mapFirst.air.advice.sensitive',
  'mapFirst.air.advice.unhealthy',
  'mapFirst.air.advice.veryUnhealthy',
  'mapFirst.air.advice.hazardous',
] as const

interface AirQualityCardProps {
  airAqi: number | null
  isAirLive: boolean
  status: 'loading' | 'success' | 'error'
  source?: string | null
  updatedAt?: string | null
}

/**
 * AirQualityCard — Card Kualitas Udara Lengkap dengan Level Kesehatan & Rekomendasi
 * Menampilkan nilai AQI real-time, badge status, bar meter 5 tingkatan, dan panduan kesehatan warga.
 */
export function AirQualityCard({
  airAqi,
  isAirLive,
  status,
  source,
  updatedAt,
}: AirQualityCardProps) {
  const { t, language } = useTranslation()
  const metadata = getDataCatalogEntry('airQuality', language)
  const metaCopy = language === 'id'
    ? { transparency: 'Transparansi data', coverage: 'Cakupan', unit: 'Satuan', method: 'Metode' }
    : { transparency: 'Data transparency', coverage: 'Coverage', unit: 'Unit', method: 'Method' }
  const level = useMemo(() => getAqiLevel(airAqi ?? 0), [airAqi])
  const levelIndex = Math.max(0, AQI_LEVELS.indexOf(level))
  const categoryLabel = t(CATEGORY_KEYS[levelIndex])
  const advice = t(ADVICE_KEYS[levelIndex])
  const hasData = status === 'success' && airAqi !== null

  return (
    <div data-tour="air-quality" className="pointer-events-auto flex w-full max-w-[360px] flex-col gap-2 rounded-2xl luma-map-card luma-glass-hover p-2.5 select-none animate-in fade-in slide-in-from-left-2 duration-200 sm:w-[280px] sm:rounded-xl sm:gap-2.5 sm:p-3.5">
      {/* 1. Header Card */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <CategoryIconBadge category="air" size="sm" />
          <span className="min-w-0 text-[11px] font-bold leading-tight text-foreground sm:text-xs">
            {t('mapFirst.air.title')}
          </span>
        </div>

        {isAirLive && (
          <span
            className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/12 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700 dark:text-emerald-300 sm:px-2 sm:text-[10px]"
            data-tooltip={t('mapFirst.air.liveTitle')}
            data-tooltip-side="bottom"
            data-tooltip-align="right"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('mapFirst.air.live')}
          </span>
        )}
      </div>

      {/* 2. Nilai AQI & Status Kategori (Sesuai Mockup User) */}
      <div className="flex items-center justify-between gap-2 py-1">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center text-xl leading-none"
          role="img"
          aria-label={hasData ? categoryLabel : t(status === 'loading' ? 'mapFirst.air.loading' : 'mapFirst.air.unavailable')}
          title={hasData ? categoryLabel : t(status === 'loading' ? 'mapFirst.air.loading' : 'mapFirst.air.unavailable')}
        >
          {hasData ? level.icon : '🌫️'}
        </span>
        <div className="ml-auto flex min-w-0 items-baseline justify-end gap-1.5 text-right">
          <span className={`text-2xl font-extrabold tracking-tight leading-none ${hasData ? level.textColor : 'text-muted'}`}>
            {hasData ? airAqi : '—'}
          </span>
          <span className="text-[11px] font-semibold text-foreground">{t('mapFirst.air.unit')}</span>
        </div>
      </div>

      <div className="grid h-2 w-full grid-cols-5 gap-1 overflow-visible rounded-full bg-surface-muted/70 p-0.5 sm:hidden" aria-label={`${t('mapFirst.air.healthLevel')}: ${hasData ? categoryLabel : t('mapFirst.air.noValue')}`}>
        {AQI_LEVELS.slice(0, 5).map((lvl) => {
          const isActive = hasData && airAqi >= lvl.min && (lvl.max ? airAqi <= lvl.max : true)
          return (
            <span
              key={lvl.category}
              style={{
                backgroundColor: lvl.color,
                boxShadow: isActive ? `0 0 5px ${lvl.color}, 0 0 11px ${lvl.color}c0` : undefined,
              }}
              className={`h-full rounded-full ${isActive ? 'z-10 scale-y-150 opacity-100 ring-1 ring-white/80' : 'opacity-35'}`}
              title={`${t(CATEGORY_KEYS[AQI_LEVELS.indexOf(lvl)])} (${lvl.min}–${lvl.max})`}
            />
          )
        })}
      </div>

      <div className="hidden flex-col gap-2.5 sm:flex">
        {/* 3. Bar Meter Level Kesehatan Udara (5 Tingkatan) */}
        <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[10.5px] font-medium text-muted">
          <span>{t('mapFirst.air.healthLevel')}</span>
          <span className="font-bold text-foreground">
            {hasData ? categoryLabel : t('mapFirst.air.noValue')}
          </span>
        </div>

        {/* Segmented Gradient Meter */}
        <div className="grid h-2 w-full grid-cols-5 gap-1 overflow-visible rounded-full bg-surface-muted/70 p-0.5">
          {AQI_LEVELS.slice(0, 5).map((lvl) => {
            const isActive = hasData && airAqi >= lvl.min && (lvl.max ? airAqi <= lvl.max : true)
            return (
              <div
                key={lvl.category}
                style={{
                  backgroundColor: lvl.color,
                  boxShadow: isActive ? `0 0 4px ${lvl.color}, 0 0 9px ${lvl.color}a6` : undefined,
                }}
                className={`h-full rounded-xs transition-all ${
                  isActive ? 'z-10 scale-y-150 opacity-100 ring-1 ring-white/80' : 'opacity-35'
                }`}
                title={`${t(CATEGORY_KEYS[AQI_LEVELS.indexOf(lvl)])} (${lvl.min}–${lvl.max})`}
              />
            )
          })}
        </div>
        </div>

        {/* 4. Rekomendasi / Dampak Kesehatan Warga */}
        <div className="hidden border-t border-border/50 pt-2 text-[10.5px] leading-relaxed text-muted sm:block">
          <span className="mr-1 font-bold text-foreground">{t('mapFirst.air.guide')}</span>
          <span>{hasData ? advice : t('mapFirst.air.unavailableAdvice')}</span>
        </div>

        <details className="group border-t border-border/60 pt-1.5">
          <summary className="flex cursor-pointer list-none items-center justify-between text-[10.5px] font-bold text-foreground">
            <span>{metaCopy.transparency}</span>
            <span className="text-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[10px] leading-tight">
          <dt className="text-muted">{t('mapFirst.meta.source')}</dt>
          <dd className="text-right font-semibold text-foreground">
            <a href={metadata.sourceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
              {source ?? metadata.source} ↗
            </a>
          </dd>
          <dt className="text-muted">{metaCopy.coverage}</dt>
          <dd className="text-right font-medium text-foreground">{metadata.coverage}</dd>
          <dt className="text-muted">{metaCopy.unit}</dt>
          <dd className="text-right font-medium text-foreground">{metadata.unit}</dd>
          <dt className="text-muted">{t('mapFirst.meta.period')}</dt>
          <dd className="text-right font-medium text-foreground">{hasData ? t('mapFirst.meta.realtime') : '—'}</dd>
          <dt className="text-muted">{t('mapFirst.meta.updated')}</dt>
          <dd className="text-right font-medium text-foreground">{updatedAt ?? '—'}</dd>
          <dt className="text-muted">{metaCopy.method}</dt>
          <dd className="text-right font-medium leading-relaxed text-foreground">{metadata.method}</dd>
          </dl>
        </details>
      </div>
    </div>
  )
}
