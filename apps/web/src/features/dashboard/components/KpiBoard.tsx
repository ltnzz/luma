import { useTranslation } from '../../../i18n/useTranslation'
import { KpiCard } from './KpiCard'
import type { KpiViewModel } from '../kpiMapping'
import type { ApiError } from '../../../lib/api'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ErrorBanner } from '../../../components/ui/ErrorBanner'
import { Skeleton } from '../../../components/ui/Skeleton'

interface KpiBoardProps {
  /** Uppercase section heading label, e.g. "Indikator wilayah". */
  heading: string
  kpis: KpiViewModel[] | null
  loading: boolean
  error: ApiError | null
  empty: boolean
  onRetry?: () => void
}

const SKELETON_COUNT = 6

/**
 * Grid of the six regional indicator cards (Kualitas Air, Kualitas Udara,
 * Pendidikan, Kesehatan, RTH & Rekreasi, Transportasi Umum).
 */
export function KpiBoard({ heading, kpis, loading, error, empty, onRetry }: KpiBoardProps) {
  const { t } = useTranslation()

  return (
    <section aria-busy={loading} className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{heading}</h2>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <div key={index} className="rounded-xl border border-border bg-surface p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-4 h-6 w-20" />
              <Skeleton className="mt-2 h-3 w-32" />
              <Skeleton className="mt-4 h-3 w-full max-w-36" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && error ? <ErrorBanner error={error} onRetry={onRetry} /> : null}

      {!loading && empty ? (
        <EmptyState
          title={t('dashboard.kpi.empty')}
          className="rounded-xl border border-dashed border-border bg-surface-muted/40 px-4 py-10 text-center"
        />
      ) : null}

      {!loading && !error && kpis ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.key}
              kpi={kpi}
              variant={kpi.variant}
              status={kpi.status ?? null}
              sparkline={kpi.sparkline ?? null}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
