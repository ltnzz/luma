import { Skeleton } from '../../../components/ui/Skeleton'
import type { AnalyticsSector, SectorAnalytics } from '../../../lib/api'
import { useTranslation } from '../../../i18n/useTranslation'
import { useSectorAnalytics } from '../hooks/useSectorAnalytics'

interface TrendPoint {
  label: string
  value: number
}

function asRows(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    : []
}

function buildTrend(sector: AnalyticsSector, data: SectorAnalytics | null): { points: TrendPoint[]; unit: string } {
  if (!data) return { points: [], unit: '' }

  if (sector === 'udara') {
    return {
      points: asRows(data.monthly_trend).flatMap((row) =>
        typeof row.pm25 === 'number' ? [{ label: String(row.bulan ?? '—'), value: row.pm25 }] : [],
      ),
      unit: 'µg/m³ PM2.5',
    }
  }

  if (sector === 'transum') {
    return {
      points: asRows(data.cakupan).flatMap((row) =>
        typeof row.populasi_terlayani_pct === 'number'
          ? [{ label: String(row.periode ?? '—'), value: row.populasi_terlayani_pct }]
          : [],
      ),
      unit: '% populasi',
    }
  }

  if (sector === 'rth' && data.by_periode && typeof data.by_periode === 'object' && !Array.isArray(data.by_periode)) {
    return {
      points: Object.entries(data.by_periode)
        .flatMap(([label, value]) => typeof value === 'number' ? [{ label, value }] : [])
        .sort((a, b) => a.label.localeCompare(b.label)),
      unit: 'lokasi',
    }
  }

  return { points: [], unit: '' }
}

export function HistoricalTrendMini({ sector, accent = '#22c55e' }: { sector: AnalyticsSector; accent?: string }) {
  const { language } = useTranslation()
  const { status, data } = useSectorAnalytics(sector)
  const copy = language === 'id'
    ? { title: 'Tren historis DKI', unavailable: 'Seri historis belum tersedia' }
    : { title: 'DKI historical trend', unavailable: 'Historical series unavailable' }
  const { points, unit } = buildTrend(sector, data)

  if (status === 'loading') return <Skeleton className="h-[54px] w-full rounded-lg" />
  if (status !== 'success' || points.length < 2) {
    return <p className="text-[10px] font-medium text-muted">{copy.unavailable}</p>
  }

  const width = 180
  const height = 32
  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width
    const y = height - 3 - ((point.value - min) / span) * (height - 6)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const first = points[0]
  const latest = points[points.length - 1]
  const delta = latest.value - first.value
  const formatter = new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { maximumFractionDigits: 1 })

  return (
    <div className="luma-glass-inner rounded-lg px-2.5 py-2" aria-label={`${copy.title}: ${first.label}–${latest.label}`}>
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
        <span className="font-bold text-foreground">{copy.title}</span>
        <span className="font-semibold text-muted">
          {delta > 0 ? '+' : ''}{formatter.format(delta)} {unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-8 w-full overflow-visible" role="img">
        <polyline points={coords} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => {
          const [x, y] = coords.split(' ')[index].split(',')
          return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="2.5" fill={accent} />
        })}
      </svg>
      <div className="mt-0.5 flex justify-between text-[9.5px] font-medium text-muted">
        <span>{first.label} · {formatter.format(first.value)}</span>
        <span>{latest.label} · {formatter.format(latest.value)}</span>
      </div>
    </div>
  )
}
