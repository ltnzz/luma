import { useEffect, useState } from 'react'

import { useTheme } from '../context/useTheme'
import { useTranslation } from '../i18n/useTranslation'

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" strokeLinecap="round" strokeLinejoin="round" />
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

interface ThemeToggleProps {
  showLabel?: boolean
  className?: string
}

/**
 * Compact icon-only ThemeToggle with optional text label support.
 */
export default function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
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
      className={`inline-flex cursor-pointer items-center justify-center rounded-xl border border-border bg-surface p-2 text-foreground transition-colors hover:bg-surface-muted shadow-2xs ${className}`}
      title={resolvedDark ? t('theme.light') : t('theme.dark')}
      aria-label={resolvedDark ? t('theme.light') : t('theme.dark')}
    >
      {resolvedDark ? (
        <SunIcon className="h-4 w-4 text-foreground" />
      ) : (
        <MoonIcon className="h-4 w-4 text-foreground" />
      )}
      {showLabel ? (
        <span className="text-xs font-medium ml-1.5">{resolvedDark ? t('theme.light') : t('theme.dark')}</span>
      ) : null}
    </button>
  )
}
