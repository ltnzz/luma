import {
  CloseIcon,
  HospitalIcon,
  TreeIcon,
  SchoolIcon,
  BusIcon,
  DropletIcon,
} from '../../../components/ui/Icons'
import { TRANSJAKARTA_CORRIDORS, type CorridorInfo } from '../../../data/transit-corridors'
import type { KpiCategory } from './KpiMetricsDock'

export type FaskesSubFilter = 'all' | 'rsud' | 'puskesmas' | 'other'
export type RthSubFilter = 'all' | 'taman' | 'hutan' | 'jalur'
export type SchoolSubFilter = 'all' | 'sma' | 'smp' | 'sd'

interface ContextualCategoryFilterCardProps {
  category: KpiCategory
  scopeLabel?: string
  // Sub-filter states
  faskesFilter?: FaskesSubFilter
  onFaskesFilterChange?: (filter: FaskesSubFilter) => void
  rthFilter?: RthSubFilter
  onRthFilterChange?: (filter: RthSubFilter) => void
  schoolFilter?: SchoolSubFilter
  onSchoolFilterChange?: (filter: SchoolSubFilter) => void
  selectedCorridorId?: string | null
  onSelectCorridor?: (corridor: CorridorInfo | null) => void
  corridors?: CorridorInfo[]
  isWaterNetworkVisible?: boolean
  onToggleWaterNetwork?: () => void
  // Counts
  faskesCounts?: { total: number; rsud: number; puskesmas: number; other?: number }
  rthCounts?: { total: number; taman: number; hutan: number; jalur?: number }
  schoolCounts?: { total: number; sma: number; smp: number; sd: number }
  onClose: () => void
}

/**
 * ContextualCategoryFilterCard — Panel Filter Dinamis Kolom Kiri
 * Muncul secara otomatis saat salah satu card metrik di dock bawah diklik.
 * Menyajikan sub-filter spesifik kategori fasilitas yang sedang aktif.
 */
export function ContextualCategoryFilterCard({
  category,
  scopeLabel = 'DKI Jakarta',
  faskesFilter = 'all',
  onFaskesFilterChange,
  rthFilter = 'all',
  onRthFilterChange,
  schoolFilter = 'all',
  onSchoolFilterChange,
  selectedCorridorId,
  onSelectCorridor,
  corridors = TRANSJAKARTA_CORRIDORS,
  isWaterNetworkVisible = true,
  onToggleWaterNetwork,
  faskesCounts = { total: 34, rsud: 26, puskesmas: 7, other: 1 },
  rthCounts = { total: 24, taman: 19, hutan: 5, jalur: 0 },
  schoolCounts = { total: 1503, sma: 117, smp: 289, sd: 1097 },
  onClose,
}: ContextualCategoryFilterCardProps) {
  // Category config (title, color, icon)
  const config = {
    kesehatan: {
      title: 'Filter Faskes',
      subtitle: `${faskesCounts.total} Fasilitas Kesehatan`,
      icon: <HospitalIcon size={12} />,
      iconColor: 'bg-rose-500/15 text-rose-600',
      borderColor: 'border-rose-500/30',
      chipActive: 'bg-rose-500 text-white font-bold',
    },
    rth: {
      title: 'Filter Ruang Hijau',
      subtitle: `${rthCounts.total} Area Terbuka Hijau`,
      icon: <TreeIcon size={12} />,
      iconColor: 'bg-emerald-500/15 text-emerald-600',
      borderColor: 'border-emerald-500/30',
      chipActive: 'bg-emerald-600 text-white font-bold',
    },
    sekolah: {
      title: 'Filter Sekolah Negeri',
      subtitle: `${schoolCounts.total.toLocaleString('id-ID')} Satuan Pendidikan`,
      icon: <SchoolIcon size={12} />,
      iconColor: 'bg-blue-500/15 text-blue-600',
      borderColor: 'border-blue-500/30',
      chipActive: 'bg-blue-600 text-white font-bold',
    },
    transum: {
      title: 'Filter Rute BRT',
      subtitle: `${corridors.length} Koridor Transjakarta`,
      icon: <BusIcon size={12} />,
      iconColor: 'bg-purple-500/15 text-purple-600',
      borderColor: 'border-purple-500/30',
      chipActive: 'bg-purple-600 text-white font-bold',
    },
    air: {
      title: 'Filter Jaringan Air',
      subtitle: 'Pipa Akses PAM JAYA',
      icon: <DropletIcon size={12} />,
      iconColor: 'bg-sky-500/15 text-sky-600',
      borderColor: 'border-sky-500/30',
      chipActive: 'bg-sky-600 text-white font-bold',
    },
  }[category]

  return (
    <div
      className="pointer-events-auto flex flex-col gap-1.5 rounded-2xl luma-glass p-2.5 sm:p-3 select-none w-60 sm:w-64 animate-in fade-in slide-in-from-left-2 duration-200"
    >
      {/* 1. Header: Ikon Kategori, Judul, Scope Badge, dan Tombol Close */}
      <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${config.iconColor}`}
          >
            {config.icon}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-foreground leading-tight truncate">
              {config.title}
            </span>
            <span className="text-[9.5px] text-muted leading-tight truncate">
              {scopeLabel} &bull; {config.subtitle}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
          title="Tutup filter kategori (kembali ke semua fasilitas)"
        >
          <CloseIcon size={11} />
        </button>
      </div>

      {/* 2. Sub-filter Controls Berdasarkan Kategori Aktif */}
      <div className="flex flex-col gap-1.5 text-xs">
        {/* KATEGORI: KESEHATAN */}
        {category === 'kesehatan' && (
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => onFaskesFilterChange?.('all')}
              className={`flex items-center justify-center rounded-lg px-1.5 py-1 text-[10px] transition-all cursor-pointer ${
                faskesFilter === 'all'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
            >
              Semua ({faskesCounts.total})
            </button>
            <button
              type="button"
              onClick={() => onFaskesFilterChange?.('rsud')}
              className={`flex items-center justify-center rounded-lg px-1.5 py-1 text-[10px] transition-all cursor-pointer ${
                faskesFilter === 'rsud'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
            >
              RSUD ({faskesCounts.rsud})
            </button>
            <button
              type="button"
              onClick={() => onFaskesFilterChange?.('puskesmas')}
              className={`flex items-center justify-center rounded-lg px-1.5 py-1 text-[10px] transition-all cursor-pointer ${
                faskesFilter === 'puskesmas'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
            >
              Pusk. ({faskesCounts.puskesmas})
            </button>
          </div>
        )}

        {/* KATEGORI: RTH */}
        {category === 'rth' && (
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => onRthFilterChange?.('all')}
              className={`flex items-center justify-center rounded-lg px-1.5 py-1 text-[10px] transition-all cursor-pointer ${
                rthFilter === 'all'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
            >
              Semua ({rthCounts.total})
            </button>
            <button
              type="button"
              onClick={() => onRthFilterChange?.('taman')}
              className={`flex items-center justify-center rounded-lg px-1.5 py-1 text-[10px] transition-all cursor-pointer ${
                rthFilter === 'taman'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
            >
              Taman ({rthCounts.taman})
            </button>
            <button
              type="button"
              onClick={() => onRthFilterChange?.('hutan')}
              className={`flex items-center justify-center rounded-lg px-1.5 py-1 text-[10px] transition-all cursor-pointer ${
                rthFilter === 'hutan'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
            >
              Hutan ({rthCounts.hutan})
            </button>
          </div>
        )}

        {/* KATEGORI: SEKOLAH */}
        {category === 'sekolah' && (
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => onSchoolFilterChange?.('all')}
              className={`flex items-center justify-center rounded-lg px-1 py-1 text-[9.5px] transition-all cursor-pointer ${
                schoolFilter === 'all'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => onSchoolFilterChange?.('sma')}
              className={`flex items-center justify-center rounded-lg px-1 py-1 text-[9.5px] transition-all cursor-pointer ${
                schoolFilter === 'sma'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
            >
              SMA ({schoolCounts.sma})
            </button>
            <button
              type="button"
              onClick={() => onSchoolFilterChange?.('smp')}
              className={`flex items-center justify-center rounded-lg px-1 py-1 text-[9.5px] transition-all cursor-pointer ${
                schoolFilter === 'smp'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
            >
              SMP ({schoolCounts.smp})
            </button>
            <button
              type="button"
              onClick={() => onSchoolFilterChange?.('sd')}
              className={`flex items-center justify-center rounded-lg px-1 py-1 text-[9.5px] transition-all cursor-pointer ${
                schoolFilter === 'sd'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
            >
              SD ({schoolCounts.sd})
            </button>
          </div>
        )}

        {/* KATEGORI: TRANSUM (PILIHAN KORIDOR) */}
        {category === 'transum' && (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onSelectCorridor?.(null)}
              className={`w-full flex items-center justify-between rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors cursor-pointer text-left ${
                !selectedCorridorId
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-surface-muted/70 text-foreground hover:bg-surface-muted'
              }`}
            >
              <span>
                {scopeLabel && scopeLabel !== 'DKI Jakarta'
                  ? `Semua ${corridors.length} Koridor ${scopeLabel}`
                  : `Semua ${corridors.length} Koridor BRT`}
              </span>
              {!selectedCorridorId && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </button>

            <div className="max-h-24 sm:max-h-28 overflow-y-auto scrollbar-thin flex flex-col gap-0.5 pr-0.5">
              {corridors.length === 0 ? (
                <div className="p-2 text-center text-[10px] text-muted">
                  Tidak ada rute BRT di wilayah ini
                </div>
              ) : (
                corridors.map((corridor) => {
                  const isSelected = selectedCorridorId === corridor.id
                  return (
                    <button
                      key={corridor.id}
                      type="button"
                      onClick={() => onSelectCorridor?.(corridor)}
                      className={`w-full flex items-center justify-between gap-1.5 rounded-md px-1.5 py-0.5 text-[9.5px] font-medium transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-purple-600 text-white font-bold'
                          : 'text-foreground hover:bg-surface-muted'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: corridor.color }}
                        />
                        <span className="truncate">{corridor.name}</span>
                      </div>
                      {isSelected && <span className="h-1 w-1 rounded-full bg-white shrink-0" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* KATEGORI: AIR BERSIH */}
        {category === 'air' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between rounded-xl bg-surface-muted/60 p-2 border border-border/60">
              <span className="text-[10px] text-foreground font-medium">Jalur Pipa PAM JAYA</span>
              <button
                type="button"
                onClick={onToggleWaterNetwork}
                className={`rounded-full px-2.5 py-0.5 text-[9.5px] font-bold transition-all cursor-pointer ${
                  isWaterNetworkVisible
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-surface-muted text-muted border border-border'
                }`}
              >
                {isWaterNetworkVisible ? 'Tampil' : 'Sembunyi'}
              </button>
            </div>
            <p className="text-[9.5px] text-muted leading-relaxed">
              Menampilkan jaringan pipa air bersih PAM JAYA yang melayani 68% populasi warga DKI
              Jakarta.
            </p>
          </div>
        )}
      </div>

      {/* 3. Footer Reset Cepat */}
      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[9.5px]">
        <span className="text-muted">Mode Solo Filter Aktif</span>
        <button
          type="button"
          onClick={() => {
            onSelectCorridor?.(null)
            onFaskesFilterChange?.('all')
            onRthFilterChange?.('all')
            onSchoolFilterChange?.('all')
            onClose()
          }}
          className="text-primary font-bold hover:underline cursor-pointer"
        >
          Reset Filter &times;
        </button>
      </div>
    </div>
  )
}

