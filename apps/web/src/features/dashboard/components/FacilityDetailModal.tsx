import { useMemo, useState } from 'react'
import { ErrorBanner } from '../../../components/ui/ErrorBanner'
import { Modal } from '../../../components/ui/Modal'
import { Skeleton } from '../../../components/ui/Skeleton'
import type { Facility } from '../../../lib/api'
import type { FacilityItem } from '../types/facility.types'
import { useFacilityDetail } from '../hooks/useFacilityDetail'

interface FacilityDetailModalProps {
  facilityId?: string | null
  facility?: FacilityItem | Facility | null
  isOpen?: boolean
  onClose: () => void
}

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  fasum: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  transum: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  kesehatan: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  pendidikan: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  lingkungan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
}

export function FacilityDetailModal({
  facilityId,
  facility: propFacility,
  isOpen,
  onClose,
}: FacilityDetailModalProps) {
  // If facilityId is passed (e.g. from page.tsx), load it via hook
  const detail = useFacilityDetail(facilityId ?? null)

  const activeFacility = propFacility ?? detail.data
  const modalOpen =
    isOpen !== undefined
      ? isOpen
      : (facilityId !== null && facilityId !== undefined) || propFacility !== null

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

  // Jika modal belum pernah dibuka sama sekali dan tidak ada data, jangan mount ke DOM
  if (!modalOpen && !displayFacility) {
    return null
  }

  const categoryBadge =
    displayFacility?.category
      ? (CATEGORY_BADGE_COLORS[displayFacility.category.toLowerCase()] ??
        'bg-white/10 text-white/80 border-white/20')
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
          'Detail fasilitas'
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
          detail.status === 'loading' ? 'Memuat informasi fasilitas dari server…' : undefined
        )
      }
      footer={
        <div className="flex items-center justify-between w-full text-xs text-white/60">
          <span className="font-mono text-[11px] text-white/50 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {displayFacility && typeof displayFacility.lat === 'number' && typeof displayFacility.lng === 'number'
              ? `GPS: ${displayFacility.lat.toFixed(4)}, ${displayFacility.lng.toFixed(4)}`
              : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/20 hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 backdrop-blur-md cursor-pointer"
          >
            Tutup
          </button>
        </div>
      }
    >
      {detail.status === 'loading' && !displayFacility ? (
        <div className="space-y-3" aria-label="Memuat detail fasilitas">
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

      {displayFacility ? (
        <div className="flex flex-col gap-6 py-1">
          {/* Metrik Lingkungan & Walkability (Glass Cards) */}
          {Object.keys(metrics).length > 0 ? (
            <section className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Indikator Lingkungan & Akses</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md hover:bg-white/[0.07] transition-all shadow-sm">
                  <span className="text-[11px] font-medium text-white/60">Kualitas Udara (AQI)</span>
                  <p className="mt-1 text-base font-bold text-white">
                    {String(metrics.aqi ?? '—')}{' '}
                    {aqiStatus ? (
                      <span className="text-xs font-normal text-emerald-300">({String(aqiStatus)})</span>
                    ) : null}
                  </p>
                  {metrics.pm25 ? (
                    <p className="mt-0.5 text-[10px] text-white/50">PM2.5: {String(metrics.pm25)}</p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md hover:bg-white/[0.07] transition-all shadow-sm">
                  <span className="text-[11px] font-medium text-white/60">Walkability Score</span>
                  <p className="mt-1 text-base font-bold text-white">
                    {String(metrics.walkability ?? '—')}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md hover:bg-white/[0.07] transition-all shadow-sm">
                  <span className="text-[11px] font-medium text-white/60">Akses Transit</span>
                  <p className="mt-1 text-xs font-semibold text-white/90 line-clamp-2">
                    {String(transitAccess ?? '—')}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {/* Transparansi Anggaran (Glass Panel) */}
          {Object.keys(budget).length > 0 ? (
            <section className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Transparansi Anggaran & Pembangunan</span>
              </h3>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-3">
                  <span className="text-xs text-white/60">Nilai Realisasi Anggaran</span>
                  <span className="text-lg font-extrabold text-emerald-400">{budget.total ?? 'Termasuk APBD'}</span>
                </div>

                <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
                  <div>
                    <dt className="text-white/50">Sumber Pendanaan</dt>
                    <dd className="font-medium text-white/90 mt-0.5">{budget.source ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-white/50">Tahun Pelaksanaan</dt>
                    <dd className="font-medium text-white/90 mt-0.5">{budget.year ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-white/50">Pelaksana / Kontraktor</dt>
                    <dd className="font-medium text-white/90 mt-0.5">{budget.contractor ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-white/50">Status Operasional</dt>
                    <dd className="font-medium text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{budget.status ?? 'Aktif'}</span>
                    </dd>
                  </div>
                </dl>
              </div>
            </section>
          ) : null}

          {/* Spesifikasi Teknis (Glass Chips Grid) */}
          {specs && Object.keys(specs).length > 0 ? (
            <section className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Spesifikasi Fasilitas</span>
              </h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {Object.entries(specs).map(([key, val]) => (
                  <div key={key} className="flex flex-col rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">
                    <span className="text-[11px] font-medium text-white/50">{key}</span>
                    <span className="mt-1 text-xs font-semibold text-white/95">{val}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Dokumen Publik (Glass List Rows) */}
          {docs.length > 0 ? (
            <section className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Dokumen Keterbukaan Publik</span>
              </h3>
              <div className="flex flex-col gap-2">
                {docs.map((doc, idx) => {
                  const title = 'title' in doc ? doc.title : ''
                  const dept = 'dept' in doc ? doc.dept : undefined
                  const size = 'size' in doc ? doc.size : undefined
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md hover:bg-white/[0.08] transition-all text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-[10px]">
                          PDF
                        </span>
                        <div className="truncate">
                          <p className="font-medium text-white truncate">{title}</p>
                          <p className="text-[10px] text-white/50">
                            {dept ?? 'Dinas Terkait'} {size ? `• ${size}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-md border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/80">
                        Tersedia
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </Modal>
  )
}
