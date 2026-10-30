import { Button } from '../../../components/ui/Button'
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
  fasum: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  transum: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  kesehatan: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
  pendidikan: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
  lingkungan: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
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
  const modalOpen = isOpen !== undefined ? isOpen : (facilityId !== null && facilityId !== undefined) || propFacility !== null

  if (!modalOpen) return null

  const categoryBadge =
    activeFacility?.category ? (CATEGORY_BADGE_COLORS[activeFacility.category.toLowerCase()] ?? 'bg-surface-muted text-muted border-border') : ''

  const docs = activeFacility
    ? ('documents' in activeFacility && Array.isArray(activeFacility.documents)
        ? activeFacility.documents
        : ('docs' in activeFacility && Array.isArray(activeFacility.docs) ? activeFacility.docs : []))
    : []

  const metrics = (activeFacility?.metrics ?? {}) as Record<string, unknown>
  const budget = (activeFacility?.budget ?? {}) as Record<string, string | null | undefined>
  const specs = (activeFacility?.specs ?? {}) as Record<string, string>

  return (
    <Modal
      isOpen={modalOpen}
      onClose={onClose}
      size="lg"
      title={
        activeFacility ? (
          <div className="flex flex-col gap-1 pr-6">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${categoryBadge}`}>
                {activeFacility.subCategory || activeFacility.category}
              </span>
              <span className="text-xs text-muted">{activeFacility.wilayah}</span>
            </div>
            <h2 className="text-lg font-bold text-foreground sm:text-xl">{activeFacility.name}</h2>
          </div>
        ) : (
          'Detail fasilitas'
        )
      }
      description={activeFacility?.address ?? (detail.status === 'loading' ? 'Memuat informasi fasilitas dari server…' : undefined)}
      footer={
        <div className="flex items-center justify-between w-full text-xs text-muted">
          <span>
            {activeFacility ? `Koordinat: ${activeFacility.lat.toFixed(4)}, ${activeFacility.lng.toFixed(4)}` : ''}
          </span>
          <Button variant="default" onClick={onClose}>
            Tutup
          </Button>
        </div>
      }
    >
      {detail.status === 'loading' && !activeFacility ? (
        <div className="space-y-3" aria-label="Memuat detail fasilitas">
          <Skeleton className="h-20 w-full bg-white/10" />
          <Skeleton className="h-40 w-full bg-white/10" />
          <Skeleton className="h-28 w-full bg-white/10" />
        </div>
      ) : null}

      {detail.status === 'error' && !activeFacility ? (
        <ErrorBanner
          error={detail.error}
          className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3"
        />
      ) : null}

      {activeFacility ? (
        <div className="flex flex-col gap-6 py-2">
          {/* Metrik Lingkungan & Walkability */}
          {Object.keys(metrics).length > 0 ? (
            <section className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Indikator Lingkungan & Akses</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-surface-muted/50 p-3">
                  <span className="text-[11px] font-medium text-muted">Kualitas Udara (AQI)</span>
                  <p className="mt-1 text-base font-bold text-foreground">
                    {String(metrics.aqi ?? '—')}{' '}
                    {metrics.aqiStatus ? (
                      <span className="text-xs font-normal text-muted">({String(metrics.aqiStatus)})</span>
                    ) : null}
                  </p>
                  {metrics.pm25 ? (
                    <p className="mt-0.5 text-[10px] text-muted">PM2.5: {String(metrics.pm25)}</p>
                  ) : null}
                </div>

                <div className="rounded-xl border border-border bg-surface-muted/50 p-3">
                  <span className="text-[11px] font-medium text-muted">Walkability Score</span>
                  <p className="mt-1 text-base font-bold text-foreground">
                    {String(metrics.walkability ?? '—')}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1 rounded-xl border border-border bg-surface-muted/50 p-3">
                  <span className="text-[11px] font-medium text-muted">Akses Transit</span>
                  <p className="mt-1 text-xs font-semibold text-foreground line-clamp-2">
                    {String(metrics.transitAccess ?? '—')}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {/* Transparansi Anggaran */}
          {Object.keys(budget).length > 0 ? (
            <section className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Transparansi Anggaran & Pembangunan</h3>
              <div className="rounded-xl border border-border bg-surface-muted/30 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
                  <span className="text-xs text-muted">Nilai Realisasi Anggaran</span>
                  <span className="text-lg font-extrabold text-foreground">{budget.total ?? 'Termasuk APBD'}</span>
                </div>

                <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
                  <div>
                    <dt className="text-muted">Sumber Pendanaan</dt>
                    <dd className="font-medium text-foreground">{budget.source ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Tahun Pelaksanaan</dt>
                    <dd className="font-medium text-foreground">{budget.year ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Pelaksana / Kontraktor</dt>
                    <dd className="font-medium text-foreground">{budget.contractor ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Status Operasional</dt>
                    <dd className="font-medium text-emerald-600">{budget.status ?? 'Aktif'}</dd>
                  </div>
                </dl>
              </div>
            </section>
          ) : null}

          {/* Spesifikasi Teknis */}
          {specs && Object.keys(specs).length > 0 ? (
            <section className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Spesifikasi Fasilitas</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Object.entries(specs).map(([key, val]) => (
                  <div key={key} className="flex flex-col rounded-lg border border-border/80 bg-surface p-2.5 text-xs">
                    <span className="text-[11px] text-muted">{key}</span>
                    <span className="mt-0.5 font-medium text-foreground">{val}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Dokumen Publik */}
          {docs.length > 0 ? (
            <section className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Dokumen Keterbukaan Publik</h3>
              <div className="flex flex-col gap-2">
                {docs.map((doc, idx) => {
                  const title = 'title' in doc ? doc.title : ''
                  const dept = 'dept' in doc ? doc.dept : undefined
                  const size = 'size' in doc ? doc.size : undefined
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-rose-500/10 text-rose-600 font-bold text-[10px]">
                          PDF
                        </span>
                        <div className="truncate">
                          <p className="font-medium text-foreground truncate">{title}</p>
                          <p className="text-[10px] text-muted">
                            {dept ?? 'Dinas Terkait'} {size ? `• ${size}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-md border border-border bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-muted">
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
