import { useTranslation } from '../../../i18n/useTranslation'
import type { TranslateFunction } from '../../../i18n/i18n-context'
import type { IndicatorSource } from '../../../lib/api'
import { formatLocaleDate } from '../../../lib/utils'
import { Skeleton } from '../../../components/ui/Skeleton'

interface InfoCardsProps {
  indicatorSource: IndicatorSource | null
  generatedAt: string | null
  overviewReady: boolean
}

function sourceText(source: IndicatorSource | null, t: TranslateFunction): string | null {
  if (source === 'dataset_fallback') return t('dashboard.kpi.sumberDataset')
  if (source === 'database') return t('dashboard.kpi.sumberDatabase')
  return null
}

function InfoLine({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value ?? <Skeleton className="h-3 w-20" />}</span>
    </div>
  )
}

/**
 * The two info cards from the Figma sidebar:
 * 1. "Mengenali data terverifikasi" — static explainer.
 * 2. "Transparansi data" — renders only API-provided metadata
 *    (indicator `source` flag and overview `generatedAt`). No invented data.
 */
export function InfoCards({ indicatorSource, generatedAt, overviewReady }: InfoCardsProps) {
  const { t, language } = useTranslation()

  const locale = language === 'id' ? 'id-ID' : 'en-US'
  const generatedAtDate = generatedAt ? new Date(generatedAt) : null
  const updatedLabel =
    generatedAtDate && !Number.isNaN(generatedAtDate.getTime())
      ? formatLocaleDate(generatedAtDate, locale)
      : t('dashboard.kpi.periode')

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-border bg-surface-muted/50 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t('dashboard.info.verifiedTitle')}
        </h3>
        <p className="mt-2 text-xs leading-5 text-muted">{t('dashboard.info.verifiedBody')}</p>
      </section>

      <section className="rounded-lg border border-border bg-surface-muted/50 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t('dashboard.info.transparencyTitle')}
        </h3>
        <p className="mt-2 text-xs leading-5 text-muted">{t('dashboard.info.transparencyBody')}</p>

        <dl className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
          <InfoLine
            label={t('dashboard.info.sumberLabel')}
            value={sourceText(indicatorSource, t)}
          />
          <InfoLine
            label={t('dashboard.info.updatedLabel')}
            value={overviewReady ? updatedLabel : null}
          />
        </dl>
      </section>
    </div>
  )
}
