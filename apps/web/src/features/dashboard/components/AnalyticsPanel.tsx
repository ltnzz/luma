import { lazy, Suspense, useMemo, useState } from 'react'
import type { ApexOptions } from 'apexcharts'

import { Card } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ErrorBanner } from '../../../components/ui/ErrorBanner'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useTheme } from '../../../context/useTheme'
import type { AnalyticsSector, ApiError, OverviewData, SectorAnalytics } from '../../../lib/api'
import type { QueryStatus } from '../types'
import { useSectorAnalytics } from '../hooks/useSectorAnalytics'

const Chart = lazy(() => import('react-apexcharts'))

interface AnalyticsPanelProps {
  overviewStatus: QueryStatus
  overview: OverviewData | null
  overviewError: ApiError | null
  onOverviewRetry: () => void
}

const sectors: Array<{ value: AnalyticsSector; label: string }> = [
  { value: 'rth', label: 'Ruang Terbuka Hijau' },
  { value: 'sekolah', label: 'Pendidikan' },
  { value: 'kesehatan', label: 'Kesehatan' },
  { value: 'transum', label: 'Transportasi Umum' },
  { value: 'udara', label: 'Kualitas Udara' },
  { value: 'air', label: 'Kualitas Air' },
]

interface ChartData {
  title: string
  categories: string[]
  values: number[]
}

function numberEntries(value: unknown): Array<[string, number]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  return Object.entries(value).flatMap(([key, item]) =>
    typeof item === 'number' && Number.isFinite(item) ? [[key, item]] : [],
  )
}

function objectArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object',
  )
}

function buildSectorChart(sector: AnalyticsSector, data: SectorAnalytics | null): ChartData | null {
  if (!data) return null

  if (sector === 'rth' || sector === 'sekolah' || sector === 'kesehatan') {
    const field = sector === 'rth' ? 'by_jenis' : sector === 'sekolah' ? 'by_jenjang' : 'facility_types'
    const entries = numberEntries(data[field]).slice(0, 8)
    return {
      title: sector === 'rth' ? 'RTH menurut jenis' : sector === 'sekolah' ? 'Sekolah menurut jenjang' : 'Jenis fasilitas kesehatan',
      categories: entries.map(([label]) => label),
      values: entries.map(([, value]) => value),
    }
  }

  if (sector === 'transum') {
    const rows = objectArray(data.halte_per_koridor).slice(0, 12)
    return {
      title: 'Halte per koridor',
      categories: rows.map((row) => String(row.koridor ?? '-')),
      values: rows.map((row) => (typeof row.count === 'number' ? row.count : 0)),
    }
  }

  if (sector === 'udara') {
    const rows = objectArray(data.monthly_trend)
    return {
      title: 'Tren bulanan PM2.5',
      categories: rows.map((row) => String(row.bulan ?? '-')),
      values: rows.map((row) => (typeof row.pm25 === 'number' ? row.pm25 : 0)),
    }
  }

  const rows = objectArray(data.trend_sample)
  return {
    title: 'Tren kualitas air (COD)',
    categories: rows.map((row) => String(row.periode ?? '-')),
    values: rows.map((row) => (typeof row.avg_cod === 'number' ? row.avg_cod : 0)),
  }
}

function chartOptions(categories: string[], isDark: boolean): ApexOptions {
  const labelColor = isDark ? '#a7b7ad' : '#5d6962'
  const gridColor = isDark ? '#243126' : '#dce4dd'

  return {
    chart: { toolbar: { show: false }, background: 'transparent', fontFamily: 'inherit' },
    colors: ['#22c55e'],
    dataLabels: { enabled: false },
    grid: { borderColor: gridColor, strokeDashArray: 4 },
    plotOptions: { bar: { borderRadius: 5, columnWidth: '54%' } },
    tooltip: { theme: isDark ? 'dark' : 'light' },
    xaxis: {
      categories,
      labels: { style: { colors: categories.map(() => labelColor), fontSize: '11px' }, rotate: -35 },
      axisBorder: { color: gridColor },
      axisTicks: { color: gridColor },
    },
    yaxis: { labels: { style: { colors: [labelColor] } } },
  }
}

function ChartSkeleton() {
  return (
    <div className="space-y-3" aria-label="Memuat grafik">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-[260px] w-full" />
    </div>
  )
}

export function AnalyticsPanel({
  overviewStatus,
  overview,
  overviewError,
  onOverviewRetry,
}: AnalyticsPanelProps) {
  const [sector, setSector] = useState<AnalyticsSector>('rth')
  const sectorAnalytics = useSectorAnalytics(sector)
  const { theme } = useTheme()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const sectorChart = useMemo(
    () => buildSectorChart(sector, sectorAnalytics.data),
    [sector, sectorAnalytics.data],
  )
  const overviewItems = overview?.charts.volumeDistribution ?? []

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border p-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Analitik visualisasi</h2>
          <p className="mt-1 text-xs text-muted">Data grafik dimuat langsung dari API Luma.</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted">
          Sektor
          <select
            value={sector}
            onChange={(event) => setSector(event.target.value as AnalyticsSector)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            {sectors.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-6 p-5 xl:grid-cols-2">
        <section aria-busy={overviewStatus === 'loading'}>
          {overviewStatus === 'loading' ? <ChartSkeleton /> : null}
          {overviewStatus === 'error' ? <ErrorBanner error={overviewError} onRetry={onOverviewRetry} /> : null}
          {overviewStatus === 'empty' ? <EmptyState title="Data overview belum tersedia" /> : null}
          {overviewStatus === 'success' && overviewItems.length > 0 ? (
            <>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Volume data lintas sektor</h3>
              <Suspense fallback={<ChartSkeleton />}>
                <Chart
                  type="bar"
                  height={300}
                  options={chartOptions(overviewItems.map((item) => item.category), isDark)}
                  series={[{ name: 'Jumlah data', data: overviewItems.map((item) => item.count) }]}
                />
              </Suspense>
            </>
          ) : null}
        </section>

        <section aria-busy={sectorAnalytics.status === 'loading'}>
          {sectorAnalytics.status === 'loading' ? <ChartSkeleton /> : null}
          {sectorAnalytics.status === 'error' ? (
            <ErrorBanner error={sectorAnalytics.error} onRetry={sectorAnalytics.refetch} />
          ) : null}
          {sectorAnalytics.status === 'empty' || (sectorAnalytics.status === 'success' && !sectorChart) ? (
            <EmptyState title="Data sektor belum tersedia" />
          ) : null}
          {sectorAnalytics.status === 'success' && sectorChart ? (
            <>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{sectorChart.title}</h3>
              <Suspense fallback={<ChartSkeleton />}>
                <Chart
                  type="bar"
                  height={300}
                  options={chartOptions(sectorChart.categories, isDark)}
                  series={[{ name: 'Nilai', data: sectorChart.values }]}
                />
              </Suspense>
            </>
          ) : null}
        </section>
      </div>
    </Card>
  )
}
