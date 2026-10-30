import { Button } from '../../../components/ui/Button'
import { ErrorBanner } from '../../../components/ui/ErrorBanner'
import { Modal } from '../../../components/ui/Modal'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useFacilityDetail } from '../hooks/useFacilityDetail'

interface FacilityDetailModalProps {
  facilityId: string | null
  onClose: () => void
}

function DetailSection({ title, data }: { title: string; data: Record<string, string> }) {
  const entries = Object.entries(data)
  if (entries.length === 0) return null

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">{title}</h3>
      <dl className="mt-3 divide-y divide-white/10">
        {entries.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-2.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="text-xs text-white/45">{label}</dt>
            <dd className="text-sm text-white/85">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function FacilityDetailModal({ facilityId, onClose }: FacilityDetailModalProps) {
  const detail = useFacilityDetail(facilityId)
  const facility = detail.data
  const metricStrings = facility
    ? Object.fromEntries(
        Object.entries(facility.metrics).map(([key, value]) => [key, String(value)]),
      )
    : {}

  return (
    <Modal
      isOpen={facilityId !== null}
      onClose={onClose}
      size="lg"
      title={facility?.name ?? 'Detail fasilitas'}
      description={
        facility
          ? `${facility.subCategory ?? facility.category} · ${facility.kecamatan ?? facility.wilayah}`
          : 'Memuat informasi fasilitas dari server…'
      }
      footer={<Button variant="default" onClick={onClose}>Tutup</Button>}
    >
      {detail.status === 'loading' ? (
        <div className="space-y-3" aria-label="Memuat detail fasilitas">
          <Skeleton className="h-20 w-full bg-white/10" />
          <Skeleton className="h-40 w-full bg-white/10" />
          <Skeleton className="h-28 w-full bg-white/10" />
        </div>
      ) : null}

      {detail.status === 'error' ? (
        <ErrorBanner
          error={detail.error}
          className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3"
        />
      ) : null}

      {facility ? (
        <div className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Lokasi</p>
            <p className="mt-2 text-sm text-white/85">{facility.address ?? 'Alamat belum tersedia'}</p>
            <p className="mt-1 text-xs text-white/45">
              {facility.wilayah} · {facility.lat.toFixed(5)}, {facility.lng.toFixed(5)}
            </p>
          </section>
          <DetailSection title="Spesifikasi" data={facility.specs} />
          <DetailSection title="Metrik" data={metricStrings} />
          <DetailSection title="Anggaran & status" data={facility.budget} />
          {facility.documents.length > 0 ? (
            <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Dokumen publik</h3>
              <ul className="mt-3 space-y-2">
                {facility.documents.map((document) => (
                  <li key={document.title} className="rounded-xl border border-white/10 px-3 py-2.5">
                    <p className="text-sm text-white/85">{document.title}</p>
                    <p className="mt-0.5 text-xs text-white/45">
                      {[document.dept, document.size].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </Modal>
  )
}
