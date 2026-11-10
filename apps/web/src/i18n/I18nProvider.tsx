import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { DEFAULT_LANGUAGE, dictionaries, type Language } from './dictionaries'
import { I18nContext } from './i18n-context'

const STORAGE_KEY = 'luma-language'

function getInitialLanguage(): Language {
  const savedLanguage = window.localStorage.getItem(STORAGE_KEY)
  return savedLanguage === 'id' || savedLanguage === 'en'
    ? savedLanguage
    : DEFAULT_LANGUAGE
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const hasAppliedInitialLanguage = useRef(false)

  useLayoutEffect(() => {
    const root = document.documentElement
    document.documentElement.lang = language
    if (!hasAppliedInitialLanguage.current) {
      hasAppliedInitialLanguage.current = true
      return
    }

    root.classList.remove('luma-language-transition')
    void root.offsetWidth
    root.classList.add('luma-language-transition')

    const timer = window.setTimeout(() => {
      root.classList.remove('luma-language-transition')
    }, 220)

    return () => {
      window.clearTimeout(timer)
      root.classList.remove('luma-language-transition')
    }
  }, [language])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language)
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: keyof typeof dictionaries.id) => dictionaries[language][key],
    }),
    [language],
  )

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  )
}
