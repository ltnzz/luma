import { Skeleton } from '../../../components/ui/Skeleton'
import type { ReactElement } from 'react'
import type { KpiViewModel } from '../kpiMapping'
import { WindIcon, DropletIcon } from '../../../components/ui/Icons'

interface EnvironmentStatusCardProps {
  kpis: KpiViewModel[] | null
  loading?: boolean
  isLive?: boolean
}

/**
 * EnvironmentStatusCard:
 * - Kapsul status lingkungan hidup di sisi kiri atas kanvas peta.
 * - Menampilkan Kualitas Udara (ISPU/AQI Real-time) dan Kualitas Air (Titik Pantau).
 * - Desain command-center: metrik utama besar, status badge warna, latar belakang
 *   tutup untuk variasi visual, konsisten dengan design tokens Luma.
 */
export function EnvironmentStatusCard({
  kpis,
  loading = false,
  isLive = false,
}: EnvironmentStatusCardProps) {
  const aqiKpi = kpis?.find((k) => k.key === 'kualitasUdara')
  const airKpi = kpis?.find((k) => k.key === 'kualitasAir')

  return (
    <div className="pointer-events-auto w-full sm:w-[295px] rounded-xl border border-border/80 bg-surface/90 p-2 sm:p-2.5 shadow-lg backdrop-blur-md select-none transition-all duration-200">
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {/* Kolom 1: Kualitas Udara */}
        {loading || !aqiKpi ? (
          <div className="flex flex-col justify-between rounded-lg border border-border/60 bg-surface-muted/40 p-1.5 sm:p-2 h-[56px] sm:h-[64px]">
            <div className="flex items-center justify-between">
              <Skeleton className="h-2.5 w-14 rounded" />
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-12 rounded sm:w-16 mt-1" />
          </div>
        ) : (
          <EnvironmentMetricCard
            title={aqiKpi.title}
            value={aqiKpi.value ?? '—'}
            sub={aqiKpi.sub ?? null}
            icon={<WindIcon size={12} className="shrink-0" />}
            live={isLive}
            liveLabel="LIVE"
          />
        )}

        {/* Kolom 2: Kualitas Air */}
        {loading || !airKpi ? (
          <div className="flex flex-col justify-between rounded-lg border border-border/60 bg-surface-muted/40 p-1.5 sm:p-2 h-[56px] sm:h-[64px]">
            <div className="flex items-center justify-between">
              <Skeleton className="h-2.5 w-14 rounded" />
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-12 rounded sm:w-16 mt-1" />
          </div>
        ) : (
          <EnvironmentMetricCard
            title={airKpi.title}
            value={airKpi.value ?? '—'}
            sub={airKpi.sub ?? null}
            icon={<DropletIcon size={12} className="shrink-0" />}
            live={false}
            liveLabel={null}
          />
        )}
      </div>
    </div>
  )
}

function EnvironmentMetricCard({
  title,
  value,
  sub,
  icon,
  live,
  liveLabel,
}: {
  title: string
  value: string
  sub: string | null
  icon: ReactElement
  live: boolean
  liveLabel: string | null
}) {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-border/70 bg-surface-muted/50 p-1.5 sm:p-2 hover:border-primary/50 hover:bg-surface-muted/70 transition-colors min-h-[56px] sm:min-h-[64px]">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] sm:text-xs font-semibold text-muted truncate">
          {title}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {live && liveLabel ? (
            <span className="flex items-center gap-1 rounded-full bg-primary-soft px-1.5 py-0.5 text-[9px] font-bold text-primary-soft-text">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {liveLabel}
            </span>
          ) : null}
          {icon}
        </div>
      </div>
      <div>
        <p className="text-xs sm:text-[13px] font-black text-foreground tracking-tight line-clamp-1">
          {value}
        </p>
        {sub && (
          <p className="text-[9px] text-muted leading-tight truncate mt-0.5">
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}
