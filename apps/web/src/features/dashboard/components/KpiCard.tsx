import { useTranslation } from '../../../i18n/useTranslation'
import type { KpiViewModel } from '../kpiMapping'

interface KpiCardProps {
  kpi: KpiViewModel
}

/**
 * KPI card following the Figma treatment:
 * title, value (or "Data belum tersedia"), sub line, scope note chip and a
 * "Sumber • Periode" footer. No invented content: values come from the API.
 */
export function KpiCard({ kpi }: KpiCardProps) {
  const { t } = useTranslation()

  return (
    <article className="flex h-full flex-col gap-2 rounded-xl border border-border bg-surface p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{kpi.title}</h3>
        {kpi.note ? (
          <span
            title={kpi.note}
            className="inline-flex max-w-full truncate rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted"
          >
            {kpi.note}
          </span>
        ) : null}
      </header>

      {kpi.hasData ? (
        <>
          <p className="mt-1 text-xl font-bold text-foreground">{kpi.value}</p>
          {kpi.sub ? <p className="text-xs leading-5 text-muted">{kpi.sub}</p> : null}
        </>
      ) : (
        <>
          <span aria-hidden="true" className="mt-2 text-sm text-muted">—</span>
          <p className="text-xs text-muted">{t('dashboard.kpi.empty')}</p>
        </>
      )}

      {kpi.footer ? (
        <footer className="mt-auto border-t border-border pt-2 text-[11px] text-muted">
          {kpi.footer}
        </footer>
      ) : null}
    </article>
  )
}
