import { useTranslation } from './i18n/useTranslation'
import type { Language } from './i18n/dictionaries'
import ThemeToggle from './components/ThemeToggle'
import { HomePage, StatusBadge } from './features/home/page'
import { AppLayout } from './components/layout/AppLayout'

export default function App() {
  const { t, language, setLanguage } = useTranslation()

  return (
    <AppLayout>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('app.name')}</h1>
          <p className="text-sm text-muted">{t('app.tagline')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <ThemeToggle />

          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">{t('common.language')}</span>
            <select
              aria-label={t('common.language')}
              className="rounded-md border border-border bg-surface px-3 py-2 text-foreground"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as Language)
              }
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
      </header>

      <section className="p-8 bg-surface/50 rounded-xl border border-border sm:p-12">
        <StatusBadge />

        <h2 className="mt-6 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          {t('home.title')}
        </h2>

        <p className="mt-4 max-w-2xl text-muted">
          {t('home.description')}
        </p>

        <HomePage />
      </section>
    </AppLayout>
  )
}