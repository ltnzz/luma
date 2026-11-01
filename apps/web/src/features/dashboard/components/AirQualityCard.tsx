import { useMemo } from 'react'
import { WindIcon } from '../../../components/ui/Icons'
import { getAqiLevel, AQI_LEVELS } from '../utils/airQualityLevels'

interface AirQualityCardProps {
  airAqi: number
  airStatus?: string
  isAirLive: boolean
}

/**
 * AirQualityCard — Card Kualitas Udara Lengkap dengan Level Kesehatan & Rekomendasi
 * Menampilkan nilai AQI real-time, badge status, bar meter 5 tingkatan, dan panduan kesehatan warga.
 */
export function AirQualityCard({
  airAqi,
  isAirLive,
}: AirQualityCardProps) {
  const level = useMemo(() => getAqiLevel(airAqi), [airAqi])

  return (
    <div className="pointer-events-auto flex flex-col gap-1.5 rounded-2xl luma-glass p-2.5 sm:p-3 select-none w-60 sm:w-64 animate-in fade-in slide-in-from-left-2 duration-200">
      {/* 1. Header Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/15 text-amber-600">
            <WindIcon size={12} />
          </span>
          <span className="text-[11px] font-bold text-foreground">
            Kualitas Udara (ISPU)
          </span>
        </div>

        {isAirLive && (
          <span
            className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald-600"
            title="Sensor SPKU DLH Jakarta Terkoneksi Realtime"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live SPKU
          </span>
        )}
      </div>

      {/* 2. Nilai AQI & Status Kategori (Sesuai Mockup User) */}
      <div className="flex items-center justify-between rounded-xl bg-surface-muted/60 px-2.5 py-1.5 border border-border/60">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-foreground tracking-tight leading-none">
            {airAqi}
          </span>
          <span className="text-[10px] font-semibold text-muted">AQI</span>
        </div>

        <span
          className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${level.badgeBg} ${level.badgeBorder} ${level.textColor}`}
        >
          {level.category}
        </span>
      </div>

      {/* 3. Bar Meter Level Kesehatan Udara (5 Tingkatan) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[9px] text-muted font-medium">
          <span>Level Kesehatan</span>
          <span className="font-bold text-foreground">{level.category}</span>
        </div>

        {/* Segmented Gradient Meter */}
        <div className="grid grid-cols-5 gap-1 h-1.5 w-full rounded-full overflow-hidden bg-surface-muted p-0.5">
          {AQI_LEVELS.slice(0, 5).map((lvl) => {
            const isActive = airAqi >= lvl.min && (lvl.max ? airAqi <= lvl.max : true)
            return (
              <div
                key={lvl.category}
                style={{ backgroundColor: lvl.color }}
                className={`h-full rounded-xs transition-all ${
                  isActive ? 'ring-1.5 ring-foreground shadow-xs' : 'opacity-40'
                }`}
                title={`${lvl.category} (${lvl.min}–${lvl.max})`}
              />
            )
          })}
        </div>
      </div>

      {/* 4. Rekomendasi / Dampak Kesehatan Warga */}
      <div className="rounded-lg bg-surface-muted/50 p-1.5 text-[10px] text-muted border border-border/50 leading-tight">
        <span className="font-semibold text-foreground mr-1">{level.icon} Panduan:</span>
        <span>{level.advice}</span>
      </div>
    </div>
  )
}
