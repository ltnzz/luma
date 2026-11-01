import {
  HospitalIcon,
  TreeIcon,
  SchoolIcon,
  BusIcon,
  DropletIcon,
} from '../../../components/ui/Icons'

/**
 * StaticMapLegend — Legenda Simbol Peta Ringkas & Statis
 * Memberikan informasi murni makna simbol/layer tanpa data angka,
 * didesain sangat ramping agar pas di layar tanpa memicu scrollbar.
 */
export function StaticMapLegend() {
  return (
    <div className="pointer-events-auto flex flex-col gap-1.5 rounded-2xl luma-glass p-2.5 sm:p-3 select-none w-60 sm:w-64 animate-in fade-in slide-in-from-left-2 duration-300">
      {/* Header Legenda */}
      <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <h4 className="text-[10.5px] font-bold text-foreground uppercase tracking-wider">
            Legenda Peta
          </h4>
        </div>
        <span className="text-[9.5px] text-muted">Simbol Fasilitas</span>
      </div>

      {/* Daftar Simbol Murni (Tanpa Data Angka) */}
      <div className="flex flex-col gap-1 text-[11px]">
        {/* 1. Fasilitas Kesehatan */}
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-rose-500/15 text-rose-600">
            <HospitalIcon size={11} />
          </span>
          <span className="font-medium text-foreground leading-none">
            Fasilitas Kesehatan
          </span>
          <span className="text-[9.5px] text-muted font-normal ml-auto">RS & Pusk.</span>
        </div>

        {/* 2. Ruang Terbuka Hijau */}
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600">
            <TreeIcon size={11} />
          </span>
          <span className="font-medium text-foreground leading-none">
            Ruang Terbuka Hijau
          </span>
          <span className="text-[9.5px] text-muted font-normal ml-auto">Taman/Hutan</span>
        </div>

        {/* 3. Sekolah Negeri */}
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/15 text-blue-600">
            <SchoolIcon size={11} />
          </span>
          <span className="font-medium text-foreground leading-none">
            Sekolah Negeri
          </span>
          <span className="text-[9.5px] text-muted font-normal ml-auto">SMA/SMP/SD</span>
        </div>

        {/* 4. Rute Transum */}
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-purple-500/15 text-purple-600">
            <BusIcon size={11} />
          </span>
          <span className="font-medium text-foreground leading-none">
            Halte & Koridor BRT
          </span>
          <span className="text-[9.5px] text-muted font-normal ml-auto">Transjakarta</span>
        </div>

        {/* 5. Jaringan Pipa Air Bersih PAM JAYA */}
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sky-500/15 text-sky-600">
            <DropletIcon size={11} />
          </span>
          <span className="font-medium text-foreground leading-none">
            Jaringan Air Bersih
          </span>
          <span className="text-[9.5px] text-muted font-normal ml-auto">Pipa PAM</span>
        </div>

        {/* 6. Batas Wilayah */}
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-surface-muted border border-primary/50">
            <span className="h-0.5 w-2 rounded-full bg-primary" />
          </span>
          <span className="font-medium text-foreground leading-none">
            Batas Wilayah DKI
          </span>
          <span className="text-[9.5px] text-muted font-normal ml-auto">5 Kota + Kep.S</span>
        </div>
      </div>
    </div>
  )
}
