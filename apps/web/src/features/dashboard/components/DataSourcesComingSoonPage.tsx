interface DataSourcesComingSoonPageProps {
  onBack: () => void
}

const UPCOMING_FEATURES = [
  {
    title: 'Portal Satu Data DKI',
    authority: 'Diskominfotik DKI Jakarta',
    status: 'Sinkronisasi API',
    description:
      'Integrasi langsung API data terbuka fasilitas publik, demografi kependudukan, dan anggaran APBD.',
    tag: 'REST API',
  },
  {
    title: 'Dapodik Kemendikbudristek',
    authority: 'Kemendikbud & Disdik DKI',
    status: 'Validasi Skema',
    description:
      'Katalog lengkap 1.503 satuan pendidikan negeri (SD, SMP, SMA, SMK, SLB) terakreditasi.',
    tag: 'Open Data',
  },
  {
    title: 'Sensor SPKU Kualitas Udara',
    authority: 'Dinas Lingkungan Hidup DKI',
    status: 'Telemetry Live',
    description:
      'Data deret waktu ISPU & PM2.5 real-time dari 6 stasiun pemantau otomatis kualitas udara.',
    tag: 'IoT Telemetry',
  },
  {
    title: 'Jaringan Pipa & Distribusi PAM JAYA',
    authority: 'Perumda PAM JAYA',
    status: 'GIS Layer V2',
    description:
      'Peta geospasial jaringan pipa transmisi dan tingkat cakupan akses air minum perpipaan.',
    tag: 'GIS Vector',
  },
  {
    title: 'Faskes Primer & Rujukan',
    authority: 'Dinas Kesehatan DKI Jakarta',
    status: 'Data Sanitasi',
    description:
      'Database 51 RSUD dan Puskesmas Kecamatan beserta indikator ketersediaan tempat tidur.',
    tag: 'Healthcare',
  },
  {
    title: 'Ruang Terbuka Hijau & Taman',
    authority: 'Distamhut DKI Jakarta',
    status: 'Pemetaan Poligon',
    description:
      'Inventarisasi 418 taman kota dan hutan kota beserta luas tutupan vegetasi hijau.',
    tag: 'Urban Green',
  },
]

/**
 * DataSourcesComingSoonPage — Halaman Eksplorasi Sumber Data Resmi (Coming Soon)
 * Dibuka saat pengguna menekan tombol direct pada komponen Sumber Data Resmi di dashboard.
 */
export function DataSourcesComingSoonPage({ onBack }: DataSourcesComingSoonPageProps) {
  return (
    <div className="relative h-full w-full overflow-y-auto bg-surface-muted/40 p-4 sm:p-8 select-none">
      <div className="mx-auto max-w-4xl flex flex-col gap-6 sm:gap-8 pb-12">
        {/* Top Navigation Bar: Back to Map */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-bold text-foreground shadow-xs hover:border-primary/50 hover:bg-surface-muted transition-all cursor-pointer"
          >
            <span
              className="transition-transform duration-150 group-hover:-translate-x-1 font-bold"
              aria-hidden="true"
            >
              &larr;
            </span>
            <span>Kembali ke Peta Dashboard</span>
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Integrasi Data Pipeline
          </span>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col gap-3 rounded-3xl border border-border/80 bg-surface/95 p-6 sm:p-8 shadow-xl backdrop-blur-md">
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
            <span>🚀 Fitur Dalam Pengembangan</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
            Katalog & Provenansi Sumber Data Resmi
          </h1>

          <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-2xl">
            Halaman ini sedang dipersiapkan untuk menyediakan transparansi penuh terhadap sumber data
            pemerintah, kamus data (*data dictionary*), dokumentasi API terbuka, serta log
            pembaruan otomatis pipeline ETL dari seluruh dinas terkait di lingkungan Pemerintah Provinsi
            DKI Jakarta.
          </p>

          <div className="mt-2 flex items-center gap-3 pt-4 border-t border-border/60 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              6 Lembaga Resmi Terkoneksi
            </span>
            <span>&bull;</span>
            <span>Status: Staging Pipeline</span>
          </div>
        </div>

        {/* Feature Preview Grid */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted">
              Daftar Dataset Yang Sedang Diintegrasikan
            </h2>
            <span className="text-[11px] text-muted">6 Dataset Utama</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {UPCOMING_FEATURES.map((item) => (
              <div
                key={item.title}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-border/70 bg-surface/90 p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-primary border border-border/60">
                      {item.tag}
                    </span>
                    <span className="text-[10px] font-semibold text-muted bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-[11px] text-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 text-[10px] font-medium text-muted flex items-center justify-between">
                  <span>{item.authority}</span>
                  <span className="font-bold text-primary">Segera Hadir</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Callout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold text-foreground">
              Ingin mengeksplorasi peta interaktif terlebih dahulu?
            </span>
            <span className="text-xs text-muted">
              Seluruh data fasilitas, transportasi BRT, pipa air, dan indeks kualitas udara telah aktif di peta utama.
            </span>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl bg-primary hover:bg-primary-hover text-on-primary px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-md shrink-0 active:scale-95"
          >
            Buka Peta Interaktif &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}

