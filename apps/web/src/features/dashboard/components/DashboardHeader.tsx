import { useTranslation } from '../../../i18n/useTranslation'
import type { Language } from '../../../i18n/dictionaries'
import ThemeToggle from '../../../components/ThemeToggle'

interface DashboardHeaderProps {
  /** Scope label for the navbar chip, e.g. "Cakupan: DKI Jakarta". */
  scopeLabel: string
}

/**
 * Top navbar from the Figma design: brand mark + wordmark + tagline on the
 * left; scope chip, language switcher and dark/light pill on the right.
 */
export function DashboardHeader({ scopeLabel }: DashboardHeaderProps) {
  const { t, language, setLanguage } = useTranslation()

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-on-primary"
        >
          L
        </span>
        <div className="leading-tight">
          <p className="text-base font-bold text-foreground">{t('app.name')}</p>
          <p className="text-xs text-muted">{t('app.tagline')}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground">
          {scopeLabel}
        </span>

        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">{t('common.language')}</span>
          <select
            aria-label={t('common.language')}
            className="cursor-pointer rounded-full border border-border bg-surface px-3 py-2 text-xs text-foreground"
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
          >
            <option value="id">{t('common.languageIndonesian')}</option>
            <option value="en">{t('common.languageEnglish')}</option>
          </select>
        </label>

        <ThemeToggle />
      </div>
    </header>
  )
}
