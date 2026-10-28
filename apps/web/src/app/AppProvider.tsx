import type { ReactNode } from 'react'

import { ThemeProvider } from '../context/ThemeContext'
import { I18nProvider } from '../i18n/I18nProvider'

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  )
}
