import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ThemeContext, type ThemeMode } from './theme-context'

const STORAGE_KEY = 'luma-theme'

function getInitialTheme(): ThemeMode {
  const savedTheme = localStorage.getItem(STORAGE_KEY)

  if (
    savedTheme === 'light' ||
    savedTheme === 'dark' ||
    savedTheme === 'system'
  ) {
    return savedTheme
  }

  return 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)
  const hasAppliedInitialTheme = useRef(false)

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    let transitionTimer: number | undefined

    const applyTheme = () => {
      const resolvedTheme =
        theme === 'system'
          ? mediaQuery.matches
            ? 'dark'
            : 'light'
          : theme

      const root = document.documentElement
      if (hasAppliedInitialTheme.current) {
        root.classList.add('luma-theme-transition')
        window.clearTimeout(transitionTimer)
        transitionTimer = window.setTimeout(() => {
          root.classList.remove('luma-theme-transition')
        }, 280)
      }

      root.dataset.theme = resolvedTheme
      root.style.colorScheme = resolvedTheme
      hasAppliedInitialTheme.current = true
    }

    applyTheme()

    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme)
    }

    return () => {
      window.clearTimeout(transitionTimer)
      mediaQuery.removeEventListener('change', applyTheme)
    }
  }, [theme])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
