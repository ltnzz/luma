import { useTranslation } from '../../i18n/useTranslation'

export function HomePage() {
  const { t } = useTranslation()

  return (
    <section className="rounded-xl border border-border bg-surface p-8 shadow-sm sm:p-12">
      <span className="inline-flex rounded-full bg-surface-muted px-3 py-1 text-sm font-medium text-primary">
        {t('home.status')}
      </span>

      <h2 className="mt-6 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
        {t('home.title')}
      </h2>

      <p className="mt-4 max-w-2xl text-muted">
        {t('home.description')}
      </p>
    </section>
  )
}

export { StatusBadge } from './components/StatusBadge'