import { useMemo } from 'react'
import { CategoryIconBadge } from '../../../components/ui/CategoryIconBadge'
import { getAqiLevel, AQI_LEVELS } from '../utils/airQualityLevels'
import { useTranslation } from '../../../i18n/useTranslation'

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
  const { t } = useTranslation()
  const level = useMemo(() => getAqiLevel(airAqi ?? 0), [airAqi])
  const levelIndex = Math.max(0, AQI_LEVELS.indexOf(level))
  const categoryLabel = t(CATEGORY_KEYS[levelIndex])
  const advice = t(ADVICE_KEYS[levelIndex])
  const hasData = status === 'success' && airAqi !== null

  return (
    <div className="pointer-events-auto flex w-[calc(100vw-1rem)] max-w-[330px] flex-col gap-2 rounded-xl luma-map-card luma-glass-hover p-3 select-none animate-in fade-in slide-in-from-left-2 duration-200 sm:w-64">
      {/* 1. Header Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CategoryIconBadge category="air" size="sm" />
          <span className="text-[11px] font-bold text-foreground">
            {t('mapFirst.air.title')}
          </span>
        </div>

        {isAirLive && (
          <span
            className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald-600"
            title={t('mapFirst.air.liveTitle')}
            data-tooltip={t('mapFirst.air.liveTitle')}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('mapFirst.air.live')}
          </span>
        )}
      </div>

      {/* 2. Nilai AQI & Status Kategori (Sesuai Mockup User) */}
      <div className="flex items-center justify-between border-y border-border/55 py-2">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-foreground tracking-tight leading-none">
            {hasData ? airAqi : '—'}
          </span>
          <span className="text-[10px] font-semibold text-muted">{t('mapFirst.air.unit')}</span>
        </div>

        <span
          className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${level.badgeBg} ${level.badgeBorder} ${level.textColor}`}
        >
          {hasData ? categoryLabel : t(status === 'loading' ? 'mapFirst.air.loading' : 'mapFirst.air.unavailable')}
        </span>
      </div>

      {/* 3. Bar Meter Level Kesehatan Udara (5 Tingkatan) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[9px] text-muted font-medium">
          <span>{t('mapFirst.air.healthLevel')}</span>
          <span className="font-bold text-foreground">
            {hasData ? categoryLabel : t('mapFirst.air.noValue')}
          </span>
        </div>

        {/* Segmented Gradient Meter */}
        <div className="grid grid-cols-5 gap-1 h-1.5 w-full rounded-full overflow-hidden bg-surface-muted p-0.5">
          {AQI_LEVELS.slice(0, 5).map((lvl) => {
            const isActive = hasData && airAqi >= lvl.min && (lvl.max ? airAqi <= lvl.max : true)
            return (
              <div
                key={lvl.category}
                style={{ backgroundColor: lvl.color }}
                className={`h-full rounded-xs transition-all ${
                  isActive ? 'ring-1.5 ring-foreground shadow-xs' : 'opacity-40'
                }`}
                title={`${t(CATEGORY_KEYS[AQI_LEVELS.indexOf(lvl)])} (${lvl.min}–${lvl.max})`}
              />
            )
          })}
        </div>
      </div>

      {/* 4. Rekomendasi / Dampak Kesehatan Warga */}
      <div className="border-t border-border/60 pt-2 text-[10px] text-muted leading-relaxed">
        <span className="font-semibold text-foreground mr-1">{level.icon} {t('mapFirst.air.guide')}</span>
        <span>{hasData ? advice : t('mapFirst.air.unavailableAdvice')}</span>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 border-t border-border/60 pt-2 text-[9px] leading-tight">
        <dt className="text-muted">{t('mapFirst.meta.source')}</dt>
        <dd className="truncate text-right font-medium text-foreground" title={source ?? undefined}>
          {source ?? '—'}
        </dd>
        <dt className="text-muted">{t('mapFirst.meta.period')}</dt>
        <dd className="text-right font-medium text-foreground">
          {hasData ? t('mapFirst.meta.realtime') : '—'}
        </dd>
        <dt className="text-muted">{t('mapFirst.meta.updated')}</dt>
        <dd className="text-right font-medium text-foreground">{updatedAt ?? '—'}</dd>
      </dl>
    </div>
  )
}
