import { CategoryIconBadge, type CategoryIconKind } from '../../../components/ui/CategoryIconBadge'
import { getDataCatalogList, type CatalogCategory } from '../../../data/data-catalog'
import { useTranslation } from '../../../i18n/useTranslation'

interface DataSourcesComingSoonPageProps {
  onBack: () => void
}

const ICON_BY_CATEGORY: Record<CatalogCategory, CategoryIconKind> = {
  airQuality: 'air',
  kesehatan: 'health',
  rth: 'green',
  sekolah: 'school',
  transum: 'transit',
  air: 'water',
}

export function DataSourcesComingSoonPage({ onBack }: DataSourcesComingSoonPageProps) {
  const { language } = useTranslation()
  const dataCatalog = getDataCatalogList(language)
  const copy = language === 'id'
    ? {
        back: 'Kembali ke Peta', eyebrow: 'Provenansi data aktif',
        title: 'Katalog & Transparansi Sumber Data',
        description: 'Setiap layer menjelaskan sumber, cakupan, satuan, periode, serta metode pengolahan yang digunakan Luma.',
        datasets: 'dataset terdokumentasi', coverage: 'Cakupan', unit: 'Satuan',
        period: 'Periode', updated: 'Diperbarui', method: 'Metode pengolahan', unavailable: 'Belum tersedia',
        open: 'Buka sumber resmi', live: 'Live', active: 'Aktif', curated: 'Terkurasi',
        noteTitle: 'Catatan penggunaan data',
        note: 'Data terkurasi digunakan untuk eksplorasi dan transparansi publik. Layer yang belum memiliki seri resmi lengkap diberi keterangan secara eksplisit dan tidak ditampilkan sebagai data real-time.',
      }
    : {
        back: 'Back to Map', eyebrow: 'Active data provenance',
        title: 'Data Source & Transparency Catalog',
        description: 'Every layer documents the source, coverage, unit, period, and processing method used by Luma.',
        datasets: 'documented datasets', coverage: 'Coverage', unit: 'Unit',
        period: 'Period', updated: 'Updated', method: 'Processing method', unavailable: 'Not available',
        open: 'Open official source', live: 'Live', active: 'Active', curated: 'Curated',
        noteTitle: 'Data usage note',
        note: 'Curated data supports public exploration and transparency. Layers without a complete official series are explicitly identified and are not presented as real-time data.',
      }

  return (
    <div className="relative h-full w-full overflow-y-auto bg-surface-muted/40 p-4 select-none sm:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-12">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-bold text-foreground shadow-xs transition-all hover:border-primary/50 hover:bg-surface-muted"
          >
            <span className="font-bold transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>
            <span>{copy.back}</span>
          </button>
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            {dataCatalog.length} {copy.datasets}
          </span>
        </div>

        <header className="luma-map-card rounded-3xl p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">{copy.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">{copy.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{copy.description}</p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label={copy.title}>
          {dataCatalog.map((item) => {
            const statusLabel = item.status === 'live' ? copy.live : item.status === 'active' ? copy.active : copy.curated
            return (
              <article key={item.category} className="luma-map-card luma-glass-hover flex flex-col gap-4 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <CategoryIconBadge category={ICON_BY_CATEGORY[item.category]} />
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-foreground">{item.title}</h2>
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 block truncate text-[11px] font-semibold text-primary hover:underline"
                      >
                        {item.source} ↗
                      </a>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {statusLabel}
                  </span>
                </div>

                <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-2 border-t border-border/60 pt-3 text-[11px] leading-relaxed">
                  <dt className="font-medium text-muted">{copy.coverage}</dt>
                  <dd className="font-semibold text-foreground">{item.coverage}</dd>
                  <dt className="font-medium text-muted">{copy.unit}</dt>
                  <dd className="font-semibold text-foreground">{item.unit}</dd>
                  <dt className="font-medium text-muted">{copy.period}</dt>
                  <dd className="font-semibold text-foreground">{item.period ?? `— ${copy.unavailable}`}</dd>
                  <dt className="font-medium text-muted">{copy.updated}</dt>
                  <dd className="font-semibold text-foreground">{item.updatedAt ?? `— ${copy.unavailable}`}</dd>
                  <dt className="font-medium text-muted">{copy.method}</dt>
                  <dd className="font-medium text-foreground">{item.method}</dd>
                </dl>

                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto inline-flex items-center justify-center rounded-xl border border-border bg-surface/55 px-3 py-2 text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {copy.open} ↗
                </a>
              </article>
            )
          })}
        </section>

        <aside className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <h2 className="text-sm font-bold text-foreground">{copy.noteTitle}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">{copy.note}</p>
        </aside>
      </div>
    </div>
  )
}
