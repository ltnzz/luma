import { useCallback, useState } from 'react'

import { useTranslation } from '../../i18n/useTranslation'
import { useIndicators } from './hooks/useIndicators'
import { useOverview } from './hooks/useOverview'
import { findWilayahMeta } from './meta'
import { HexRegionMap } from './components/HexRegionMap'
import { WilayahPopover } from './components/WilayahPopover'
import { IndicatorsCard } from './components/IndicatorsCard'
import { DashboardHeader } from './components/DashboardHeader'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'

/**
 * Screen 1 — "Ringkasan kondisi DKI Jakarta" (Figma).
 *
 * Structure for future screens (keep, do not remove):
 * - IndicatorsCard holds scope-aware KPI logic (screens 2 reuses it).
 * - HexRegionMap/Eksplorasi hooks are the entry points for screens 2 & 3.
 * - No router: view switching stays local state until routing is needed.
 */
export function DashboardPage() {
  const { t, language } = useTranslation()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const indicators = useIndicators()
  const overview = useOverview()

  const handleSelect = useCallback((code: string) => setSelectedCode(code), [])
  const handleReset = useCallback(() => setSelectedCode(null), [])

  const scopeName = selectedCode
    ? findWilayahMeta(selectedCode)?.name ?? indicators.lookup?.[selectedCode]?.label ?? selectedCode
    : t('dashboard.scope.all')
  const scopeLabel = `${t('dashboard.scope')}: ${scopeName}`

  const selectedIndicator = selectedCode && indicators.lookup ? indicators.lookup[selectedCode] ?? null : null

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader scopeLabel={scopeLabel} />

      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">{t('dashboard.title')}</h1>
        <p className="mt-2 text-sm text-muted">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <IndicatorsCard selectedCode={selectedCode} />

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 p-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t('dashboard.map.title')}</h2>
              <p className="mt-1 max-w-sm text-xs text-muted">{t('dashboard.map.note')}</p>
            </div>
          </div>

          <div className="relative border-t border-border bg-surface-muted/40 p-4">
            {indicators.status === 'loading' ? (
              <div className="flex h-80 items-center justify-center">
                <Skeleton className="h-64 w-full max-w-md rounded-full" />
              </div>
            ) : (
              <>
                <HexRegionMap selected={selectedCode} onSelect={handleSelect} />
                {selectedCode ? (
                  <WilayahPopover
                    code={selectedCode}
                    indicator={selectedIndicator}
                    generatedAt={overview.data?.generatedAt ?? null}
                    language={language}
                    onReset={handleReset}
                  />
                ) : null}
              </>
            )}
          </div>

          <div className="border-t border-border p-4">
            {selectedCode ? (
              <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
                {t('dashboard.indicators.selectedHeading')} — {scopeName}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
                {t('dashboard.map.selectPrompt')}
              </span>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
