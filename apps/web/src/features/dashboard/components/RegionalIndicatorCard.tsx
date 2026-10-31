import { useState, useRef, useEffect } from 'react'
import type { ReactElement } from 'react'
import { Skeleton } from '../../../components/ui/Skeleton'
import { VERIFIED_MAP_KPIS, type KpiViewModel } from '../kpiMapping'
import {
  TreeIcon,
  SchoolIcon,
  HospitalIcon,
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
  { key: 'KEP. SERIBU', label: 'Kep. Seribu' },
]

const FACILITY_SECTOR_KEYS = ['pendidikan', 'kesehatan', 'rth', 'transportasi']

export type IndicatorDataSourceMode = 'map' | 'macro'

interface RegionalIndicatorCardProps {
  /** KPIs synchronized 1:1 with verified map facilities (default). */
  mapKpis?: KpiViewModel[] | null
  /** Macro census statistics (BPS & Open Data DKI). */
  macroKpis?: KpiViewModel[] | null
  /** Backwards compatibility prop for raw KPIs. */
  kpis?: KpiViewModel[] | null
  activeWilayah: string
  onSelectWilayah?: (wilayah: string) => void
  loading?: boolean
  isCollapsed?: boolean
  onToggleCollapse?: (collapsed: boolean) => void
}

// Warna kategori konsisten dengan marker peta (map-marker.ts)
const CATEGORY_CONFIG: Record<string, { accent: string; icon: () => ReactElement }> = {
  pendidikan: {
    accent: 'var(--luma-map-transit)',
    icon: () => <SchoolIcon size={12} className="shrink-0" />,
  },
  kesehatan: {
    accent: 'var(--luma-map-health)',
    icon: () => <HospitalIcon size={12} className="shrink-0" />,
  },
  rth: {
    accent: 'var(--luma-map-rth)',
    icon: () => <TreeIcon size={12} className="shrink-0" />,
  },
  transportasi: {
    accent: 'var(--luma-map-education)',
    icon: () => <BusIcon size={12} className="shrink-0" />,
  },
}

/**
 * RegionalIndicatorCard (Public Facilities Card):
 * - Melayang di sisi kiri atas (tepat di bawah Kapsul Status Lingkungan Hidup).
 * - Menampilkan 4 sektor fasilitas publik utama (Pendidikan, Kesehatan, RTH, Transportasi) dalam grid 2x2.
 * - Setiap kartu sektor memiliki identitas warna konsisten dengan marker peta.
 * - Desain tombol minimalis (less buttons) dengan tab teks flat dan icon-only close button.
 * - Terintegrasi dengan Auto-Accordion cerdas agar tidak bertabrakan dengan widget transit.
 */
export function RegionalIndicatorCard({
  mapKpis,
  macroKpis,
  kpis,
  activeWilayah,
  onSelectWilayah,
  loading = false,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}: RegionalIndicatorCardProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed
  const setCollapsed = (val: boolean) => {
    if (onToggleCollapse) {
      onToggleCollapse(val)
    } else {
      setInternalCollapsed(val)
    }
  }

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dataSourceMode, setDataSourceMode] = useState<IndicatorDataSourceMode>('map')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Tutup dropdown saat klik di luar atau tombol Escape ditekan
  useEffect(() => {
    if (!isDropdownOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        event.target instanceof Node &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDropdownOpen])

  const activeLabel =
    WILAYAH_OPTIONS.find((w) => w.key === activeWilayah)?.label ?? activeWilayah

  const facilityTotal = VERIFIED_MAP_KPIS[activeWilayah]?.total ?? 1620

  // Tentukan KPI mana yang aktif berdasarkan mode yang dipilih
  const resolvedKpis =
    dataSourceMode === 'map'
      ? (mapKpis ?? kpis)
      : (macroKpis ?? kpis ?? mapKpis)

  const facilityKpis = resolvedKpis?.filter((k) => FACILITY_SECTOR_KEYS.includes(k.key))

  // Status Terlipat: Pill ramping tanpa sub-button terpisah
  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-border/80 bg-surface/90 px-3 py-1.5 shadow-md backdrop-blur-md hover:border-primary/50 text-foreground transition-all cursor-pointer select-none w-full sm:w-auto"
        title="Buka kartu fasilitas wilayah"
        aria-label="Buka kartu fasilitas wilayah"
      >
        <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
        <span className="text-xs font-semibold">
          {activeLabel} • {dataSourceMode === 'map' ? `${facilityTotal} Pin` : 'Sensus'}
        </span>
        <ChevronDownIcon size={12} className="text-muted ml-0.5" />
      </button>
    )
  }

  return (
    <div className="pointer-events-auto w-full sm:w-[295px] rounded-xl border border-border/80 bg-surface/90 p-2 sm:p-2.5 shadow-xl backdrop-blur-md transition-all duration-200 select-none">
      {/* Header Kartu: Status Dot + Judul + Tombol Tutup Icon-Only */}
      <div className="flex flex-col gap-1.5 border-b border-border/80 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
            <span className="text-xs font-bold text-foreground tracking-tight">
              Fasilitas Publik
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setCollapsed(true)
              setIsDropdownOpen(false)
            }}
            className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-muted/60 transition-colors cursor-pointer"
            title="Tutup kartu fasilitas"
            aria-label="Tutup kartu fasilitas"
          >
            <ChevronUpIcon size={13} />
          </button>
        </div>

        {/* Baris 2: Dropdown Pemilih Wilayah Full-Width */}
        {onSelectWilayah ? (
          <div ref={dropdownRef} className="relative w-full">
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-surface-muted/50 px-2.5 py-1.5 text-xs font-bold text-primary hover:border-primary/50 hover:bg-surface-muted/70 transition-colors cursor-pointer"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              title="Pilih Wilayah Jakarta"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate">{activeLabel}</span>
                <span className="text-[10px] font-medium text-muted shrink-0">
                  ({facilityTotal} Pin)
                </span>
              </div>
              <ChevronDownIcon
                size={12}
                className={`text-primary shrink-0 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Menu Popover Custom Opaque z-50 */}
            {isDropdownOpen && (
              <div
                role="listbox"
                className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-surface/95 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
              >
                {WILAYAH_OPTIONS.map((w) => {
                  const isSelected = w.key === activeWilayah
                  const count = VERIFIED_MAP_KPIS[w.key]?.total ?? 1620
                  return (
                    <button
                      key={w.key}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onSelectWilayah(w.key)
                        setIsDropdownOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary/15 font-bold text-primary border border-primary/40'
                          : 'text-foreground font-medium hover:bg-surface-muted hover:text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isSelected && (
                          <span className="text-primary text-[11px] leading-none shrink-0">✓</span>
                        )}
                        <span className="truncate">{w.label}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-muted shrink-0 pl-2">
                        {count} Pin
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs font-bold text-primary truncate">{activeLabel}</span>
        )}

        {/* Baris 3: Minimalist Tab Switch ("Less Buttons") */}
        <div className="flex items-center gap-3 text-[11px] pt-1">
          <button
            type="button"
            onClick={() => setDataSourceMode('map')}
            className={`pb-0.5 transition-all cursor-pointer ${
              dataSourceMode === 'map'
                ? 'font-bold text-primary border-b-2 border-primary'
                : 'text-muted hover:text-foreground font-medium'
            }`}
          >
            Pin Peta ({facilityTotal})
          </button>
          <button
            type="button"
            onClick={() => setDataSourceMode('macro')}
            className={`pb-0.5 transition-all cursor-pointer ${
              dataSourceMode === 'macro'
                ? 'font-bold text-primary border-b-2 border-primary'
                : 'text-muted hover:text-foreground font-medium'
            }`}
          >
            Sensus Makro
          </button>
        </div>
      </div>

      {/* Grid 4 Sektor Fasilitas Publik (2 Kolom x 2 Baris) */}
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:gap-2">
        {loading || !facilityKpis ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-lg border border-border/60 bg-surface-muted/40 p-1.5 sm:p-2 h-[64px] sm:h-[80px]"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-2.5 w-16 rounded" />
                <Skeleton className="h-3 w-3 rounded-full" />
              </div>
              <Skeleton className="h-4 w-12 rounded sm:w-16 mt-1" />
              <Skeleton className="h-2 w-20 rounded sm:w-24 mt-1" />
            </div>
          ))
        ) : (
          facilityKpis.map((kpi) => {
            const config = CATEGORY_CONFIG[kpi.key]
            const accentColor = config?.accent
            const Icon = config?.icon
            return (
              <FacilitySectorCard
                key={kpi.key}
                title={kpi.title}
                value={kpi.value ?? '—'}
                sub={kpi.sub ?? null}
                icon={Icon ? <Icon /> : null}
                accentColor={accentColor}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

function FacilitySectorCard({
  title,
  value,
  sub,
  icon,
  accentColor,
}: {
  title: string
  value: string
  sub: string | null
  icon: ReactElement | null
  accentColor: string | undefined
}) {
  const hasAccent = Boolean(accentColor)

  return (
    <div
      className={`
        flex flex-col justify-between rounded-lg p-1.5 sm:p-2 hover:bg-surface-muted/70 transition-colors min-h-[64px] sm:min-h-[80px]
        border border-border/70 bg-surface-muted/50
      `}
      style={
        hasAccent ? { borderColor: accentColor } : {}
      }
    >
      <div>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs font-medium text-muted truncate">
            {title}
          </span>
          {icon && (
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: hasAccent ? accentColor : undefined,
                color: hasAccent ? '#ffffff' : undefined,
              }}
            >
              {icon}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs sm:text-[13px] font-black text-foreground tracking-tight line-clamp-1">
          {value}
        </p>
      </div>
      {sub && (
        <p className="mt-0.5 text-[9px] text-muted leading-tight line-clamp-2">
          {sub}
        </p>
      )}
    </div>
  )
}
