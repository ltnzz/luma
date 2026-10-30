import { useState, useMemo } from 'react'
import { BusIcon, ChevronUpIcon, ChevronDownIcon, TargetIcon, SearchIcon } from '../../../components/ui/Icons'

interface CorridorInfo {
  id: string
  name: string
  shortCode: string
  color: string
  stopsCount: number
  route: string
  center: [number, number]
  zoom: number
  description: string
}

const TRANSJAKARTA_CORRIDORS: CorridorInfo[] = [
  {
    id: 'route-tj-1',
    name: 'Koridor 1: Blok M – Kota',
    shortCode: 'Kor 1',
    color: '#2563eb',
    stopsCount: 19,
    route: 'Blok M ↔ Kali Besar / Kota',
    center: [106.818, -6.19],
    zoom: 12.3,
    description: 'Poros utama Sudirman – Thamrin – Gajah Mada',
  },
  {
    id: 'route-tj-2',
    name: 'Koridor 2: Pulo Gadung – Monas',
    shortCode: 'Kor 2',
    color: '#0284c7',
    stopsCount: 16,
    route: 'Pulo Gadung ↔ Senen ↔ Monas',
    center: [106.865, -6.175],
    zoom: 12.5,
    description: 'Menghubungkan Jakarta Timur dengan pusat pemerintahan',
  },
  {
    id: 'route-tj-3',
    name: 'Koridor 3: Kalideres – Monas',
    shortCode: 'Kor 3',
    color: '#ea580c',
    stopsCount: 13,
    route: 'Kalideres ↔ Grogol ↔ Monas',
    center: [106.76, -6.16],
    zoom: 12.2,
    description: 'Koridor arteri Jakarta Barat menyusuri Daan Mogot',
  },
  {
    id: 'route-tj-4',
    name: 'Koridor 4: Pulo Gadung – Galunggung',
    shortCode: 'Kor 4',
    color: '#9333ea',
    stopsCount: 17,
    route: 'Pulo Gadung ↔ Manggarai ↔ Galunggung',
    center: [106.865, -6.205],
    zoom: 12.5,
    description: 'Menghubungkan Pulo Gadung, Manggarai, dan Dukuh Atas',
  },
  {
    id: 'route-tj-5',
    name: 'Koridor 5: Kampung Melayu – Ancol',
    shortCode: 'Kor 5',
    color: '#ca8a04',
    stopsCount: 16,
    route: 'Kampung Melayu ↔ Senen ↔ Ancol',
    center: [106.845, -6.17],
    zoom: 12.2,
    description: 'Poros utara-selatan timur melalui Salemba & Senen',
  },
  {
    id: 'route-tj-6',
    name: 'Koridor 6: Ragunan – Galunggung',
    shortCode: 'Kor 6',
    color: '#16a34a',
    stopsCount: 19,
    route: 'Ragunan ↔ Mampang ↔ Galunggung',
    center: [106.828, -6.25],
    zoom: 12.2,
    description: 'Menyusuri koridor Mampang Prapatan dan HR Rasuna Said',
  },
  {
    id: 'route-tj-7',
    name: 'Koridor 7: Kampung Rambutan – Kampung Melayu',
    shortCode: 'Kor 7',
    color: '#db2777',
    stopsCount: 15,
    route: 'Kampung Rambutan ↔ BNN ↔ Kp. Melayu',
    center: [106.87, -6.265],
    zoom: 12.2,
    description: 'Arteri Jakarta Timur menyusuri Jalan Raya Bogor dan Otista',
  },
  {
    id: 'route-tj-8',
    name: 'Koridor 8: Lebak Bulus – Pasar Baru',
    shortCode: 'Kor 8',
    color: '#0d9488',
    stopsCount: 23,
    route: 'Lebak Bulus ↔ Kebayoran ↔ Pasar Baru',
    center: [106.78, -6.22],
    zoom: 12.0,
    description: 'Menyusuri Pondok Indah, Kebayoran Lama, dan Duri Kepa',
  },
  {
    id: 'route-tj-9',
    name: 'Koridor 9: Pinang Ranti – Pluit',
    shortCode: 'Kor 9',
    color: '#4f46e5',
    stopsCount: 23,
    route: 'Pinang Ranti ↔ Gatot Subroto ↔ Pluit',
    center: [106.825, -6.21],
    zoom: 11.8,
    description: 'Sabuk tol dalam kota dari timur ke barat laut',
  },
  {
    id: 'route-tj-10',
    name: 'Koridor 10: Tanjung Priok – PGC',
    shortCode: 'Kor 10',
    color: '#b45309',
    stopsCount: 22,
    route: 'Tanjung Priok ↔ Jatinegara ↔ PGC',
    center: [106.875, -6.19],
    zoom: 12.0,
    description: 'Poros By Pass Sutoyo – DI Panjaitan – Yos Sudarso',
  },
  {
    id: 'route-tj-11',
    name: 'Koridor 11: Pulo Gebang – Kampung Melayu',
    shortCode: 'Kor 11',
    color: '#059669',
    stopsCount: 15,
    route: 'Pulo Gebang ↔ Klender ↔ Kp. Melayu',
    center: [106.91, -6.215],
    zoom: 12.3,
    description: 'Jalur penghubung Klender dan Terminal Pulo Gebang',
  },
  {
    id: 'route-tj-12',
    name: 'Koridor 12: Tanjung Priok – Pluit',
    shortCode: 'Kor 12',
    color: '#0891b2',
    stopsCount: 22,
    route: 'Pluit ↔ Kota ↔ Sunter ↔ Tg. Priok',
    center: [106.84, -6.13],
    zoom: 12.2,
    description: 'Koridor pesisir Jakarta Utara melalui Mangga Dua dan Sunter',
  },
  {
    id: 'route-tj-13',
    name: 'Koridor 13: Ciledug – Tegal Mampang',
    shortCode: 'Kor 13',
    color: '#6366f1',
    stopsCount: 14,
    route: 'CBD Ciledug ↔ CSW ↔ Tegal Mampang',
    center: [106.785, -6.239],
    zoom: 12.8,
    description: 'Jalur busway layang bertingkat (elevated skyway)',
  },
]

interface TransitRoutesWidgetProps {
  showTransit: boolean
  onToggleShowTransit: () => void
  activeCorridors?: string[]
  onToggleCorridor?: (id: string) => void
  onFocusRoute: (center: [number, number], zoom: number) => void
}

export function TransitRoutesWidget({
  showTransit,
  onToggleShowTransit,
  onFocusRoute,
}: TransitRoutesWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCorridors = useMemo(() => {
    if (!searchQuery.trim()) return TRANSJAKARTA_CORRIDORS
    const q = searchQuery.toLowerCase()
    return TRANSJAKARTA_CORRIDORS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.shortCode.toLowerCase().includes(q) ||
        c.route.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    )
  }, [searchQuery])

  // Status collapsed: Tampilkan pill kecil
  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setIsCollapsed(false)}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-surface/95 px-3 py-1.5 shadow-lg backdrop-blur-md hover:border-primary/50 text-foreground transition-all cursor-pointer"
        title="Buka panel rute & halte Transjakarta"
        aria-label="Buka panel rute & halte Transjakarta"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-soft text-primary-soft-text">
          <BusIcon size={12} />
        </span>
        <span className="text-xs font-semibold">13 Koridor Transjakarta</span>
        <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
          234 Halte
        </span>
        <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary pl-1.5 border-l border-border">
          <span>Buka</span>
          <ChevronDownIcon size={12} />
        </span>
      </button>
    )
  }

  return (
    <div className="pointer-events-auto w-[295px] sm:w-[330px] rounded-2xl border border-border bg-surface/95 p-2.5 sm:p-3 shadow-xl backdrop-blur-md transition-all duration-200 select-none">
      {/* Header: Judul, Status Master Toggle, Tombol Tutup */}
      <div className="flex items-center justify-between gap-2 border-b border-border/80 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-text shrink-0">
            <BusIcon size={13} />
          </span>
          <div>
            <h3 className="text-xs font-bold text-foreground">Rute & Halte Transjakarta</h3>
            <p className="text-[10px] text-muted">13 Koridor BRT • 234 Halte Resmi</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Master Toggle On / Off */}
          <button
            type="button"
            onClick={onToggleShowTransit}
            className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer border ${
              showTransit
                ? 'bg-primary-soft text-primary-soft-text border-primary/40'
                : 'bg-surface-muted text-muted border-border'
            }`}
            title={showTransit ? 'Sembunyikan semua rute Transjakarta' : 'Tampilkan rute Transjakarta'}
          >
            {showTransit ? 'Aktif' : 'Nonaktif'}
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-semibold text-muted hover:bg-surface-muted hover:text-foreground transition-colors cursor-pointer"
            title="Tutup panel trayek"
            aria-label="Tutup panel trayek"
          >
            <span>Tutup</span>
            <ChevronUpIcon size={12} />
          </button>
        </div>
      </div>

      {/* Input Pencarian Koridor */}
      <div className="mt-2 relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">
          <SearchIcon size={12} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari koridor (misal: Koridor 1, Blok M, Pluit)..."
          className="w-full rounded-xl border border-border bg-surface-muted/60 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      {/* Daftar Koridor Transjakarta BRT (Scrollable & Responsive Height) */}
      <div className="mt-2 max-h-[min(240px,32vh)] overflow-y-auto flex flex-col gap-1.5 pr-1">
        {filteredCorridors.map((corridor) => (
          <div
            key={corridor.id}
            className="flex items-center justify-between rounded-xl border border-border/80 bg-surface-muted/50 p-2 hover:bg-surface-muted/80 transition-all"
          >
            <div className="flex items-center gap-2 min-w-0">
              {/* Garis Warna Koridor */}
              <div
                className="h-8 w-1 rounded-full shrink-0"
                style={{ backgroundColor: corridor.color }}
              />

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="rounded-md px-1.5 py-0.2 text-[9px] font-bold text-white uppercase shrink-0"
                    style={{ backgroundColor: corridor.color }}
                  >
                    {corridor.shortCode}
                  </span>
                  <h4 className="text-xs font-bold text-foreground truncate">
                    {corridor.name}
                  </h4>
                </div>
                <p className="text-[10px] text-muted truncate">
                  {corridor.route} • {corridor.stopsCount} Halte
                </p>
              </div>
            </div>

            {/* Aksi: Tombol Fokus ke Koridor */}
            <div className="flex items-center gap-1 shrink-0 pl-1">
              <button
                type="button"
                onClick={() => onFocusRoute(corridor.center, corridor.zoom)}
                className="flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-[10px] font-semibold text-muted hover:bg-surface hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
                title={`Fokus ke rute ${corridor.name}`}
              >
                <TargetIcon size={11} />
                <span>Fokus</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Panduan Interaksi */}
      <div className="mt-2.5 flex items-center gap-1.5 border-t border-border/80 pt-2 text-[10px] text-muted">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border bg-white text-[8px] font-bold text-slate-700">
          ○
        </span>
        <span className="line-clamp-1">
          Arahkan kursor ke halte untuk melihat info akses (Pelican, JPO Ramp, JPO Tangga).
        </span>
      </div>
    </div>
  )
}
