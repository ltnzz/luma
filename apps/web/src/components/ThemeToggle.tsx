import { useEffect, useState } from 'react'

import { useTheme } from '../context/useTheme'
import { useTranslation } from '../i18n/useTranslation'

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Dark/light pill toggle per the Figma navbar ("Dark mode" / "Light mode").
 * Shows the action for the opposite mode; the first click resolves a
 * 'system' theme to an explicit one. ThemeProvider's 'system' support is
 * preserved as the stored default.
 */
export default function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const resolvedDark = theme === 'dark' || (theme === 'system' && systemPrefersDark)

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedDark ? 'light' : 'dark')}
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-muted"
    >
      {resolvedDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
      {resolvedDark ? t('theme.toLight') : t('theme.toDark')}
      <span className="sr-only">{t('theme.toggleA11y')}</span>
    </button>
  )
}
