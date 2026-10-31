import type { ReactElement } from 'react'
import type { SchoolLevelsFilter } from '../hooks/useSchoolsData'
import {
  HospitalIcon,
  TreeIcon,
  SchoolIcon,
} from '../../../components/ui/Icons'

export type FaskesTypeFilter = 'ALL' | 'RSUD' | 'PUSKESMAS'
export type RthTypeFilter = 'ALL' | 'TAMAN' | 'HUTAN'

export interface FaskesFilterState {
  enabled: boolean
  subType: FaskesTypeFilter
}

export interface RthFilterState {
  enabled: boolean
  subType: RthTypeFilter
}

interface MapFilterBarProps {
  activeWilayah: string
  // Faskes Filter
  faskesFilter: FaskesFilterState
  onToggleFaskes: () => void
  onChangeFaskesSubType: (subType: FaskesTypeFilter) => void
  faskesCounts: { total: number; rsud: number; puskesmas: number }
  // RTH Filter
  rthFilter: RthFilterState
  onToggleRth: () => void
  onChangeRthSubType: (subType: RthTypeFilter) => void
  rthCounts: { total: number; taman: number; hutan: number }
  // Sekolah Filter
  levelFilters: SchoolLevelsFilter
  onToggleLevel: (level: keyof SchoolLevelsFilter) => void
  onResetLevels?: () => void
  schoolCounts: { sma: number; smp: number; sd: number; total: number }
}

/** Warna kategori konsisten dengan marker peta (map-marker.ts). */
const CATEGORY_ACCENT: Record<string, string> = {
  kesehatan: 'var(--luma-map-health)',
  rth: 'var(--luma-map-rth)',
  sekolah: 'var(--luma-map-education)',
}

/** Label wilayah untuk tampilan statis di filter bar (non-interaktif). */
const WILAYAH_LABELS: Record<string, string> = {
  ALL: 'Seluruh DKI Jakarta',
  'JAKARTA PUSAT': 'Jakarta Pusat',
  'JAKARTA UTARA': 'Jakarta Utara',
  'JAKARTA BARAT': 'Jakarta Barat',
  'JAKARTA SELATAN': 'Jakarta Selatan',
  'JAKARTA TIMUR': 'Jakarta Timur',
  'KEP. SERIBU': 'Kep. Seribu',
}

export function MapFilterBar({
  activeWilayah,
  faskesFilter,
  onToggleFaskes,
  onChangeFaskesSubType,
  faskesCounts,
  rthFilter,
  onToggleRth,
  onChangeRthSubType,
  rthCounts,
  levelFilters,
  onToggleLevel,
  schoolCounts,
}: MapFilterBarProps) {
  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-2 max-w-full rounded-xl border border-border bg-surface/90 px-3 sm:px-3.5 py-1.5 sm:py-2 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 duration-300">
      {/* 1. Label wilayah terpilih (statis, non-interaktif) */}
      <span className="text-xs font-bold text-primary truncate max-w-[14rem]">
        {WILAYAH_LABELS[activeWilayah] ?? activeWilayah}
      </span>
      <span className="h-3.5 w-px bg-border shrink-0" />

      {/* 2. Filter Faskes (Kesehatan) */}
      <CategoryFilterGroup
        label="Kesehatan"
        icon={<HospitalIcon size={12} />}
        accent={CATEGORY_ACCENT.kesehatan}
        enabled={faskesFilter.enabled}
        count={faskesCounts.total}
        onToggle={onToggleFaskes}
      />
      {faskesFilter.enabled && (
        <SubFilterRow
          items={[
            { key: 'ALL', label: 'Semua', count: faskesCounts.total },
            { key: 'RSUD', label: 'RSUD', count: faskesCounts.rsud },
            { key: 'PUSKESMAS', label: 'Pusk.', count: faskesCounts.puskesmas },
          ]}
          active={faskesFilter.subType}
          onChange={onChangeFaskesSubType}
        />
      )}

      {/* 4. Filter RTH (Ruang Terbuka Hijau & Fasum) */}
      <CategoryFilterGroup
        label="RTH"
        icon={<TreeIcon size={12} />}
        accent={CATEGORY_ACCENT.rth}
        enabled={rthFilter.enabled}
        count={rthCounts.total}
        onToggle={onToggleRth}
      />
      {rthFilter.enabled && (
        <SubFilterRow
          items={[
            { key: 'ALL', label: 'Semua', count: rthCounts.total },
            { key: 'TAMAN', label: 'Taman', count: rthCounts.taman },
            { key: 'HUTAN', label: 'Hutan', count: rthCounts.hutan },
          ]}
          active={rthFilter.subType}
          onChange={onChangeRthSubType}
        />
      )}

      {/* 5. Filter Jenjang Sekolah di Wilayah Ini */}
      <CategoryFilterGroup
        label="Sekolah"
        icon={<SchoolIcon size={12} />}
        accent={CATEGORY_ACCENT.sekolah}
        enabled={levelFilters.sma || levelFilters.smp || levelFilters.sd}
        count={schoolCounts.total}
        onToggle={() => {}}
        isMulti
      />
      <div className="flex items-center gap-1 shrink-0">
        <SchoolLevelChip
          level="sma"
          label="SMA"
          count={schoolCounts.sma}
          active={levelFilters.sma}
          onToggle={() => onToggleLevel('sma')}
        />
        <SchoolLevelChip
          level="smp"
          label="SMP"
          count={schoolCounts.smp}
          active={levelFilters.smp}
          onToggle={() => onToggleLevel('smp')}
        />
        <SchoolLevelChip
          level="sd"
          label="SD"
          count={schoolCounts.sd}
          active={levelFilters.sd}
          onToggle={() => onToggleLevel('sd')}
        />
      </div>
    </div>
  )
}

function CategoryFilterGroup({
  label,
  icon,
  accent,
  enabled,
  count,
  onToggle,
}: {
  label: string
  icon: ReactElement
  accent: string
  enabled: boolean
  count: number
  onToggle: () => void
  isMulti?: boolean
}) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
          enabled
            ? 'text-white shadow-xs'
            : 'border border-border bg-surface-muted/60 text-muted hover:text-foreground hover:bg-surface-muted'
        }`}
        style={enabled ? { backgroundColor: accent } : undefined}
        title={`Nyalakan/matikan ${label}`}
      >
        {icon}
        <span>{label}</span>
        <span
          className={`text-[9px] px-1 py-0.2 rounded-md ${
            enabled ? 'bg-black/20 text-white' : 'bg-surface text-muted'
          }`}
        >
          {count}
        </span>
      </button>
    </div>
  )
}

function SubFilterRow<T extends string>({
  items,
  active,
  onChange,
}: {
  items: Array<{ key: T; label: string; count: number }>
  active: T
  onChange: (key: T) => void
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border/80 bg-surface-muted/40 p-0.5">
      {items.map((item) => {
        const isActive = active === item.key
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${isActive
              ? 'bg-surface text-foreground shadow-xs'
              : 'text-muted hover:text-foreground'
            }`}
            title={item.label}
          >
            {item.label} ({item.count})
          </button>
        )
      })}
    </div>
  )
}

function SchoolLevelChip({
  label,
  count,
  active,
  onToggle,
}: {
  level: keyof SchoolLevelsFilter
  label: string
  count: number
  active: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
        active
          ? 'text-white shadow-xs'
          : 'border border-border bg-surface-muted/60 text-muted hover:text-foreground hover:bg-surface-muted'
      }`}
      style={active ? { backgroundColor: 'var(--luma-map-education)' } : undefined}
      title={`Tampilkan ${label} Negeri di kota ini`}
    >
      <span>{label}</span>
      <span className={`text-[9px] px-1 py-0.2 rounded-md ${
        active ? 'bg-black/20 text-white' : 'bg-surface text-muted'
      }`}>
        {count}
      </span>
    </button>
  )
}
