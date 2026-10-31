import { useTranslation } from '../../../i18n/useTranslation'
import { type ReactElement } from 'react'
import { cn } from '../../../lib/utils'
import type { KpiViewModel } from '../kpiMapping'
import {
  WindIcon,
  DropletIcon,
  SchoolIcon,
  HospitalIcon,
  TreeIcon,
  BusIcon,
} from '../../../components/ui/Icons'

interface KpiCardProps {
  kpi: KpiViewModel
  /** Card visual variant. */
  variant?: 'default' | 'environment' | 'facility'
  /** Pre-computed sparkline values (0-1 normalized heights). */
  sparkline?: number[] | null
  /** Status badge { label, color }. */
  status?: { label: string; color: string } | null
}

const ICON_BY_KEY: Record<string, () => ReactElement> = {
  kualitasUdara: () => <WindIcon size={12} />,
  kualitasAir: () => <DropletIcon size={12} />,
  pendidikan: () => <SchoolIcon size={12} />,
  kesehatan: () => <HospitalIcon size={12} />,
  rth: () => <TreeIcon size={12} />,
  transportasi: () => <BusIcon size={12} />,
}

function Sparkline({ values }: { values: number[] }) {
  if (!values || values.length === 0) return null
  const max = Math.max(...values)
  if (max === 0) return null
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100
      const y = 100 - (v / max) * 70
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      className="w-full h-4 shrink-0"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.55"
    >
      <polyline points={points} />
    </svg>
  )
}

export function KpiCard({ kpi, variant = 'default', sparkline, status }: KpiCardProps) {
  const { t } = useTranslation()
  const Icon = ICON_BY_KEY[kpi.key]
  const isFacility = variant === 'facility'
  const isEnvironment = variant === 'environment'

  return (
    <article
      className={cn(
        'flex h-full flex-col gap-2 rounded-xl border border-border bg-surface p-4',
        isFacility
          ? 'bg-surface-muted/40 hover:bg-surface-muted/60 transition-colors'
          : '',
        isEnvironment ? 'border-l-2 border-l-primary/60' : '',
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg',
                isFacility
                  ? 'bg-surface border border-border/60 text-muted'
                  : 'bg-primary-soft text-primary-soft-text',
              )}
            >
              {Icon()}
            </span>
          )}
          <h3 className="text-sm font-semibold text-foreground leading-tight">{kpi.title}</h3>
        </div>

        {status && (
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium"
            style={{ borderColor: status.color, color: status.color }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.color }} />
            {status.label}
          </span>
        )}
      </header>

      {kpi.hasData ? (
        <>
          <div className="mt-1 flex items-end gap-1">
            <p className="text-2xl font-black text-foreground tracking-tight">{kpi.value}</p>
            {kpi.sub && !isFacility ? (
              <span className="text-xs text-muted">{kpi.sub}</span>
            ) : null}
          </div>

          {isFacility && kpi.sub ? (
            <p className="mt-1 text-[10px] text-muted leading-tight line-clamp-2">{kpi.sub}</p>
          ) : null}

          {sparkline ? (
            <div className="mt-2 w-full">
              <Sparkline values={sparkline} />
            </div>
          ) : null}
        </>
      ) : (
        <>
          <span aria-hidden="true" className="mt-2 text-sm text-muted">—</span>
          <p className="text-xs text-muted">{t('dashboard.kpi.empty')}</p>
        </>
      )}

      {kpi.footer ? (
        <footer className="mt-auto border-t border-border pt-2 text-[10px] text-muted">
          {kpi.footer}
        </footer>
      ) : null}
    </article>
  )
}


