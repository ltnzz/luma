import { useState } from 'react'
import type { KpiViewModel } from '../kpiMapping'
import {
  TreeIcon,
  WindIcon,
  SchoolIcon,
  HospitalIcon,
  DropletIcon,
  BusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '../../../components/ui/Icons'

const WILAYAH_OPTIONS = [
  { key: 'ALL', label: 'Seluruh DKI Jakarta' },
  { key: 'JAKARTA PUSAT', label: 'Jakarta Pusat' },
  { key: 'JAKARTA UTARA', label: 'Jakarta Utara' },
  { key: 'JAKARTA BARAT', label: 'Jakarta Barat' },
  { key: 'JAKARTA SELATAN', label: 'Jakarta Selatan' },
  { key: 'JAKARTA TIMUR', label: 'Jakarta Timur' },
]

interface RegionalIndicatorCardProps {
  kpis: KpiViewModel[] | null
  activeWilayah: string
  onSelectWilayah?: (wilayah: string) => void
  loading?: boolean
}

// Icon mapping per sektor KPI
function getKpiIcon(key: string) {
  switch (key) {
    case 'kualitasAir':
      return DropletIcon
    case 'kualitasUdara':
      return WindIcon
    case 'pendidikan':
      return SchoolIcon
    case 'kesehatan':
      return HospitalIcon
    case 'rth':
      return TreeIcon
    case 'transportasi':
    default:
      return BusIcon
  }
}

/**
 * RegionalIndicatorCard:
 * - Kompak (~320px - 340px) melayang di sisi kiri atas kanvas peta.
 * - Menampilkan 6 kartu indikator wilayah (2 kolom x 3 baris) dengan angka tebal & terstruktur.
 * - Dapat diminimalkan (collapse) menjadi kapsul kecil dengan tombol Tutup / Buka.
 */
export function RegionalIndicatorCard({
  kpis,
  activeWilayah,
  onSelectWilayah,
  loading = false,
}: RegionalIndicatorCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const activeLabel =
    WILAYAH_OPTIONS.find((w) => w.key === activeWilayah)?.label ?? activeWilayah

  // Status Terlipat (Collapsed Pill)
  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setIsCollapsed(false)}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-surface/95 px-3 py-1.5 shadow-lg backdrop-blur-md hover:border-primary/50 text-foreground transition-all cursor-pointer"
        title="Buka indikator wilayah"
        aria-label="Buka indikator wilayah"
      >
        <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
        <span className="text-xs font-semibold">{activeLabel}</span>
        <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary pl-1.5 border-l border-border">
          <span>Buka</span>
          <ChevronDownIcon size={12} />
        </span>
      </button>
    )
  }

  return (
    <div className="pointer-events-auto w-[295px] sm:w-[330px] rounded-2xl border border-border bg-surface/95 p-2.5 sm:p-3 shadow-xl backdrop-blur-md transition-all duration-200 select-none">
      {/* Header Kartu: Status Dot + Judul + Tombol Tutup (Dua baris, bebas tumpang-tindih) */}
      <div className="flex flex-col gap-1.5 border-b border-border/80 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
            <span className="text-xs font-bold text-foreground tracking-tight">
              Indikator Wilayah
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-muted hover:bg-surface-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
            title="Tutup indikator wilayah"
            aria-label="Tutup indikator wilayah"
          >
            <span>Tutup</span>
            <ChevronUpIcon size={12} />
          </button>
        </div>

        {/* Baris 2: Dropdown Pemilih Wilayah Full-Width */}
        {onSelectWilayah ? (
          <div className="relative flex items-center rounded-lg border border-border/70 bg-surface-muted/60 px-2.5 py-1 hover:border-primary/50 transition-colors">
            <select
              value={activeWilayah}
              onChange={(e) => onSelectWilayah(e.target.value)}
              className="w-full cursor-pointer bg-transparent text-xs font-bold text-primary focus:outline-none pr-4 appearance-none"
              title="Pilih Wilayah Jakarta"
            >
              {WILAYAH_OPTIONS.map((w) => (
                <option key={w.key} value={w.key} className="bg-surface text-foreground font-medium">
                  {w.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon size={12} className="pointer-events-none absolute right-2 text-primary shrink-0" />
          </div>
        ) : (
          <span className="text-xs font-bold text-primary truncate">{activeLabel}</span>
        )}
      </div>

      {/* Grid 6 Sektor Indikator (2 Kolom x 3 Baris) */}
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {loading || !kpis ? (
          <div className="col-span-2 flex items-center justify-center py-6 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse mr-2" />
            <span>Memuat indikator wilayah...</span>
          </div>
        ) : (
          kpis.map((kpi) => {
            const Icon = getKpiIcon(kpi.key)
            return (
              <div
                key={kpi.key}
                className="flex flex-col justify-between rounded-xl border border-border/70 bg-surface-muted/40 p-2 hover:border-primary/40 hover:bg-surface-muted/70 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10.5px] font-medium text-muted truncate">
                      {kpi.title}
                    </span>
                    <Icon size={12} className="text-primary shrink-0" />
                  </div>
                  <p className="mt-0.5 text-xs sm:text-[13px] font-black text-foreground tracking-tight line-clamp-1">
                    {kpi.value ?? '—'}
                  </p>
                </div>
                {kpi.sub && (
                  <p className="mt-0.5 text-[9.5px] text-muted leading-tight line-clamp-2">
                    {kpi.sub}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

