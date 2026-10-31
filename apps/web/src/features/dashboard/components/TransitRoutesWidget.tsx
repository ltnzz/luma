import { useState, useMemo } from 'react'
import { BusIcon, ChevronUpIcon, ChevronDownIcon, TargetIcon, SearchIcon } from '../../../components/ui/Icons'
import { TRANSJAKARTA_CORRIDORS, type CorridorInfo } from '../../../data/transit-corridors'

export type { CorridorInfo }

export interface TransitRoutesWidgetProps {
  showTransit: boolean
  onToggleShowTransit: () => void
  activeCorridors?: string[]
  onToggleCorridor?: (id: string) => void
  onFocusRoute: (center: [number, number], zoom: number, corridorId?: string) => void
  focusedCorridorId?: string | null
  onResetFocus?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: (collapsed: boolean) => void
}

export function TransitRoutesWidget({
  showTransit,
  onToggleShowTransit,
  onFocusRoute,
  focusedCorridorId,
  onResetFocus,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}: TransitRoutesWidgetProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(true)
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed
  const setCollapsed = (val: boolean) => {
    if (onToggleCollapse) {
      onToggleCollapse(val)
    } else {
      setInternalCollapsed(val)
    }
  }

  const [searchQuery, setSearchQuery] = useState('')

  const focusedCorridor = useMemo(() => {
    if (!focusedCorridorId) return null
    return (
      TRANSJAKARTA_CORRIDORS.find(
        (c) => c.id === focusedCorridorId || c.koridorCode === focusedCorridorId
      ) ?? null
    )
  }, [focusedCorridorId])

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

  // Status collapsed: Pill ramping tanpa sub-button terpisah
  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-border/80 bg-surface/90 px-3 py-1.5 shadow-md backdrop-blur-md hover:border-primary/40 text-foreground transition-all cursor-pointer select-none"
        title="Buka panel rute & halte Transjakarta"
        aria-label="Buka panel rute & halte Transjakarta"
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-soft text-primary-soft-text">
          <BusIcon size={10} />
        </span>
        <span className="text-xs font-semibold">
          {focusedCorridor
            ? `Trayek • ${focusedCorridor.shortCode} Fokus`
            : '13 Koridor Transjakarta'}
        </span>
        <ChevronDownIcon size={12} className="text-muted ml-0.5" />
      </button>
    )
  }

  return (
    <div className="pointer-events-auto w-[295px] sm:w-[340px] rounded-xl border border-border/80 bg-surface/90 p-2 sm:p-2.5 shadow-xl backdrop-blur-md transition-all duration-200 select-none">
      {/* Header: Judul + Toggle Ringkas + Tombol Tutup Icon-Only */}
      <div className="flex items-center justify-between gap-2 border-b border-border/80 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-text shrink-0">
            <BusIcon size={12} />
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">Rute Transjakarta</h3>
            <p className="text-[10px] text-muted">13 Koridor BRT • 234 Halte</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleShowTransit}
            className="text-[10px] font-semibold text-muted hover:text-primary transition-colors cursor-pointer"
            title={showTransit ? 'Sembunyikan semua rute' : 'Tampilkan rute'}
          >
            {showTransit ? 'Sembunyikan' : 'Tampilkan'}
          </button>

          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-muted/60 transition-colors cursor-pointer"
            title="Tutup panel trayek"
            aria-label="Tutup panel trayek"
          >
            <ChevronUpIcon size={13} />
          </button>
        </div>
      </div>

      {/* Banner Notifikasi Fokus Rute Aktif dengan Link Reset Minimalist */}
      {focusedCorridor && (
        <div className="mt-2 flex items-center justify-between rounded-xl bg-primary/10 px-2.5 py-1.5 text-xs text-primary animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="h-2 w-2 rounded-full shrink-0 animate-ping"
              style={{ backgroundColor: focusedCorridor.color }}
            />
            <span className="truncate font-semibold text-[11px]">
              Fokus: {focusedCorridor.shortCode} (Rute lain abu-abu)
            </span>
          </div>
          {onResetFocus && (
            <button
              type="button"
              onClick={onResetFocus}
              className="ml-2 text-[10px] font-bold text-primary hover:underline cursor-pointer shrink-0"
              title="Kembalikan semua warna rute"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Input Pencarian Koridor */}
      <div className="mt-2 relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">
          <SearchIcon size={12} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari koridor (misal: Koridor 1, Blok M)..."
          className="w-full rounded-xl border border-border/80 bg-surface-muted/50 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Daftar Koridor: Seluruh baris adalah tombol interaktif (Tanpa tombol kotak terpisah) */}
      <div className="mt-2 max-h-[min(240px,32vh)] overflow-y-auto flex flex-col gap-1 pr-1">
        {filteredCorridors.map((corridor) => {
          const isFocused =
            focusedCorridorId === corridor.id || focusedCorridorId === corridor.koridorCode

          return (
            <div
              key={corridor.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (isFocused && onResetFocus) {
                  onResetFocus()
                } else {
                  onFocusRoute(corridor.center, corridor.zoom, corridor.id)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (isFocused && onResetFocus) {
                    onResetFocus()
                  } else {
                    onFocusRoute(corridor.center, corridor.zoom, corridor.id)
                  }
                }
              }}
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all cursor-pointer ${
                isFocused
                  ? 'border border-primary/60 bg-primary/10 shadow-xs'
                  : 'border border-border/50 bg-surface-muted/40 hover:border-border hover:bg-surface-muted/80'
              }`}
              title={
                isFocused
                  ? `Klik untuk membatalkan fokus ${corridor.name}`
                  : `Klik untuk fokus ke ${corridor.name} (rute lain abu-abu)`
              }
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Garis Warna Koridor */}
                <div
                  className="h-6 w-1 rounded-full shrink-0"
                  style={{ backgroundColor: corridor.color }}
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="rounded px-1 text-[8.5px] font-bold text-white uppercase shrink-0"
                      style={{ backgroundColor: corridor.color }}
                    >
                      {corridor.shortCode}
                    </span>
                    <h4 className="text-xs font-semibold text-foreground truncate">
                      {corridor.name}
                    </h4>
                  </div>
                  <p className="text-[9.5px] text-muted truncate">
                    {corridor.route} • {corridor.stopsCount} Halte
                  </p>
                </div>
              </div>

              {/* Status Fokus (Subtle Indicator, bukan tombol kotak) */}
              <div className="shrink-0 pl-1.5 flex items-center">
                {isFocused ? (
                  <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                    <TargetIcon size={11} />
                    <span>Aktif</span>
                  </span>
                ) : (
                  <TargetIcon size={12} className="text-muted/40 hover:text-muted transition-colors" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Panduan Ramping */}
      <div className="mt-2 border-t border-border/60 pt-1.5 text-[9.5px] text-muted text-center">
        Klik baris koridor untuk menonjolkan rute di peta.
      </div>
    </div>
  )
}
