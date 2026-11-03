import { useMemo, useState, useEffect } from 'react'
import { ErrorBanner } from '../../../components/ui/ErrorBanner'
import { Modal } from '../../../components/ui/Modal'
import { Skeleton } from '../../../components/ui/Skeleton'
import type { Facility } from '../../../lib/api'
import type { FacilityItem } from '../types/facility.types'
import { useFacilityDetail } from '../hooks/useFacilityDetail'
import { useTranslation } from '../../../i18n/useTranslation'

interface FacilityDetailModalProps {
  facilityId?: string | null
  facility?: FacilityItem | Facility | null
  isOpen?: boolean
  onClose: () => void
  variant?: 'center' | 'side-glass'
}

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  fasum: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/40',
  transum: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/40',
  kesehatan: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/40',
  pendidikan: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/40',
  lingkungan: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/40',
}

function formatMetadataDate(value: string, language: 'id' | 'en'): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
    dateStyle: 'medium',
  }).format(date)
}

export function FacilityDetailModal({
  facilityId,
  facility: propFacility,
  isOpen,
  onClose,
  variant = 'center',
}: FacilityDetailModalProps) {
  const { language } = useTranslation()
  const copy = language === 'id'
    ? {
        environment: 'Kondisi Lingkungan & Akses', airQuality: 'Kualitas Udara',
        scale: 'Skala 1.0 – 5.0', transit: 'Akses Transit', budget: 'Transparansi Realisasi Anggaran',
        totalBudget: 'Total Anggaran Dialokasikan', funding: 'Sumber Pendanaan', year: 'Tahun Anggaran',
        contractor: 'Pelaksana / Kontraktor', status: 'Status Operasional', specifications: 'Spesifikasi & Fasilitas',
        documents: 'Dokumen Keterbukaan Publik', publicDocument: 'Dokumen Publik', department: 'Dinas Terkait',
        download: 'Unduh', downloadTitle: 'Unduh berkas dokumen', detail: 'Detail fasilitas',
        panelAria: 'Detail Fasilitas', close: 'Tutup detail fasilitas', loading: 'Memuat detail fasilitas',
        loadingDescription: 'Memuat informasi fasilitas dari server…',
        dataInfo: 'Informasi Data', source: 'Sumber', period: 'Periode', updated: 'Diperbarui',
        unavailable: 'Sebagian metadata belum dicantumkan oleh sumber.',
      }
    : {
        environment: 'Environment & Access', airQuality: 'Air Quality',
        scale: 'Scale 1.0 – 5.0', transit: 'Transit Access', budget: 'Budget Realization Transparency',
        totalBudget: 'Total Allocated Budget', funding: 'Funding Source', year: 'Budget Year',
        contractor: 'Implementer / Contractor', status: 'Operational Status', specifications: 'Specifications & Facilities',
        documents: 'Public Disclosure Documents', publicDocument: 'Public Document', department: 'Relevant Agency',
        download: 'Download', downloadTitle: 'Download document', detail: 'Facility details',
        panelAria: 'Facility Details', close: 'Close facility details', loading: 'Loading facility details',
        loadingDescription: 'Loading facility information from the server…',
        dataInfo: 'Data Information', source: 'Source', period: 'Period', updated: 'Updated',
        unavailable: 'Some metadata was not provided by the source.',
      }

  // If facilityId is passed (e.g. from page.tsx), load it via hook
  const detail = useFacilityDetail(facilityId ?? null)

  const activeFacility = propFacility ?? detail.data
  const modalOpen =
    isOpen !== undefined
      ? isOpen
      : Boolean(propFacility) || (facilityId !== null && facilityId !== undefined)

  // Pola React resmi: sinkronisasi state saat prop berubah tanpa useEffect
  const [prevFacility, setPrevFacility] = useState<FacilityItem | Facility | null>(activeFacility)
  const [cachedFacility, setCachedFacility] = useState<FacilityItem | Facility | null>(activeFacility)

  if (activeFacility !== prevFacility) {
    setPrevFacility(activeFacility)
    if (activeFacility) {
      setCachedFacility(activeFacility)
    }
  }

  const displayFacility = activeFacility ?? cachedFacility

  // Keyboard shortcut: Esc to close side-glass modal
  useEffect(() => {
    if (variant !== 'side-glass' || !modalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [variant, modalOpen, onClose])

  // Normalisasi spesifikasi fasilitas baik format object Record maupun Array relasional [{ specKey, specValue }]
  const specs = useMemo<Record<string, string>>(() => {
    const raw = displayFacility?.specs
    if (!raw) return {}
    if (Array.isArray(raw)) {
      const res: Record<string, string> = {}
      for (const item of raw) {
        if (item && typeof item === 'object') {
          const spec = item as Record<string, unknown>
          const k = spec.specKey ?? spec.spec_key ?? spec.key
          const v = spec.specValue ?? spec.spec_value ?? spec.value
          if (k && v !== undefined && v !== null) {
            res[String(k)] = String(v)
          }
        }
      }
      return res
    }
    if (typeof raw === 'object') {
      const res: Record<string, string> = {}
      for (const [k, v] of Object.entries(raw)) {
        if (v !== undefined && v !== null && typeof v !== 'object') {
          res[k] = String(v)
        }
      }
      return res
    }
    return {}
  }, [displayFacility?.specs])

  if (!modalOpen && !displayFacility) {
    return null
  }

  const categoryBadge =
    displayFacility?.category
      ? (CATEGORY_BADGE_COLORS[displayFacility.category.toLowerCase()] ??
        'bg-primary/10 text-primary border-primary/25')
      : ''

  const docs = displayFacility
    ? ('documents' in displayFacility && Array.isArray(displayFacility.documents)
        ? displayFacility.documents
        : ('docs' in displayFacility && Array.isArray(displayFacility.docs) ? displayFacility.docs : []))
    : []

  const metrics = (displayFacility?.metrics ?? {}) as Record<string, unknown>
  const aqiStatus = metrics.aqiStatus ?? metrics.aqi_status
  const transitAccess = metrics.transitAccess ?? metrics.transit_access
  const budget = (displayFacility?.budget ?? {}) as Record<string, string | null | undefined>

  // =========================================================================
  // ISI DETAIL LENGKAP FASILITAS (Reused across side-glass & center modal)
  // =========================================================================
  const renderDetailContent = () => (
    <div className="flex flex-col gap-3 py-0.5">
      {/* 1. Metrik Lingkungan & Walkability (Glass Cards) */}
      {Object.keys(metrics).length > 0 ? (
        <section className="flex flex-col gap-1.5">
          <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-primary dark:text-emerald-400 flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary dark:bg-emerald-400" />
            <span>{copy.environment}</span>
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {metrics.aqi !== undefined && (
              <div className="luma-glass-inner rounded-xl p-2.5 shadow-xs">
                <span className="text-[9.5px] font-semibold text-muted dark:text-white/60">{copy.airQuality}</span>
                <p className="mt-0.5 text-xs font-bold text-foreground dark:text-white">
                  {String(metrics.aqi)} {language === 'id' ? 'ISPU' : 'AQI'}{' '}
                  {Boolean(aqiStatus) && (
                    <span className="text-[10.5px] font-medium text-emerald-600 dark:text-emerald-300">({String(aqiStatus)})</span>
                  )}
                </p>
                {metrics.pm25 !== undefined && (
                  <p className="mt-0.5 text-[9px] text-muted dark:text-white/50">PM2.5: {String(metrics.pm25)}</p>
                )}
              </div>
            )}

            {metrics.walkability !== undefined && (
              <div className="luma-glass-inner rounded-xl p-2.5 shadow-xs">
                <span className="text-[9.5px] font-semibold text-muted dark:text-white/60">Walkability</span>
                <p className="mt-0.5 text-xs font-bold text-foreground dark:text-white">
                  {String(metrics.walkability)}
                </p>
                <p className="mt-0.5 text-[9px] text-muted dark:text-white/50">{copy.scale}</p>
              </div>
            )}

            {transitAccess !== undefined && (
              <div className="col-span-2 sm:col-span-1 luma-glass-inner rounded-xl p-2.5 shadow-xs">
                <span className="text-[9.5px] font-semibold text-muted dark:text-white/60">{copy.transit}</span>
                <p className="mt-0.5 text-[11px] font-semibold text-foreground dark:text-white/90 line-clamp-2">
                  {String(transitAccess)}
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* 2. Detail Realisasi Anggaran (Glass Budget Card) */}
      {Object.keys(budget).length > 0 ? (
        <section className="flex flex-col gap-1.5">
          <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-primary dark:text-emerald-400 flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary dark:bg-emerald-400" />
            <span>{copy.budget}</span>
          </h3>
          <div className="luma-glass-inner rounded-xl p-3 shadow-xs">
            <div className="flex flex-wrap items-baseline justify-between gap-1.5 border-b border-border/50 dark:border-white/10 pb-2">
              <span className="text-[10.5px] font-medium text-muted dark:text-white/60">{copy.totalBudget}</span>
              <span className="text-sm font-extrabold text-primary dark:text-emerald-400">
                {budget.total ?? budget.nilai ?? '—'}
              </span>
            </div>
            <dl className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 text-xs">
              {budget.source && (
                <div>
                  <dt className="text-[10px] text-muted dark:text-white/50">{copy.funding}</dt>
                  <dd className="font-semibold text-foreground dark:text-white/90 text-[11px] mt-0.5">{budget.source}</dd>
                </div>
              )}
              {budget.year && (
                <div>
                  <dt className="text-[10px] text-muted dark:text-white/50">{copy.year}</dt>
                  <dd className="font-semibold text-foreground dark:text-white/90 text-[11px] mt-0.5">{budget.year}</dd>
                </div>
              )}
              {budget.contractor && (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] text-muted dark:text-white/50">{copy.contractor}</dt>
                  <dd className="font-semibold text-foreground dark:text-white/90 text-[11px] mt-0.5">{budget.contractor}</dd>
                </div>
              )}
              {budget.status && (
                <div>
                  <dt className="text-[10px] text-muted dark:text-white/50">{copy.status}</dt>
                  <dd className="font-semibold text-primary dark:text-emerald-400 flex items-center gap-1 mt-0.5 text-[11px]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary dark:bg-emerald-400 animate-pulse" />
                    <span>{budget.status}</span>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>
      ) : null}

      {/* Metadata hanya memakai nilai yang benar-benar tersedia dari sumber. */}
      {displayFacility ? (
        <section className="flex flex-col gap-1.5">
          <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-primary dark:text-emerald-400 flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary dark:bg-emerald-400" />
            <span>{copy.dataInfo}</span>
          </h3>
          <dl className="luma-glass-inner grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-xl p-2.5 text-[10px] shadow-xs">
            <dt className="text-muted dark:text-white/50">{copy.source}</dt>
            <dd className="text-right font-semibold text-foreground dark:text-white/90">{budget.source ?? '—'}</dd>
            <dt className="text-muted dark:text-white/50">{copy.period}</dt>
            <dd className="text-right font-semibold text-foreground dark:text-white/90">{budget.year ?? '—'}</dd>
            <dt className="text-muted dark:text-white/50">{copy.updated}</dt>
            <dd className="text-right font-semibold text-foreground dark:text-white/90">
              {'updatedAt' in displayFacility && displayFacility.updatedAt
                ? formatMetadataDate(displayFacility.updatedAt, language)
                : '—'}
            </dd>
          </dl>
          {(!budget.source || !budget.year || !('updatedAt' in displayFacility) || !displayFacility.updatedAt) ? (
            <p className="text-[9px] leading-relaxed text-muted dark:text-white/50">
              — {copy.unavailable}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* 3. Spesifikasi Teknis Fasilitas */}
      {Object.keys(specs).length > 0 ? (
        <section className="flex flex-col gap-1.5">
          <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-primary dark:text-emerald-400 flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary dark:bg-emerald-400" />
            <span>{copy.specifications}</span>
          </h3>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {Object.entries(specs).map(([key, val]) => (
              <div key={key} className="flex flex-col luma-glass-inner rounded-xl p-2 shadow-xs">
                <span className="text-[9.5px] font-medium text-muted dark:text-white/50">{key}</span>
                <span className="mt-0.5 text-[11px] font-semibold text-foreground dark:text-white/95">{val}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 4. Dokumen Keterbukaan Publik (Direct Download Support) */}
      {docs.length > 0 ? (
        <section className="flex flex-col gap-1.5">
          <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-primary dark:text-emerald-400 flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary dark:bg-emerald-400" />
            <span>{copy.documents}</span>
          </h3>
          <div className="flex flex-col gap-1.5">
            {docs.map((doc, idx) => {
              const title = 'title' in doc ? doc.title : copy.publicDocument
              const dept = 'dept' in doc ? doc.dept : undefined
              const size = 'size' in doc ? doc.size : undefined
              const url = 'url' in doc && doc.url ? String(doc.url) : '#'

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between luma-glass-inner rounded-xl p-2 shadow-xs hover:border-primary/40 transition-all text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden pr-1.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-500 dark:text-rose-400 font-bold text-[9px]">
                      PDF
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-foreground dark:text-white truncate text-[11px]">{title}</p>
                      <p className="text-[9.5px] text-muted dark:text-white/50">
                        {dept ?? copy.department} {size ? `• ${size}` : ''}
                      </p>
                    </div>
                  </div>
                  <a
                    href={url}
                    download={title}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 text-primary dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold hover:bg-primary/20 transition cursor-pointer"
                    title={copy.downloadTitle}
                  >
                    <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    <span>{copy.download}</span>
                  </a>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )

  // =========================================================================
  // VARIAN 1: SIDE-GLASS (Floating Glass Panel di Kanan Layar Peta)
  // =========================================================================
  if (variant === 'side-glass') {
    if (!modalOpen || !displayFacility) return null

    return (
      <aside
        aria-label={copy.panelAria}
        className="fixed inset-x-2 bottom-[4.75rem] z-40 flex max-h-[58dvh] flex-col overflow-hidden rounded-2xl luma-map-card text-foreground dark:text-white animate-in fade-in slide-in-from-bottom-4 duration-250 select-text sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-18 sm:w-[310px] sm:max-h-[calc(100dvh-15.5rem)] sm:slide-in-from-right-4"
      >
        {/* Header Glass */}
        <header className="flex shrink-0 items-start justify-between gap-2.5 border-b border-border/50 dark:border-white/10 bg-white/[0.04] p-3 sm:p-3.5">
          <div className="flex flex-col gap-0.5 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm ${categoryBadge}`}>
                {displayFacility.subCategory || displayFacility.category}
              </span>
              <span className="text-[11px] font-medium text-muted dark:text-white/60">{displayFacility.wilayah}</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-foreground dark:text-white tracking-tight leading-snug line-clamp-2 mt-0.5">
              {displayFacility.name}
            </h2>
            {displayFacility.address && (
              <p className="flex items-start gap-1 text-[11px] text-muted dark:text-white/70 line-clamp-2 mt-0.5">
                <svg className="size-3 shrink-0 text-primary dark:text-emerald-400 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="truncate">{displayFacility.address}</span>
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label={copy.close}
            onClick={onClose}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border/60 dark:border-white/15 bg-surface/80 dark:bg-white/10 text-muted hover:text-foreground dark:text-white/70 dark:hover:text-white transition cursor-pointer"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-3.5 flex flex-col gap-3 text-foreground dark:text-white">
          {detail.status === 'loading' && !displayFacility ? (
            <div className="space-y-2.5" aria-label={copy.loading}>
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : null}

          {detail.status === 'error' && !displayFacility ? (
            <ErrorBanner
              error={detail.error}
              className="rounded-xl border border-red-400/30 bg-red-500/10 p-2.5 text-xs text-foreground dark:text-white backdrop-blur-md"
            />
          ) : null}

          {displayFacility ? renderDetailContent() : null}
        </div>

        {/* Footer Glass */}
        <footer className="flex shrink-0 items-center border-t border-border/50 dark:border-white/10 bg-white/[0.02] px-3 py-2 sm:px-3.5 text-xs text-muted dark:text-white/60">
          <span className="font-mono text-[10px] flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary dark:bg-emerald-400 animate-pulse" />
            {typeof displayFacility.lat === 'number' && typeof displayFacility.lng === 'number'
              ? `GPS: ${displayFacility.lat.toFixed(4)}, ${displayFacility.lng.toFixed(4)}`
              : ''}
          </span>
        </footer>
      </aside>
    )
  }

  // =========================================================================
  // VARIAN 2: CENTER MODAL (Digunakan pada ringkasan sektoral / page.tsx)
  // =========================================================================
  return (
    <Modal
      isOpen={modalOpen}
      onClose={onClose}
      size="lg"
      title={
        displayFacility ? (
          <div className="flex flex-col gap-1.5 pr-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm shadow-sm ${categoryBadge}`}>
                {displayFacility.subCategory || displayFacility.category}
              </span>
              <span className="text-xs font-medium text-white/60">{displayFacility.wilayah}</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
              {displayFacility.name}
            </span>
          </div>
        ) : (
          copy.detail
        )
      }
      description={
        displayFacility?.address ? (
          <span className="flex items-center gap-1.5 text-xs text-white/70">
            <svg className="size-3.5 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{displayFacility.address}</span>
          </span>
        ) : (
          detail.status === 'loading' ? copy.loadingDescription : undefined
        )
      }
      footer={
        <div className="flex items-center w-full text-xs text-white/60">
          <span className="font-mono text-[11px] text-white/50 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {displayFacility && typeof displayFacility.lat === 'number' && typeof displayFacility.lng === 'number'
              ? `GPS: ${displayFacility.lat.toFixed(4)}, ${displayFacility.lng.toFixed(4)}`
              : ''}
          </span>
        </div>
      }
    >
      {detail.status === 'loading' && !displayFacility ? (
        <div className="space-y-3" aria-label={copy.loading}>
          <Skeleton className="h-20 w-full bg-white/10 rounded-2xl" />
          <Skeleton className="h-40 w-full bg-white/10 rounded-2xl" />
          <Skeleton className="h-28 w-full bg-white/10 rounded-2xl" />
        </div>
      ) : null}

      {detail.status === 'error' && !displayFacility ? (
        <ErrorBanner
          error={detail.error}
          className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-white backdrop-blur-md"
        />
      ) : null}

      {displayFacility ? renderDetailContent() : null}
    </Modal>
  )
}
