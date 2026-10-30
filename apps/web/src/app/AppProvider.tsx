import type { ReactNode } from 'react'

import { ThemeProvider } from '../context/ThemeContext'
import { I18nProvider } from '../i18n/I18nProvider'
import { ConnectionSnackbar } from '../components/ConnectionSnackbar'

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        {children}
        <ConnectionSnackbar />
      </I18nProvider>
    </ThemeProvider>
  )
}
