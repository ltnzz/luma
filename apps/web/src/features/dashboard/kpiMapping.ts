import type { TranslateFunction } from '../../i18n/i18n-context'
import type { Language } from '../../i18n/dictionaries'
import { formatLocaleDate } from '../../lib/utils'
import type { IndicatorSource, OverviewData, RegionalIndicator } from '../../lib/api'
import type { KpiKey, KpiValue, QueryStatus } from './types'

interface BuildKpiParams {
  t: TranslateFunction
  language: Language
  /** Currently selected wilayah code, or null for the DKI-wide view. */
  selectedCode: string | null
  /** Indicator row for the current scope (ALL row when nothing is selected). */
  indicator: RegionalIndicator | null
  overview: OverviewData | null
  overviewStatus: QueryStatus
}

export type KpiViewModel = {
  key: KpiKey
  title: string
  hasData: boolean
  value: KpiValue['value']
  sub: KpiValue['sub']
  footer: KpiValue['footer']
  /** Explicit scope note (e.g. DKI-wide aggregate shown inside a region view). */
  note: string | null
}

function indicatorSourceLabel(source: IndicatorSource | null, t: TranslateFunction): string | null {
  if (source === 'dataset_fallback') return t('dashboard.kpi.sumberDataset')
  if (source === 'database') return t('dashboard.kpi.sumberDatabase')
  return null
}

function buildFooter(param_sumber: string | null, param_periode: string | null): string | null {
  const parts = [param_sumber, param_periode].filter(Boolean) as string[]
  if (parts.length === 0) return null
  return parts.join(' • ')
}

/**
 * Builds the six KPI cards for screen 1.
 *
 * Data sources (audit-verified):
 * - Per-wilayah KPI values from GET /api/v1/indicators (formatted strings).
 * - Water quality has NO per-region value in the API, so it is always shown
 *   from GET /api/v1/visualizations/overview (aggregate for DKI Jakarta) with
 *   an explicit scope note. Nothing is estimated.
 */
export function buildKpis({
  t,
  language,
  selectedCode,
  indicator,
  overview,
  overviewStatus,
}: BuildKpiParams): KpiViewModel[] {
  const locale = language === 'id' ? 'id-ID' : 'en-US'
  const generatedAtDate = overview?.generatedAt ? new Date(overview.generatedAt) : null
  const generatedAt =
    generatedAtDate && !Number.isNaN(generatedAtDate.getTime())
      ? formatLocaleDate(generatedAtDate, locale)
      : null
  const sumberLabel = indicatorSourceLabel(indicator?.source ?? null, t)
  const indicatorFooter = buildFooter(sumberLabel, generatedAt)

  const showAirScopeNote = selectedCode !== null

  // Static card config in design order.
  const configs: Array<{
    key: KpiKey
    title: string
    getValue: (row: RegionalIndicator) => [string | null, string | null]
  }> = [
    {
      key: 'kualitasUdara',
      title: t('dashboard.kpi.kualitasUdara'),
      getValue: (row) => [
        row.aqiVal ? `${row.aqiVal} ${t('dashboard.kpi.aqiUnit')}` : null,
        row.aqiStatus,
      ],
    },
    {
      key: 'pendidikan',
      title: t('dashboard.kpi.pendidikan'),
      getValue: (row) => [row.sekolahTotal, row.sekolahSub],
    },
    {
      key: 'kesehatan',
      title: t('dashboard.kpi.kesehatan'),
      getValue: (row) => [row.faskesTotal, row.faskesSub],
    },
    {
      key: 'rth',
      title: t('dashboard.kpi.rth'),
      getValue: (row) => [row.rthPct, row.rthTarget],
    },
    {
      key: 'transportasi',
      title: t('dashboard.kpi.transportasi'),
      getValue: (row) => [row.transumTotal, row.transumSub],
    },
  ]

  const kpis: KpiViewModel[] = []

  // 1. Kualitas Air — DKI-wide aggregate from overview only.
  const air = overviewStatus === 'success' ? overview?.kpis.air ?? null : null
  const airValue = air ? `${air.totalRecords.toLocaleString(locale)} ${t('dashboard.kpi.airValueLabel')}` : null
  kpis.push({
    key: 'kualitasAir',
    title: t('dashboard.kpi.kualitasAir'),
    hasData: air !== null,
    value: airValue,
    sub: air ? `${air.totalSungai.toLocaleString(locale)} ${t('dashboard.kpi.airSubLabel')}` : null,
    footer: buildFooter(null, generatedAt),
    note: air && showAirScopeNote ? t('dashboard.kpi.airScopeNote') : null,
  })

  // 2-6. Indicator-sourced cards.
  for (const config of configs) {
    if (indicator) {
      const [value, sub] = config.getValue(indicator)
      kpis.push({
        key: config.key,
        title: config.title,
        hasData: value !== null || sub !== null,
        value,
        sub,
        footer: indicatorFooter,
        note: null,
      })
    } else {
      kpis.push({ key: config.key, title: config.title, hasData: false, value: null, sub: null, footer: null, note: null })
    }
  }

  return kpis
}
