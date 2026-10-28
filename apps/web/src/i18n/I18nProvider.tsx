import { useState, type ReactNode } from 'react'

import { DEFAULT_LANGUAGE, dictionaries, type Language } from './dictionaries'
import { I18nContext } from './i18n-context'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE)

  const value = {
    language,
    setLanguage,
    t: (key: keyof typeof dictionaries.id) => dictionaries[language][key],
  }

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  )
}
