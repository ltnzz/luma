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
  /** Optional data-tour marker for the onboarding spotlight. */
  dataTour?: string
}

/**
 * Compact icon-only ThemeToggle with optional text label support.
 */
export default function ThemeToggle({ showLabel = false, className = '', dataTour }: ThemeToggleProps) {
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
      className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border/80 bg-surface text-foreground shadow-2xs transition-[background-color,border-color,color,transform,box-shadow] duration-200 hover:-translate-y-px hover:bg-surface-muted hover:shadow-sm active:translate-y-0 active:scale-95 ${className}`}
      aria-label={resolvedDark ? t('theme.light') : t('theme.dark')}
      data-tooltip={resolvedDark ? t('theme.light') : t('theme.dark')}
      data-tooltip-side="bottom"
      data-tour={dataTour}
    >
      <span key={resolvedDark ? 'light' : 'dark'} className="luma-switch-pop inline-flex">
        {resolvedDark ? (
          <SunIcon className="h-4 w-4 text-foreground" />
        ) : (
          <MoonIcon className="h-4 w-4 text-foreground" />
        )}
      </span>
      {showLabel ? (
        <span className="text-xs font-medium ml-1.5">{resolvedDark ? t('theme.light') : t('theme.dark')}</span>
      ) : null}
    </button>
  )
}
