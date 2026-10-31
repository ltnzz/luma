import { useTranslation } from '../../../i18n/useTranslation'
import type { TranslateFunction } from '../../../i18n/i18n-context'
import type { RegionalIndicator } from '../../../lib/api'
import type { Language } from '../../../i18n/dictionaries'
import { formatLocaleDate } from '../../../lib/utils'
import { Button } from '../../../components/ui/Button'
import { findWilayahMeta } from '../meta'
import { useRealtimeAirQuality } from '../hooks/useRealtimeAirQuality'

interface WilayahPopoverProps {
  code: string
  indicator: RegionalIndicator | null
  generatedAt: string | null
  language: Language
  onReset: () => void
}

function PopoverRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="shrink-0 text-muted">{label}</span>
      <span className={value ? 'text-right font-medium text-on-surface-dark' : 'text-right text-muted'}>
        {value ?? '—'}
      </span>
    </div>
  )
}

function sourceLabel(source: RegionalIndicator['source'], t: TranslateFunction): string | null {
  if (source === 'dataset_fallback') return t('dashboard.kpi.sumberDataset')
  if (source === 'database') return t('dashboard.kpi.sumberDatabase')
  return null
}

/**
 * Popup card on the map for the selected wilayah (Figma screen 1, selected
 * state). Shows only API-provided values for that region; rows render as
 * "—" when a field is absent — nothing is estimated. The "Eksplorasi
 * fasilitas" CTA belongs to screen 3 and stays disabled in this phase.
 */
export function WilayahPopover({ code, indicator, generatedAt, language, onReset }: WilayahPopoverProps) {
  const { t } = useTranslation()
  const { data: realtimeAirQuality } = useRealtimeAirQuality(code)
  const aqiDisplay = realtimeAirQuality?.aqi != null ? `${realtimeAirQuality.aqi} AQI` : '—'
  const meta = findWilayahMeta(code)
  const regionName = meta?.name ?? indicator?.label ?? code

  const locale = language === 'id' ? 'id-ID' : 'en-US'
  const generatedAtDate = generatedAt ? new Date(generatedAt) : null
  const periodLabel =
    generatedAtDate && !Number.isNaN(generatedAtDate.getTime())
      ? formatLocaleDate(generatedAtDate, locale)
      : null

  const footerParts = [sourceLabel(indicator?.source ?? null, t), periodLabel].filter(
    Boolean,
  ) as string[]

  return (
    <aside className="absolute right-3 top-3 z-10 w-64 rounded-xl bg-surface-dark p-4 text-on-surface-dark shadow-lg">
      <p className="text-[11px] uppercase tracking-wide text-muted">
        {t('dashboard.indicators.selectedHeading')}
      </p>
      <h3 className="mt-1 text-lg font-bold">{regionName}</h3>

      <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
        <PopoverRow label={t('dashboard.kpi.kualitasUdara')} value={aqiDisplay} />
        <PopoverRow label={t('dashboard.kpi.pendidikan')} value={indicator?.sekolahTotal ?? null} />
        <PopoverRow label={t('dashboard.kpi.kesehatan')} value={indicator?.faskesTotal ?? null} />
        <PopoverRow label={t('dashboard.kpi.rth')} value={indicator?.rthPct ?? null} />
        <PopoverRow label={t('dashboard.kpi.transportasi')} value={indicator?.transumTotal ?? null} />
      </div>

      {footerParts.length > 0 ? (
        <p className="mt-3 border-t border-border pt-3 text-[11px] text-muted">
          {t('dashboard.map.dataScope')}: {footerParts.join(' • ')}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="default" size="sm" onClick={onReset}>
          {t('dashboard.map.reset')}
        </Button>
        <Button variant="primary" size="sm" disabled title={t('dashboard.map.exploreSoon')}>
          {t('dashboard.map.explore')}
        </Button>
      </div>
    </aside>
  )
}
