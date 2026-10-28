import { createContext } from 'react'

import type { Language, TranslationKey } from './dictionaries'

export type TranslateFunction = (key: TranslationKey) => string

interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: TranslateFunction
}

export const I18nContext = createContext<I18nContextValue | undefined>(
  undefined,
)
