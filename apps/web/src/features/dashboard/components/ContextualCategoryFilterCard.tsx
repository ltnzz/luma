import { CloseIcon } from '../../../components/ui/Icons'
import { CategoryIconBadge, type CategoryIconKind } from '../../../components/ui/CategoryIconBadge'
import { TRANSJAKARTA_CORRIDORS, type CorridorInfo } from '../../../data/transit-corridors'
import { getDataCatalogEntry } from '../../../data/data-catalog'
import type { KpiCategory } from './KpiMetricsDock'
import { useTranslation } from '../../../i18n/useTranslation'
import { HistoricalTrendMini } from './HistoricalTrendMini'

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
  hasDataError?: boolean
  onRetry?: () => void
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
  faskesCounts = { total: 0, rsud: 0, puskesmas: 0, other: 0 },
  rthCounts = { total: 0, taman: 0, hutan: 0, jalur: 0 },
  schoolCounts = { total: 0, sma: 0, smp: 0, sd: 0 },
  hasDataError = false,
  onRetry,
  onClose,
}: ContextualCategoryFilterCardProps) {
  const { language } = useTranslation()
  const copy = language === 'id'
    ? {
        healthTitle: 'Filter Faskes', healthSubtitle: 'Fasilitas Kesehatan',
        greenTitle: 'Filter Ruang Hijau', greenSubtitle: 'Area Terbuka Hijau',
        schoolTitle: 'Filter Sekolah Negeri', schoolSubtitle: 'Satuan Pendidikan',
        transitTitle: 'Filter Rute BRT', transitSubtitle: 'Koridor Transjakarta',
        waterTitle: 'Filter Jaringan Air', waterSubtitle: 'Pipa Akses PAM JAYA',
        close: 'Tutup filter kategori', all: 'Semua', corridor: 'Koridor',
        noRoutes: 'Tidak ada rute BRT di wilayah ini', pipeline: 'Jalur Pipa PAM JAYA',
        show: 'Tampil', hide: 'Sembunyi',
        waterDescription: 'Menampilkan jaringan pipa air bersih PAM JAYA yang melayani 68% populasi warga DKI Jakarta.',
        soloMode: 'Mode Solo Filter Aktif', reset: 'Reset Filter',
        source: 'Sumber', coverage: 'Cakupan', unit: 'Satuan', method: 'Metode', period: 'Periode', updated: 'Diperbarui',
        transparency: 'Transparansi data', openSource: 'Buka sumber resmi', unavailable: 'Belum tersedia',
        loadError: 'Data kategori belum dapat dimuat.', retry: 'Coba lagi',
      }
    : {
        healthTitle: 'Healthcare Filter', healthSubtitle: 'Healthcare Facilities',
        greenTitle: 'Green Space Filter', greenSubtitle: 'Green Open Spaces',
        schoolTitle: 'Public School Filter', schoolSubtitle: 'Education Units',
        transitTitle: 'BRT Route Filter', transitSubtitle: 'Transjakarta Corridors',
        waterTitle: 'Water Network Filter', waterSubtitle: 'PAM JAYA Access Pipes',
        close: 'Close category filter', all: 'All', corridor: 'Corridors',
        noRoutes: 'No BRT routes in this region', pipeline: 'PAM JAYA Pipeline',
        show: 'Visible', hide: 'Hidden',
        waterDescription: 'Shows the PAM JAYA clean-water network serving 68% of DKI Jakarta residents.',
        soloMode: 'Solo Filter Active', reset: 'Reset Filter',
        source: 'Source', coverage: 'Coverage', unit: 'Unit', method: 'Method', period: 'Period', updated: 'Updated',
        transparency: 'Data transparency', openSource: 'Open official source', unavailable: 'Not available',
        loadError: 'Category data could not be loaded.', retry: 'Retry',
      }

  const activeMetadata = getDataCatalogEntry(category, language)

  // Category config (title, color, icon)
  const config = {
    kesehatan: {
      title: copy.healthTitle,
      subtitle: `${faskesCounts.total} ${copy.healthSubtitle}`,
      iconCategory: 'health' as CategoryIconKind,
      borderColor: 'border-rose-500/30',
      chipActive: 'bg-rose-500 text-white font-bold',
    },
    rth: {
      title: copy.greenTitle,
      subtitle: `${rthCounts.total} ${copy.greenSubtitle}`,
      iconCategory: 'green' as CategoryIconKind,
      borderColor: 'border-emerald-500/30',
      chipActive: 'bg-emerald-600 text-white font-bold',
    },
    sekolah: {
      title: copy.schoolTitle,
      subtitle: `${schoolCounts.total.toLocaleString(language === 'id' ? 'id-ID' : 'en-US')} ${copy.schoolSubtitle}`,
      iconCategory: 'school' as CategoryIconKind,
      borderColor: 'border-blue-500/30',
      chipActive: 'bg-blue-600 text-white font-bold',
    },
    transum: {
      title: copy.transitTitle,
      subtitle: `${corridors.length} ${copy.transitSubtitle}`,
      iconCategory: 'transit' as CategoryIconKind,
      borderColor: 'border-purple-500/30',
      chipActive: 'bg-purple-600 text-white font-bold',
    },
    air: {
      title: copy.waterTitle,
      subtitle: copy.waterSubtitle,
      iconCategory: 'water' as CategoryIconKind,
      borderColor: 'border-sky-500/30',
      chipActive: 'bg-sky-600 text-white font-bold',
    },
  }[category]

  return (
    <div
      className="pointer-events-auto flex w-full max-w-[360px] flex-col gap-2 rounded-xl luma-map-card luma-glass-hover p-2.5 select-none animate-in fade-in slide-in-from-left-2 duration-200 sm:w-[280px] sm:p-3"
    >
      {/* 1. Header: Ikon Kategori, Judul, Scope Badge, dan Tombol Close */}
      <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <CategoryIconBadge category={config.iconCategory} />
          <div className="flex flex-col min-w-0">
            <span className="truncate text-xs font-bold leading-tight text-foreground">
              {config.title}
            </span>
            <span className="truncate text-[10.5px] font-medium leading-tight text-muted">
              {scopeLabel} &bull; {config.subtitle}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
          title={copy.close}
          aria-label={copy.close}
          data-tooltip={copy.close}
          data-tooltip-align="end"
        >
          <CloseIcon size={11} />
        </button>
      </div>

      {hasDataError ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-lg border border-danger/25 bg-danger/8 px-2.5 py-2 text-[10.5px]"
        >
          <span className="font-medium leading-snug text-foreground">{copy.loadError}</span>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-md border border-danger/25 px-2 py-1 font-bold text-danger transition hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/35"
          >
            {copy.retry}
          </button>
        </div>
      ) : null}

      {/* 2. Sub-filter Controls Berdasarkan Kategori Aktif */}
      <div className="flex flex-col gap-1.5 text-xs">
        {/* KATEGORI: KESEHATAN */}
        {category === 'kesehatan' && (
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => onFaskesFilterChange?.('all')}
              className={`flex items-center justify-center rounded-lg px-1.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                faskesFilter === 'all'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
              aria-pressed={faskesFilter === 'all'}
            >
              {copy.all} ({faskesCounts.total})
            </button>
            <button
              type="button"
              onClick={() => onFaskesFilterChange?.('rsud')}
              className={`flex items-center justify-center rounded-lg px-1.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                faskesFilter === 'rsud'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
              aria-pressed={faskesFilter === 'rsud'}
            >
              RSUD ({faskesCounts.rsud})
            </button>
            <button
              type="button"
              onClick={() => onFaskesFilterChange?.('puskesmas')}
              className={`flex items-center justify-center rounded-lg px-1.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                faskesFilter === 'puskesmas'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
              aria-pressed={faskesFilter === 'puskesmas'}
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
              className={`flex items-center justify-center rounded-lg px-1.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                rthFilter === 'all'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
              aria-pressed={rthFilter === 'all'}
            >
              {copy.all} ({rthCounts.total})
            </button>
            <button
              type="button"
              onClick={() => onRthFilterChange?.('taman')}
              className={`flex items-center justify-center rounded-lg px-1.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                rthFilter === 'taman'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
              aria-pressed={rthFilter === 'taman'}
            >
              Taman ({rthCounts.taman})
            </button>
            <button
              type="button"
              onClick={() => onRthFilterChange?.('hutan')}
              className={`flex items-center justify-center rounded-lg px-1.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                rthFilter === 'hutan'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
              aria-pressed={rthFilter === 'hutan'}
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
              className={`flex items-center justify-center rounded-lg px-1 py-1.5 text-[10.5px] font-semibold transition-all cursor-pointer ${
                schoolFilter === 'all'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
              aria-pressed={schoolFilter === 'all'}
            >
              {copy.all}
            </button>
            <button
              type="button"
              onClick={() => onSchoolFilterChange?.('sma')}
              className={`flex items-center justify-center rounded-lg px-1 py-1.5 text-[10.5px] font-semibold transition-all cursor-pointer ${
                schoolFilter === 'sma'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
              aria-pressed={schoolFilter === 'sma'}
            >
              SMA ({schoolCounts.sma})
            </button>
            <button
              type="button"
              onClick={() => onSchoolFilterChange?.('smp')}
              className={`flex items-center justify-center rounded-lg px-1 py-1.5 text-[10.5px] font-semibold transition-all cursor-pointer ${
                schoolFilter === 'smp'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
              aria-pressed={schoolFilter === 'smp'}
            >
              SMP ({schoolCounts.smp})
            </button>
            <button
              type="button"
              onClick={() => onSchoolFilterChange?.('sd')}
              className={`flex items-center justify-center rounded-lg px-1 py-1.5 text-[10.5px] font-semibold transition-all cursor-pointer ${
                schoolFilter === 'sd'
                  ? config.chipActive
                  : 'bg-surface-muted/80 text-foreground/80 hover:bg-surface-muted'
              }`}
              aria-pressed={schoolFilter === 'sd'}
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
              className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer text-left ${
                !selectedCorridorId
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-surface-muted/70 text-foreground hover:bg-surface-muted'
              }`}
              aria-pressed={!selectedCorridorId}
            >
              <span>
                {scopeLabel && scopeLabel !== 'DKI Jakarta'
                  ? `${copy.all} ${corridors.length} ${copy.corridor} ${scopeLabel}`
                  : `${copy.all} ${corridors.length} ${copy.corridor} BRT`}
              </span>
              {!selectedCorridorId && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </button>

            <div className="max-h-24 sm:max-h-28 overflow-y-auto scrollbar-thin flex flex-col gap-0.5 pr-0.5">
              {corridors.length === 0 ? (
                <div className="p-2 text-center text-[10px] text-muted">
                  {copy.noRoutes}
                </div>
              ) : (
                corridors.map((corridor) => {
                  const isSelected = selectedCorridorId === corridor.id
                  return (
                    <button
                      key={corridor.id}
                      type="button"
                      onClick={() => onSelectCorridor?.(corridor)}
                      className={`w-full flex items-center justify-between gap-1.5 rounded-md px-2 py-1 text-[10.5px] font-medium transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-purple-600 text-white font-bold'
                          : 'text-foreground hover:bg-surface-muted'
                      }`}
                      aria-pressed={isSelected}
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
            <div className="flex items-center justify-between rounded-xl luma-glass-inner p-2">
              <span className="text-[11px] font-semibold text-foreground">{copy.pipeline}</span>
              <button
                type="button"
                onClick={onToggleWaterNetwork}
                className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold transition-all cursor-pointer ${
                  isWaterNetworkVisible
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-surface-muted text-muted border border-border'
                }`}
                aria-pressed={isWaterNetworkVisible}
              >
                {isWaterNetworkVisible ? copy.show : copy.hide}
              </button>
            </div>
            <p className="text-[10.5px] font-medium leading-relaxed text-muted">
              {copy.waterDescription}
            </p>
          </div>
        )}
      </div>

      {activeMetadata.trendSector ? (
        <HistoricalTrendMini
          sector={activeMetadata.trendSector}
          accent={category === 'rth' ? '#22c55e' : category === 'transum' ? '#a855f7' : '#0ea5e9'}
        />
      ) : null}

      <details className="group border-t border-border/50 pt-1.5">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[10.5px] font-bold text-foreground">
          <span>{copy.transparency}</span>
          <span className="text-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span>
        </summary>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[10px] leading-tight">
          <dt className="text-muted">{copy.source}</dt>
          <dd className="text-right font-semibold text-foreground">
            <a
              href={activeMetadata.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
              title={copy.openSource}
            >
              {activeMetadata.source} ↗
            </a>
          </dd>
          <dt className="text-muted">{copy.coverage}</dt>
          <dd className="text-right font-medium text-foreground">{activeMetadata.coverage}</dd>
          <dt className="text-muted">{copy.unit}</dt>
          <dd className="text-right font-medium text-foreground">{activeMetadata.unit}</dd>
          <dt className="text-muted">{copy.period}</dt>
          <dd className="text-right font-medium text-foreground">
            {activeMetadata.period ?? `— ${copy.unavailable}`}
          </dd>
          <dt className="text-muted">{copy.updated}</dt>
          <dd className="text-right font-medium text-foreground">
            {activeMetadata.updatedAt ?? `— ${copy.unavailable}`}
          </dd>
          <dt className="text-muted">{copy.method}</dt>
          <dd className="text-right font-medium leading-relaxed text-foreground">{activeMetadata.method}</dd>
        </dl>
      </details>

      {/* 3. Footer Reset Cepat */}
      <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2 text-[10.5px]">
        <span className="font-medium text-muted">{copy.soloMode}</span>
        <button
          type="button"
          onClick={() => {
            onSelectCorridor?.(null)
            onFaskesFilterChange?.('all')
            onRthFilterChange?.('all')
            onSchoolFilterChange?.('all')
            onClose()
          }}
          className="inline-flex shrink-0 cursor-pointer items-center rounded-md border border-primary/25 bg-primary px-2 py-1 text-[10px] font-bold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
          aria-label={copy.reset}
        >
          {copy.reset} &times;
        </button>
      </div>
    </div>
  )
}

