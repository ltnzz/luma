import { useEffect, useState, type ReactNode } from 'react'

import { DEFAULT_LANGUAGE, dictionaries, type Language } from './dictionaries'
import { I18nContext } from './i18n-context'

const LANGUAGE_STORAGE_KEY = 'luma-language'

function getInitialLanguage(): Language {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (savedLanguage === 'id' || savedLanguage === 'en') {
    return savedLanguage
  }
  return DEFAULT_LANGUAGE
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage)

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }, [language])

  const value = {
    language,
    setLanguage,
    t: (key: keyof typeof dictionaries.id) => dictionaries[language][key],
  }

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  )
}
