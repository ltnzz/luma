import { BarChartIcon, MapIcon } from '../../../components/ui/Icons'

interface ComingSoonViewProps {
  onBackToMap?: () => void
}

export function ComingSoonView({ onBackToMap }: ComingSoonViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6 text-center select-none">
      <div className="max-w-md w-full rounded-3xl border border-border bg-surface p-8 shadow-xl backdrop-blur-md">
        {/* Icon & Badge */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
          <BarChartIcon size={32} />
        </div>

        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Fase Pengembangan • Segera Hadir
        </div>

        {/* Title & Description */}
        <h2 className="mt-4 text-xl sm:text-2xl font-black tracking-tight text-foreground">
          Ringkasan Sektoral
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
          Modul dashboard analitik makro, grafik perbandingan 6 sektor kota, dan visualisasi agregat sedang disiapkan untuk rilis berikutnya.
        </p>

        {/* Feature Teasers */}
        <div className="mt-6 flex flex-col gap-2.5 text-left text-xs text-muted border-t border-border pt-5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[10px] font-bold text-foreground">
              ✓
            </span>
            <span>Grafik tren indikator pendidikan, kesehatan, & lingkungan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[10px] font-bold text-foreground">
              ✓
            </span>
            <span>Komparasi performa fasilitas antar 5 wilayah kota administrasi</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[10px] font-bold text-foreground">
              ✓
            </span>
            <span>Rekapitulasi keterbukaan data dan pelaporan publik</span>
          </div>
        </div>

        {/* Action Button */}
        {onBackToMap && (
          <button
            type="button"
            onClick={onBackToMap}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-on-primary shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            <MapIcon size={14} />
            <span>Kembali ke Peta Spasial</span>
          </button>
        )}
      </div>
    </div>
  )
}
