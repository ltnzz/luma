import { useMemo } from 'react'
import { CategoryIconBadge } from '../../../components/ui/CategoryIconBadge'
import { getOnboardingEnvironmentalPreview } from '../data/environmental-preview-provider'
import { useTranslation } from '../../../i18n/useTranslation'

export function OnboardingEnvironmentalPreview() {
  const { language } = useTranslation()
  const data = useMemo(() => getOnboardingEnvironmentalPreview(), [])
  const isEn = language === 'en'

  const { air, water } = data

  return (
    <div
      data-testid="onboarding-environmental-preview"
      className="mt-2.5 flex flex-col gap-2 rounded-xl border border-primary/20 bg-surface/80 p-3 shadow-xs dark:bg-surface/50"
    >
      {/* Header Tag */}
      <div className="flex items-center justify-between gap-1.5 text-[10px] font-semibold text-primary">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {isEn ? 'Mobile Preview Example' : 'Contoh Pratinjau Mobile'}
        </span>
        <span className="text-muted text-[9.5px]">
          {isEn ? 'Environmental Indicators' : 'Indikator Lingkungan'}
        </span>
      </div>

      {/* 1. Air Quality Preview Card */}
      <div className="rounded-lg border border-border/60 bg-surface-muted/40 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <CategoryIconBadge category="air" size="sm" />
            <span className="text-[11px] font-bold text-foreground">
              {isEn ? 'Air Quality (US AQI)' : 'Kualitas Udara (US AQI)'}
            </span>
          </div>
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9.5px] font-semibold text-amber-700 dark:text-amber-300">
            {air.status}
          </span>
        </div>

        <div className="mt-1.5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-foreground">{air.aqi}</span>
            <span className="text-[10px] text-muted">AQI</span>
          </div>
          <span className="text-[10px] text-muted font-medium">
            PM2.5: <strong className="text-foreground">{air.pm25}</strong>
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between text-[9px] text-muted">
          <span>{air.source}</span>
          <span>{air.period}</span>
        </div>
        <p className="mt-0.5 text-[8.5px] text-muted/80 italic leading-tight">
          {air.method}
        </p>
      </div>

      {/* 2. Water Quality & Infrastructure Preview */}
      <div className="rounded-lg border border-border/60 bg-surface-muted/40 p-2">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <CategoryIconBadge category="water" size="sm" />
            <span className="text-[10.5px] font-bold text-foreground truncate">
              {water.name}
            </span>
          </div>
          <span className="shrink-0 rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700 dark:text-sky-300">
            {water.status}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[9px] text-muted">
          <span className="truncate">{water.coverage}</span>
          <span className="shrink-0 font-medium">{water.source}</span>
        </div>
      </div>

      {/* Helpful Hint */}
      <p className="text-[9.5px] leading-tight text-muted/90 italic">
        {isEn
          ? 'On desktop, environmental data is directly interactive on the left control stack.'
          : 'Pada layar desktop, informasi lingkungan tampil interaktif pada panel kiri peta.'}
      </p>
    </div>
  )
}

