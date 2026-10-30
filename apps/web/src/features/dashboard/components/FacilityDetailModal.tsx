import { Modal } from '../../../components/ui/Modal'
import type { FacilityItem } from '../types/facility.types'

interface FacilityDetailModalProps {
  facility: FacilityItem | null
  isOpen: boolean
  onClose: () => void
}

export function FacilityDetailModal({ facility, isOpen, onClose }: FacilityDetailModalProps) {
  if (!facility) return null

  const categoryBadgeColors: Record<string, string> = {
    fasum: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    transum: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    kesehatan: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
    pendidikan: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
    lingkungan: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
  }

  const badgeClass = categoryBadgeColors[facility.category] ?? 'bg-surface-muted text-muted border-border'

  const docs = facility.documents ?? facility.docs ?? []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex flex-col gap-1 pr-6">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${badgeClass}`}>
              {facility.subCategory || facility.category}
            </span>
            <span className="text-xs text-muted">{facility.wilayah}</span>
          </div>
          <h2 className="text-lg font-bold text-foreground sm:text-xl">{facility.name}</h2>
        </div>
      }
      description={facility.address ?? undefined}
      footer={
        <div className="flex items-center justify-between w-full text-xs text-muted">
          <span>Koordinat: {facility.lat.toFixed(4)}, {facility.lng.toFixed(4)}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 font-medium text-on-primary hover:bg-primary-hover transition-colors"
          >
            Tutup
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 py-2">
        {/* Metrik Lingkungan & Walkability */}
        {facility.metrics ? (
          <section className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Indikator Lingkungan & Akses</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface-muted/50 p-3">
                <span className="text-[11px] font-medium text-muted">Kualitas Udara (AQI)</span>
                <p className="mt-1 text-base font-bold text-foreground">
                  {facility.metrics.aqi ?? '—'} <span className="text-xs font-normal text-muted">({facility.metrics.aqiStatus ?? 'N/A'})</span>
                </p>
                {facility.metrics.pm25 ? (
                  <p className="mt-0.5 text-[10px] text-muted">PM2.5: {facility.metrics.pm25}</p>
                ) : null}
              </div>

              <div className="rounded-xl border border-border bg-surface-muted/50 p-3">
                <span className="text-[11px] font-medium text-muted">Walkability Score</span>
                <p className="mt-1 text-base font-bold text-foreground">
                  {facility.metrics.walkability ?? '—'}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-xl border border-border bg-surface-muted/50 p-3">
                <span className="text-[11px] font-medium text-muted">Akses Transit</span>
                <p className="mt-1 text-xs font-semibold text-foreground line-clamp-2">
                  {facility.metrics.transitAccess ?? '—'}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {/* Transparansi Anggaran */}
        {facility.budget ? (
          <section className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Transparansi Anggaran & Pembangunan</h3>
            <div className="rounded-xl border border-border bg-surface-muted/30 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
                <span className="text-xs text-muted">Nilai Realisasi Anggaran</span>
                <span className="text-lg font-extrabold text-foreground">{facility.budget.total ?? 'Termasuk APBD'}</span>
              </div>

              <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
                <div>
                  <dt className="text-muted">Sumber Pendanaan</dt>
                  <dd className="font-medium text-foreground">{facility.budget.source ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted">Tahun Pelaksanaan</dt>
                  <dd className="font-medium text-foreground">{facility.budget.year ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted">Pelaksana / Kontraktor</dt>
                  <dd className="font-medium text-foreground">{facility.budget.contractor ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted">Status Operasional</dt>
                  <dd className="font-medium text-emerald-600">{facility.budget.status ?? 'Aktif'}</dd>
                </div>
              </dl>
            </div>
          </section>
        ) : null}

        {/* Spesifikasi Teknis */}
        {facility.specs && Object.keys(facility.specs).length > 0 ? (
          <section className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Spesifikasi Fasilitas</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(facility.specs).map(([key, val]) => (
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
              {docs.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-rose-500/10 text-rose-600 font-bold text-[10px]">
                      PDF
                    </span>
                    <div className="truncate">
                      <p className="font-medium text-foreground truncate">{doc.title}</p>
                      <p className="text-[10px] text-muted">
                        {doc.dept ?? 'Dinas Terkait'} {doc.size ? `• ${doc.size}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md border border-border bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-muted">
                    Tersedia
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </Modal>
  )
}

