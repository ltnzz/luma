import { useMemo } from 'react'
import type { FacilityItem } from '../types/facility.types'
import {
  MapPinIcon,
  TreeIcon,
  BusIcon,
  HospitalIcon,
  SchoolIcon,
  DropletIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SearchIcon,
  CloseIcon,
} from '../../../components/ui/Icons'

interface FacilityDirectoryCardProps {
  facilities: FacilityItem[]
  loading: boolean
  selectedFacilityId: string | null
  activeCategory: string
  activeWilayah: string
  onSelectCategory: (category: string) => void
  onSelectWilayah: (wilayah: string) => void
  onSelectFacility: (facility: FacilityItem) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const CATEGORIES = [
  { key: 'all', label: 'Semua', Icon: MapPinIcon },
  { key: 'fasum', label: 'RTH / Taman', Icon: TreeIcon },
  { key: 'transum', label: 'Transportasi', Icon: BusIcon },
  { key: 'kesehatan', label: 'Kesehatan', Icon: HospitalIcon },
  { key: 'pendidikan', label: 'Pendidikan', Icon: SchoolIcon },
  { key: 'lingkungan', label: 'Lingkungan', Icon: DropletIcon },
]

const WILAYAH_OPTIONS = [
  { key: 'ALL', label: 'Seluruh DKI Jakarta' },
  { key: 'JAKARTA PUSAT', label: 'Jakarta Pusat' },
  { key: 'JAKARTA UTARA', label: 'Jakarta Utara' },
  { key: 'JAKARTA BARAT', label: 'Jakarta Barat' },
  { key: 'JAKARTA SELATAN', label: 'Jakarta Selatan' },
  { key: 'JAKARTA TIMUR', label: 'Jakarta Timur' },
]

export function FacilityDirectoryCard({
  facilities,
  loading,
  selectedFacilityId,
  activeCategory,
  activeWilayah,
  onSelectCategory,
  onSelectWilayah,
  onSelectFacility,
  searchQuery,
  onSearchChange,
  isCollapsed,
  onToggleCollapse,
}: FacilityDirectoryCardProps) {
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchCategory = activeCategory === 'all' || f.category.toLowerCase() === activeCategory.toLowerCase()
      const matchWilayah = activeWilayah === 'ALL' || f.wilayah.toUpperCase() === activeWilayah.toUpperCase()
      const matchSearch =
        !searchQuery ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.address && f.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.subCategory && f.subCategory.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchCategory && matchWilayah && matchSearch
    })
  }, [facilities, activeCategory, activeWilayah, searchQuery])

  return (
    <aside
      className={`pointer-events-auto flex flex-col rounded-2xl border border-border bg-surface text-foreground shadow-xl transition-all duration-300 ${isCollapsed
          ? 'h-14 w-80 overflow-hidden'
          : 'max-h-[calc(100vh-16rem)] w-88 sm:w-96'
        }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-border p-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-text">
            <MapPinIcon size={14} />
          </span>
          <div>
            <h3 className="text-xs font-bold text-foreground">Direktori Fasilitas Publik</h3>
            <p className="text-[10px] text-muted">{filteredFacilities.length} titik ditemukan</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-xs text-muted hover:bg-surface-muted transition-colors"
          title={isCollapsed ? 'Perluas panel' : 'Kecilkan panel'}
        >
          {isCollapsed ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col gap-3 p-3 overflow-hidden flex-1">
          {/* Filter Wilayah Dropdown & Search */}
          <div className="flex flex-col gap-2">
            <select
              value={activeWilayah}
              onChange={(e) => onSelectWilayah(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:outline-primary"
            >
              {WILAYAH_OPTIONS.map((w) => (
                <option key={w.key} value={w.key}>
                  {w.label}
                </option>
              ))}
            </select>

            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">
                <SearchIcon size={13} />
              </span>
              <input
                type="text"
                placeholder="Cari fasilitas publik / alamat..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-muted/50 pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted focus:bg-surface focus:outline-primary"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  <CloseIcon size={12} />
                </button>
              ) : null}
            </div>
          </div>

          {/* Category Chips Filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.key
              const Icon = cat.Icon
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => onSelectCategory(cat.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${active
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground'
                    }`}
                >
                  <Icon size={12} />
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>

          {/* List Kartu Fasilitas */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
            {loading ? (
              <div className="flex flex-col gap-2 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-muted" />
                ))}
              </div>
            ) : filteredFacilities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-muted">
                <SearchIcon size={24} className="mb-1 opacity-40" />
                <p>Tidak ada fasilitas yang cocok dengan filter.</p>
              </div>
            ) : (
              filteredFacilities.map((facility) => {
                const isSelected = selectedFacilityId === facility.id
                return (
                  <div
                    key={facility.id}
                    onClick={() => onSelectFacility(facility)}
                    className={`cursor-pointer rounded-xl border p-2.5 text-left transition-all ${isSelected
                        ? 'border-primary bg-primary-soft/40 shadow-xs'
                        : 'border-border bg-surface hover:border-muted hover:bg-surface-muted/50'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="text-xs font-bold text-foreground line-clamp-1">{facility.name}</h4>
                      <span className="shrink-0 rounded-md bg-surface-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted">
                        {facility.subCategory || facility.category}
                      </span>
                    </div>

                    <p className="mt-1 text-[11px] text-muted line-clamp-1">{facility.address ?? facility.wilayah}</p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted pt-1.5 border-t border-border/60">
                      <span>{facility.wilayah}</span>
                      {facility.budget?.total ? (
                        <span className="font-semibold text-foreground">{facility.budget.total}</span>
                      ) : (
                        <span className="text-primary font-medium">Buka Detail →</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
