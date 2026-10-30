import { useTranslation } from '../i18n/useTranslation'
import { useTheme, type ThemeMode } from '../context/useTheme'

export default function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  const options: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: t('theme.light') },
    { value: 'dark', label: t('theme.dark') },
    { value: 'system', label: t('theme.system') },
  ]

  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="text-muted">{t('common.theme')}</span>

      <select
        aria-label={t('common.theme')}
        className="rounded-md border border-border bg-surface px-3 py-2 text-foreground"
        value={theme}
        onChange={(event) => setTheme(event.target.value as ThemeMode)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}