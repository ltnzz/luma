import { Skeleton } from '../../../components/ui/Skeleton'
import type { KpiViewModel } from '../kpiMapping'
import { WindIcon, DropletIcon } from '../../../components/ui/Icons'

interface EnvironmentStatusCardProps {
  kpis: KpiViewModel[] | null
  loading?: boolean
}

/**
 * EnvironmentStatusCard:
 * - Kapsul status lingkungan hidup ramping (~55-65px tinggi).
 * - Menampilkan Kualitas Udara (ISPU) dan Kualitas Air (Titik Pantau).
 * - Persistent melayang di sisi kiri atas kanvas peta tanpa tombol collapse agar cepat dipantau.
 */
export function EnvironmentStatusCard({ kpis, loading = false }: EnvironmentStatusCardProps) {
  const aqiKpi = kpis?.find((k) => k.key === 'kualitasUdara')
  const airKpi = kpis?.find((k) => k.key === 'kualitasAir')

  return (
    <div className="pointer-events-auto w-[295px] sm:w-[330px] rounded-2xl border border-border bg-surface/95 p-2 shadow-lg backdrop-blur-md select-none transition-all duration-200">
      <div className="grid grid-cols-2 gap-1.5">
        {/* Kolom 1: Kualitas Udara */}
        {loading || !aqiKpi ? (
          <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-muted/30 p-2 h-[56px]">
            <div className="flex items-center justify-between">
              <Skeleton className="h-2.5 w-14 rounded" />
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-12 rounded mt-1" />
          </div>
        ) : (
          <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-surface-muted/40 p-1.5 sm:p-2 hover:border-primary/40 hover:bg-surface-muted/70 transition-colors min-h-[56px]">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold text-muted truncate">
                {aqiKpi.title}
              </span>
              <WindIcon size={12} className="text-primary shrink-0" />
            </div>
            <div>
              <p className="text-xs sm:text-[12.5px] font-black text-foreground tracking-tight line-clamp-1">
                {aqiKpi.value ?? '—'}
              </p>
              {aqiKpi.sub && (
                <p className="text-[9px] text-muted leading-tight truncate mt-0.5">
                  {aqiKpi.sub}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Kolom 2: Kualitas Air */}
        {loading || !airKpi ? (
          <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-muted/30 p-2 h-[56px]">
            <div className="flex items-center justify-between">
              <Skeleton className="h-2.5 w-14 rounded" />
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-12 rounded mt-1" />
          </div>
        ) : (
          <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-surface-muted/40 p-1.5 sm:p-2 hover:border-primary/40 hover:bg-surface-muted/70 transition-colors min-h-[56px]">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold text-muted truncate">
                {airKpi.title}
              </span>
              <DropletIcon size={12} className="text-primary shrink-0" />
            </div>
            <div>
              <p className="text-xs sm:text-[12.5px] font-black text-foreground tracking-tight line-clamp-1">
                {airKpi.value ?? '—'}
              </p>
              {airKpi.sub && (
                <p className="text-[9px] text-muted leading-tight truncate mt-0.5">
                  {airKpi.sub}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

