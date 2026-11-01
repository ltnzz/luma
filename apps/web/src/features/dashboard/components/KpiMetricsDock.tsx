import { DropletIcon, HospitalIcon, TreeIcon, SchoolIcon, BusIcon } from '../../../components/ui/Icons'

export type KpiCategory = 'air' | 'kesehatan' | 'rth' | 'sekolah' | 'transum'

interface KpiMetricsDockProps {
  waterCoverage?: number
  waterCoverageLabel?: string
  isWaterActive?: boolean
  faskesCount: number
  rthCount: number
  schoolCount: number
  transitCorridorCount?: number
  activeCategory?: KpiCategory | null
  onFilterCategory?: (category: KpiCategory) => void
}

/**
 * KpiMetricsDock — Dock Ringkasan Metrik Makro Utama & Kontroler Filter Kategori
 * Didesain proporsional, ringkas, dan responsif:
 * - 5 kategori lengkap (Air Bersih, Faskes, Ruang Hijau, Sekolah, Transum) selalu terlihat utuh
 * - Status aktif jelas dengan highlight tema warna dan titik indikator
 * - Dimensi seimbang dan tidak bertabrakan dengan legenda di kolom kiri
 */
export function KpiMetricsDock({
  waterCoverage = 68,
  waterCoverageLabel = 'Akses',
  isWaterActive = true,
  faskesCount,
  rthCount,
  schoolCount,
  transitCorridorCount = 13,
  activeCategory = null,
  onFilterCategory,
}: KpiMetricsDockProps) {
  return (
    <div className="pointer-events-auto flex items-center justify-between gap-1 sm:gap-1.5 rounded-2xl luma-glass pl-1.5 pr-2.5 sm:pl-2 sm:pr-3.5 py-1 sm:py-1.5 transition-all select-none w-max max-w-[96vw] overflow-x-auto scrollbar-none animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* 1. Air Bersih */}
      <button
        type="button"
        onClick={() => onFilterCategory?.('air')}
        className={`flex items-center gap-1.5 sm:gap-2 shrink-0 text-left rounded-xl px-2 py-1 transition-all cursor-pointer border whitespace-nowrap ${
          activeCategory === 'air'
            ? 'bg-sky-500/15 border-sky-500/50 ring-1 ring-sky-500/30 shadow-xs -translate-y-0.5'
            : 'border-transparent hover:bg-surface-muted/60'
        } ${isWaterActive ? 'opacity-100' : 'opacity-60'}`}
        title="Klik untuk filter & fokus jaringan pipa PAM JAYA"
      >
        <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 shadow-2xs shrink-0">
          <DropletIcon size={13} />
        </span>
        <div className="flex flex-col whitespace-nowrap">
          <div className="flex items-center gap-1">
            <span className="text-[9.5px] font-semibold text-muted leading-tight">Air Bersih</span>
            {activeCategory === 'air' ? (
              <span className="flex items-center gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                <span className="text-[8px] font-bold text-sky-600">Aktif</span>
              </span>
            ) : (
              <span
                className={`flex h-1.5 w-1.5 rounded-full ${
                  isWaterActive ? 'bg-sky-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
          <span className="text-xs sm:text-[13px] font-bold text-foreground leading-tight">
            {waterCoverage}%{' '}
            <span className="text-[8.5px] font-medium text-muted">({waterCoverageLabel})</span>
          </span>
        </div>
      </button>

      <span className="h-5 w-px bg-border/60 shrink-0" />

      {/* 2. Faskes */}
      <button
        type="button"
        onClick={() => onFilterCategory?.('kesehatan')}
        className={`flex items-center gap-1.5 sm:gap-2 shrink-0 text-left rounded-xl px-2 py-1 transition-all cursor-pointer border whitespace-nowrap ${
          activeCategory === 'kesehatan'
            ? 'bg-rose-500/15 border-rose-500/50 ring-1 ring-rose-500/30 shadow-xs -translate-y-0.5'
            : 'border-transparent hover:bg-surface-muted/60'
        }`}
        title="Klik untuk filter & fokus Fasilitas Kesehatan"
      >
        <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 shadow-2xs shrink-0">
          <HospitalIcon size={13} />
        </span>
        <div className="flex flex-col whitespace-nowrap">
          <div className="flex items-center gap-1">
            <span className="text-[9.5px] font-semibold text-muted leading-tight">Faskes</span>
            {activeCategory === 'kesehatan' && (
              <span className="flex items-center gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[8px] font-bold text-rose-600">Aktif</span>
              </span>
            )}
          </div>
          <span className="text-xs sm:text-[13px] font-bold text-foreground leading-tight">
            {faskesCount} <span className="text-[8.5px] font-medium text-muted">RS/Pusk</span>
          </span>
        </div>
      </button>

      <span className="h-5 w-px bg-border/60 shrink-0" />

      {/* 3. Ruang Hijau */}
      <button
        type="button"
        onClick={() => onFilterCategory?.('rth')}
        className={`flex items-center gap-1.5 sm:gap-2 shrink-0 text-left rounded-xl px-2 py-1 transition-all cursor-pointer border whitespace-nowrap ${
          activeCategory === 'rth'
            ? 'bg-emerald-500/15 border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-xs -translate-y-0.5'
            : 'border-transparent hover:bg-surface-muted/60'
        }`}
        title="Klik untuk filter & fokus Ruang Terbuka Hijau"
      >
        <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 shadow-2xs shrink-0">
          <TreeIcon size={13} />
        </span>
        <div className="flex flex-col whitespace-nowrap">
          <div className="flex items-center gap-1">
            <span className="text-[9.5px] font-semibold text-muted leading-tight">Ruang Hijau</span>
            {activeCategory === 'rth' && (
              <span className="flex items-center gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-600">Aktif</span>
              </span>
            )}
          </div>
          <span className="text-xs sm:text-[13px] font-bold text-foreground leading-tight">
            {rthCount} <span className="text-[8.5px] font-medium text-muted">Taman</span>
          </span>
        </div>
      </button>

      <span className="h-5 w-px bg-border/60 shrink-0" />

      {/* 4. Sekolah */}
      <button
        type="button"
        onClick={() => onFilterCategory?.('sekolah')}
        className={`flex items-center gap-1.5 sm:gap-2 shrink-0 text-left rounded-xl px-2 py-1 transition-all cursor-pointer border whitespace-nowrap ${
          activeCategory === 'sekolah'
            ? 'bg-blue-500/15 border-blue-500/50 ring-1 ring-blue-500/30 shadow-xs -translate-y-0.5'
            : 'border-transparent hover:bg-surface-muted/60'
        }`}
        title="Klik untuk filter & fokus Sekolah Negeri"
      >
        <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 shadow-2xs shrink-0">
          <SchoolIcon size={13} />
        </span>
        <div className="flex flex-col whitespace-nowrap">
          <div className="flex items-center gap-1">
            <span className="text-[9.5px] font-semibold text-muted leading-tight">Sekolah</span>
            {activeCategory === 'sekolah' && (
              <span className="flex items-center gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[8px] font-bold text-blue-600">Aktif</span>
              </span>
            )}
          </div>
          <span className="text-xs sm:text-[13px] font-bold text-foreground leading-tight">
            {schoolCount.toLocaleString('id-ID')}{' '}
            <span className="text-[8.5px] font-medium text-muted">Unit</span>
          </span>
        </div>
      </button>

      <span className="h-5 w-px bg-border/60 shrink-0" />

      {/* 5. Transum (Diberikan Padding Kanan Ekstra agar Tidak Tertutup Lengkungan Sudut) */}
      <button
        type="button"
        onClick={() => onFilterCategory?.('transum')}
        className={`flex items-center gap-1.5 sm:gap-2 shrink-0 text-left rounded-xl pl-2 pr-3 sm:pr-4 py-1 transition-all cursor-pointer border whitespace-nowrap ${
          activeCategory === 'transum'
            ? 'bg-purple-500/15 border-purple-500/50 ring-1 ring-purple-500/30 shadow-xs -translate-y-0.5'
            : 'border-transparent hover:bg-surface-muted/60'
        }`}
        title="Klik untuk filter & fokus Jaringan Koridor Transjakarta"
      >
        <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 shadow-2xs shrink-0">
          <BusIcon size={13} />
        </span>
        <div className="flex flex-col whitespace-nowrap">
          <div className="flex items-center gap-1">
            <span className="text-[9.5px] font-semibold text-muted leading-tight">Transum</span>
            {activeCategory === 'transum' && (
              <span className="flex items-center gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[8px] font-bold text-purple-600">Aktif</span>
              </span>
            )}
          </div>
          <span className="text-xs sm:text-[13px] font-bold text-foreground leading-tight">
            {transitCorridorCount}{' '}
            <span className="text-[8.5px] font-medium text-muted">Koridor</span>
          </span>
        </div>
      </button>
    </div>
  )
}
