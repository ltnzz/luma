import { useTranslation } from '../../../i18n/useTranslation'
import type { TranslationKey } from '../../../i18n/dictionaries'
import { VERIFIED_MAP_KPIS } from '../kpiMapping'
import { SchoolIcon, HospitalIcon, TreeIcon, BusIcon } from '../../../components/ui/Icons'

interface FacilityDistributionChartProps {
  wilayah: string
}

type FacilityCategoryKey = 'pendidikan' | 'kesehatan' | 'rth' | 'transportasi'

interface FacilityCategory {
  key: FacilityCategoryKey
  labelKey: TranslationKey
  Icon: typeof SchoolIcon
  colorVar: string
  valueKey: FacilityCategoryKey
}

const FACILITY_CATEGORIES: FacilityCategory[] = [
  {
    key: 'pendidikan',
    labelKey: 'dashboard.kpi.pendidikan',
    Icon: SchoolIcon,
    colorVar: 'var(--luma-map-education)',
    valueKey: 'pendidikan',
  },
  {
    key: 'kesehatan',
    labelKey: 'dashboard.kpi.kesehatan',
    Icon: HospitalIcon,
    colorVar: 'var(--luma-map-health)',
    valueKey: 'kesehatan',
  },
  {
    key: 'rth',
    labelKey: 'dashboard.kpi.rth',
    Icon: TreeIcon,
    colorVar: 'var(--luma-map-rth)',
    valueKey: 'rth',
  },
  {
    key: 'transportasi',
    labelKey: 'dashboard.kpi.transportasi',
    Icon: BusIcon,
    colorVar: 'var(--luma-map-transit)',
    valueKey: 'transportasi',
  },
]

function parseCount(value: string | undefined): number {
  if (!value) return 0
  const match = value.match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}

export function FacilityDistributionChart({ wilayah }: FacilityDistributionChartProps) {
  const { t } = useTranslation()
  const stats = VERIFIED_MAP_KPIS[wilayah] ?? VERIFIED_MAP_KPIS['ALL']

  const items = FACILITY_CATEGORIES.map((cat) => {
    const field = stats[cat.valueKey]
    const count = parseCount(typeof field === 'object' && field !== null ? field.value : undefined)
    return { ...cat, count }
  })

  const total = items.reduce((sum, item) => sum + item.count, 0)
  const maxCount = Math.max(...items.map((item) => item.count), 1)

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t('dashboard.legend.title')}
        </h3>
        <span className="text-[10px] font-medium text-muted">
          {total.toLocaleString('id-ID')} titik
        </span>
      </div>

    <div className="space-y-2">
      {items.map((item) => {
        const pct = total > 0 ? (item.count / total) * 100 : 0
        const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0
        return (
          <div
            key={item.key}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: item.colorVar }}>
              <item.Icon size={12} className="text-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-foreground truncate">
                  {t(item.labelKey)}
                </span>
                <span className="text-[10px] font-semibold text-foreground">
                  {item.count.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="mt-0.5 h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    backgroundColor: item.colorVar,
                    width: `${Math.max(barWidth, 4)}%`,
                    opacity: 0.85,
                  }}
                />
              </div>
              <span className="text-[9px] text-muted">{pct.toFixed(0)}%</span>
            </div>
          </div>
        )
      })}
    </div>
    </section>
  )
}
