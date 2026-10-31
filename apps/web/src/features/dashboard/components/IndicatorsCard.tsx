import { useMemo } from 'react'

import { useTranslation } from '../../../i18n/useTranslation'
import { useIndicators } from '../hooks/useIndicators'
import { useOverview } from '../hooks/useOverview'
import { useRealtimeAirQuality } from '../hooks/useRealtimeAirQuality'
import { buildKpis, type KpiViewModel } from '../kpiMapping'
import { findWilayahMeta } from '../meta'
import { Card } from '../../../components/ui/Card'
import { KpiBoard } from './KpiBoard'
import { InfoCards } from './InfoCards'

interface IndicatorsCardProps {
  selectedCode: string | null
}

/**
 * Left sidebar of screen 1: heading (scope-aware), the six KPI cards and the
 * two info cards (verified-data note + data transparency), matching the
 * Figma layout. Indicator switching happens without refetch: the full
 * lookup from GET /api/v1/indicators is filtered locally.
 */
export function IndicatorsCard({ selectedCode }: IndicatorsCardProps) {
  const { t, language } = useTranslation()
  const indicators = useIndicators()
  const overview = useOverview()
  const { data: realtimeAirQuality } = useRealtimeAirQuality(selectedCode ?? 'ALL')

  const scopeRow = useMemo(() => {
    if (!indicators.lookup) return null
    if (selectedCode) return indicators.lookup[selectedCode] ?? null
    return indicators.lookup['ALL'] ?? null
  }, [indicators.lookup, selectedCode])

  const kpis = useMemo<KpiViewModel[] | null>(() => {
    if (indicators.status !== 'success' || overview.status !== 'success') return null
    if (selectedCode && !scopeRow) return null
    return buildKpis({
      t,
      language,
      selectedCode,
      indicator: scopeRow,
      overview: overview.data,
      overviewStatus: overview.status,
      realtimeAirQuality,
    })
  }, [t, language, indicators.status, overview.status, overview.data, scopeRow, selectedCode, realtimeAirQuality])

  const regionName = selectedCode
    ? (findWilayahMeta(selectedCode)?.name ?? scopeRow?.label ?? selectedCode)
    : t('dashboard.scope.all')

  const heading = selectedCode
    ? `${t('dashboard.indicators.heading')} — ${regionName}`
    : t('dashboard.indicators.heading')

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-5">
        {/* Heading is rendered inside KpiBoard (scope-aware). */}
        <KpiBoard
          heading={heading}
          kpis={kpis}
          loading={indicators.status === 'loading' || overview.status === 'loading'}
          error={indicators.error ?? overview.error}
          empty={indicators.status === 'empty' || (indicators.status === 'success' && selectedCode !== null && !scopeRow)}
          onRetry={() => {
            indicators.refetch()
            overview.refetch()
          }}
        />

        <InfoCards
          indicatorSource={scopeRow?.source ?? null}
          generatedAt={overview.data?.generatedAt ?? null}
          overviewReady={overview.status === 'success'}
        />
      </div>
    </Card>
  )
}
