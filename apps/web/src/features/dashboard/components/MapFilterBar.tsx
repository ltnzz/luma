import { useState, useRef, useEffect } from 'react'
import type { SchoolLevelsFilter } from '../hooks/useSchoolsData'
import {
  ChevronDownIcon,
  HospitalIcon,
  TreeIcon,
  SchoolIcon,
} from '../../../components/ui/Icons'

const WILAYAH_ITEMS = [
  { key: 'ALL', label: 'Seluruh DKI Jakarta' },
  { key: 'JAKARTA PUSAT', label: 'Jakarta Pusat' },
  { key: 'JAKARTA SELATAN', label: 'Jakarta Selatan' },
  { key: 'JAKARTA BARAT', label: 'Jakarta Barat' },
  { key: 'JAKARTA UTARA', label: 'Jakarta Utara' },
  { key: 'JAKARTA TIMUR', label: 'Jakarta Timur' },
  { key: 'KEP. SERIBU', label: 'Kep. Seribu' },
] as const

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
  onSelectWilayah: (wilayah: string) => void
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
  onResetLevels: () => void
  schoolCounts: { sma: number; smp: number; sd: number; total: number }
}

export function MapFilterBar({
  activeWilayah,
  onSelectWilayah,
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
  const [isWilayahOpen, setIsWilayahOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsWilayahOpen(false)
      }
    }
    if (isWilayahOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isWilayahOpen])

  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-surface/95 px-3 py-1.5 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 duration-300 flex-nowrap whitespace-nowrap">
      {/* 1. Tombol Kembali ke Seluruh DKI */}
      <button
        type="button"
        onClick={() => onSelectWilayah('ALL')}
        className="flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
        title="Kembali ke tampilan makro seluruh provinsi"
      >
        <span className="text-sm leading-none font-extrabold">‹</span>
        <span className="hidden xs:inline">Seluruh DKI</span>
      </button>

      <span className="h-3.5 w-px bg-border shrink-0" />

      {/* 2. Nama Wilayah / Dropdown Ganti Kota */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsWilayahOpen((prev) => !prev)}
          className="flex items-center gap-1 text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
          aria-haspopup="listbox"
          aria-expanded={isWilayahOpen}
        >
          <span>{activeWilayah}</span>
          <ChevronDownIcon
            size={12}
            className={`text-muted transition-transform ${isWilayahOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isWilayahOpen && (
          <div className="absolute top-full left-0 mt-2 z-30 min-w-[170px] rounded-xl border border-border bg-surface p-1 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
            {WILAYAH_ITEMS.map((item) => {
              const isSelected = activeWilayah === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onSelectWilayah(item.key)
                    setIsWilayahOpen(false)
                  }}
                  className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-foreground hover:bg-surface-muted'
                  }`}
                >
                  <span>{item.key === 'ALL' ? '‹ Seluruh DKI Jakarta' : item.key}</span>
                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <span className="h-3.5 w-px bg-border shrink-0" />

      {/* 3. Filter Faskes (Kesehatan) */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onToggleFaskes}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
            faskesFilter.enabled
              ? 'bg-danger text-white shadow-2xs'
              : 'border border-border bg-surface-muted/60 text-muted hover:text-foreground hover:bg-surface-muted'
          }`}
          title="Nyalakan/matikan fasilitas kesehatan"
        >
          <HospitalIcon size={12} className={faskesFilter.enabled ? 'text-white' : 'text-danger'} />
          <span>Kesehatan</span>
          <span
            className={`text-[9px] px-1 py-0.2 rounded-md ${
              faskesFilter.enabled ? 'bg-black/20 text-white' : 'bg-surface text-muted'
            }`}
          >
            {faskesCounts.total}
          </span>
        </button>

        {faskesFilter.enabled && (
          <div className="flex items-center gap-0.5 rounded-lg border border-border/80 bg-surface-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => onChangeFaskesSubType('ALL')}
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                faskesFilter.subType === 'ALL'
                  ? 'bg-surface text-foreground shadow-2xs'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => onChangeFaskesSubType('RSUD')}
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                faskesFilter.subType === 'RSUD'
                  ? 'bg-surface text-foreground shadow-2xs'
                  : 'text-muted hover:text-foreground'
              }`}
              title="Rumah Sakit Umum Daerah Tipe A, B, D"
            >
              RSUD ({faskesCounts.rsud})
            </button>
            <button
              type="button"
              onClick={() => onChangeFaskesSubType('PUSKESMAS')}
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                faskesFilter.subType === 'PUSKESMAS'
                  ? 'bg-surface text-foreground shadow-2xs'
                  : 'text-muted hover:text-foreground'
              }`}
              title="Puskesmas Kecamatan"
            >
              Pusk. ({faskesCounts.puskesmas})
            </button>
          </div>
        )}
      </div>

      <span className="h-3.5 w-px bg-border shrink-0" />

      {/* 4. Filter RTH (Ruang Terbuka Hijau & Fasum) */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onToggleRth}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
            rthFilter.enabled
              ? 'bg-primary text-on-primary shadow-2xs'
              : 'border border-border bg-surface-muted/60 text-muted hover:text-foreground hover:bg-surface-muted'
          }`}
          title="Nyalakan/matikan Ruang Terbuka Hijau"
        >
          <TreeIcon size={12} className={rthFilter.enabled ? 'text-on-primary' : 'text-primary'} />
          <span>RTH</span>
          <span
            className={`text-[9px] px-1 py-0.2 rounded-md ${
              rthFilter.enabled ? 'bg-black/20 text-white' : 'bg-surface text-muted'
            }`}
          >
            {rthCounts.total}
          </span>
        </button>

        {rthFilter.enabled && (
          <div className="flex items-center gap-0.5 rounded-lg border border-border/80 bg-surface-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => onChangeRthSubType('ALL')}
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                rthFilter.subType === 'ALL'
                  ? 'bg-surface text-foreground shadow-2xs'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => onChangeRthSubType('TAMAN')}
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                rthFilter.subType === 'TAMAN'
                  ? 'bg-surface text-foreground shadow-2xs'
                  : 'text-muted hover:text-foreground'
              }`}
              title="Taman Publik & Ruang Komunitas"
            >
              Taman ({rthCounts.taman})
            </button>
            <button
              type="button"
              onClick={() => onChangeRthSubType('HUTAN')}
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                rthFilter.subType === 'HUTAN'
                  ? 'bg-surface text-foreground shadow-2xs'
                  : 'text-muted hover:text-foreground'
              }`}
              title="Hutan Kota & Konservasi Alam"
            >
              Hutan ({rthCounts.hutan})
            </button>
          </div>
        )}
      </div>

      <span className="h-3.5 w-px bg-border shrink-0" />

      {/* 5. Filter Jenjang Sekolah di Wilayah Ini (Default: False) */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="flex items-center gap-1 text-[11px] font-bold text-muted px-1">
          <SchoolIcon size={12} className="text-primary" />
          <span className="hidden sm:inline">Sekolah</span>
        </div>

        <button
          type="button"
          onClick={() => onToggleLevel('sma')}
          className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
            levelFilters.sma
              ? 'bg-primary text-on-primary shadow-2xs'
              : 'border border-border bg-surface-muted/60 text-muted hover:text-foreground hover:bg-surface-muted'
          }`}
          title="Tampilkan SMA Negeri di kota ini"
        >
          <span>SMA</span>
          <span
            className={`text-[9px] px-1 py-0.2 rounded-md ${
              levelFilters.sma ? 'bg-black/20 text-white' : 'bg-surface text-muted'
            }`}
          >
            {schoolCounts.sma}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onToggleLevel('smp')}
          className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
            levelFilters.smp
              ? 'bg-primary text-on-primary shadow-2xs'
              : 'border border-border bg-surface-muted/60 text-muted hover:text-foreground hover:bg-surface-muted'
          }`}
          title="Tampilkan SMP Negeri di kota ini"
        >
          <span>SMP</span>
          <span
            className={`text-[9px] px-1 py-0.2 rounded-md ${
              levelFilters.smp ? 'bg-black/20 text-white' : 'bg-surface text-muted'
            }`}
          >
            {schoolCounts.smp}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onToggleLevel('sd')}
          className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
            levelFilters.sd
              ? 'bg-primary text-on-primary shadow-2xs'
              : 'border border-border bg-surface-muted/60 text-muted hover:text-foreground hover:bg-surface-muted'
          }`}
          title="Tampilkan SD Negeri di kota ini"
        >
          <span>SD</span>
          <span
            className={`text-[9px] px-1 py-0.2 rounded-md ${
              levelFilters.sd ? 'bg-black/20 text-white' : 'bg-surface text-muted'
            }`}
          >
            {schoolCounts.sd}
          </span>
        </button>
      </div>
    </div>
  )
}
