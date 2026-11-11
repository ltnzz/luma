import { useState, useRef, useEffect, useMemo } from 'react'
import { BusIcon, CloseIcon, ChevronRightIcon } from '../../../components/ui/Icons'
import { TRANSJAKARTA_CORRIDORS, type CorridorInfo } from '../../../data/transit-corridors'

interface TransitCardProps {
  transitCorridorCount?: number
  selectedCorridorId?: string | null
  onSelectCorridor?: (corridor: CorridorInfo | null) => void
  onExploreTransit?: () => void
}

/**
 * TransitCard — Card Mandiri Transportasi Publik (Transum)
 * Sesuai arahan: Tombol "Pilih Rute →" membuka pilihan koridor di samping kanan komponen ini
 * dengan batas tinggi presisi (max-h-52) sehingga berjarak aman dan tidak pernah overlap/override
 * dengan dock metrik di bawahnya.
 */
export function TransitCard({
  transitCorridorCount = 13,
  selectedCorridorId,
  onSelectCorridor,
  onExploreTransit,
}: TransitCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const activeCorridor = useMemo(() => {
    if (!selectedCorridorId) return null
    return (
      TRANSJAKARTA_CORRIDORS.find(
        (c) => c.id === selectedCorridorId || c.koridorCode === selectedCorridorId
      ) ?? null
    )
  }, [selectedCorridorId])

  const handleChooseCorridor = (corridor: CorridorInfo | null) => {
    onSelectCorridor?.(corridor)
    setIsOpen(false)
  }

  return (
    <div className="relative flex items-start">
      {/* 1. Komponen Utama: Card Transportasi Publik (Minimalis & Ramping Sebaris Menyesuaikan Format Dashboard) */}
      <div className="pointer-events-auto flex w-64 sm:w-72 items-center justify-between gap-2 rounded-2xl border border-border/80 bg-surface/95 px-3 py-1.5 sm:py-2 shadow-md backdrop-blur-md transition-all duration-200 select-none animate-in fade-in slide-in-from-left-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-purple-500/15 text-purple-600">
            <BusIcon size={12} />
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-foreground leading-tight truncate">
              Transportasi Publik
            </span>
            {activeCorridor ? (
              <div className="flex items-center gap-1 min-w-0">
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: activeCorridor.color }}
                />
                <span className="text-[9.5px] font-bold text-foreground truncate">
                  {activeCorridor.shortCode}
                </span>
                <span className="text-[9px] text-muted truncate">
                  ({activeCorridor.route})
                </span>
              </div>
            ) : (
              <span className="text-[9.5px] text-muted leading-tight truncate">
                {transitCorridorCount} Koridor BRT
              </span>
            )}
          </div>
        </div>

        {/* Tombol Mikro Sebaris: Pilih Rute / Ganti / Reset */}
        <div className="flex items-center gap-1 shrink-0">
          {activeCorridor ? (
            <>
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="group inline-flex items-center gap-0.5 rounded-full border border-purple-500/25 bg-purple-500/10 hover:bg-purple-600 text-purple-700 dark:text-purple-300 hover:text-white hover:border-purple-600 px-2.5 py-0.5 text-[10px] font-semibold transition-all duration-150 cursor-pointer shadow-2xs active:scale-95"
                title="Ganti koridor"
              >
                <span>Ganti</span>
                <ChevronRightIcon
                  size={11}
                  className={`stroke-[2.5] transition-transform duration-150 ${isOpen ? 'rotate-90' : 'group-hover:translate-x-0.5'}`}
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                onClick={() => onSelectCorridor?.(null)}
                className="flex h-5 w-5 items-center justify-center rounded-full text-muted hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer transition-colors text-[11px] font-bold"
                title="Reset pilihan koridor"
              >
                &times;
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="group inline-flex items-center gap-0.5 rounded-full border border-purple-500/25 bg-purple-500/10 hover:bg-purple-600 text-purple-700 dark:text-purple-300 hover:text-white hover:border-purple-600 px-2.5 py-0.5 text-[10px] font-semibold transition-all duration-150 cursor-pointer shadow-2xs active:scale-95"
              title="Pilih rute dan koridor Transjakarta"
            >
              <span>Pilih Rute</span>
              <ChevronRightIcon
                size={11}
                className={`stroke-[2.5] transition-transform duration-150 ${isOpen ? 'rotate-90' : 'group-hover:translate-x-0.5'}`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </div>

      {/* 2. Menu Pilihan Rute Koridor Tepat di Samping Kanan (Ukuran ringkas & teks mikro agar berjarak aman dari dock bawah) */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="pointer-events-auto absolute left-[calc(100%+8px)] top-0 z-50 w-52 sm:w-56 max-h-36 overflow-y-auto rounded-xl border border-border bg-surface/98 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 scrollbar-none select-none"
        >
          <div className="flex items-center justify-between px-1.5 py-0.5 border-b border-border/50 mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              <span className="text-[7.5px] font-bold text-foreground uppercase tracking-wider">
                Pilih Koridor BRT
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded p-0.5 text-muted hover:text-foreground hover:bg-surface-muted cursor-pointer transition-colors"
              title="Tutup"
            >
              <CloseIcon size={10} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleChooseCorridor(null)}
            className={`w-full flex items-center justify-between rounded-md px-1.5 py-0.5 text-[7.5px] leading-tight font-medium transition-colors cursor-pointer text-left ${
              !activeCorridor
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-foreground hover:bg-surface-muted'
            }`}
          >
            <span className="truncate text-[7.5px] leading-tight">Semua 13 Koridor (Default)</span>
            {!activeCorridor && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
          </button>

          <div className="my-0.5 h-px bg-border/40" />

          {TRANSJAKARTA_CORRIDORS.map((corridor) => {
            const isSelected = activeCorridor?.id === corridor.id
            return (
              <button
                key={corridor.id}
                type="button"
                onClick={() => handleChooseCorridor(corridor)}
                className={`w-full flex items-center justify-between gap-1.5 rounded-md px-1.5 py-0.5 text-[7.5px] leading-tight font-medium transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-foreground hover:bg-surface-muted'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: corridor.color }}
                  />
                  <span className="truncate text-[7.5px] leading-tight">{corridor.name}</span>
                </div>
                {isSelected && (
                  <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                )}
              </button>
            )
          })}

          {onExploreTransit && (
            <div className="mt-1 pt-0.5 border-t border-border/50">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onExploreTransit()
                }}
                className="w-full flex items-center justify-center gap-1 rounded-lg bg-surface-muted hover:bg-surface-muted/80 text-foreground px-1.5 py-0.5 text-[7px] font-bold transition-all cursor-pointer border border-border hover:border-primary/40"
              >
                <span className="text-[7px]">Buka Panel Lengkap Rute & Halte</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
