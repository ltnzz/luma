import { useEffect, useState, type ReactNode } from 'react'
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

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = () => {
      const resolvedTheme =
        theme === 'system'
          ? mediaQuery.matches
            ? 'dark'
            : 'light'
          : theme

      document.documentElement.dataset.theme = resolvedTheme
    }

    applyTheme()

    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme)
    }

    return () => {
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