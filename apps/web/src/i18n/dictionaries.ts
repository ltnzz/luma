export type Language = 'id' | 'en'

const id = {
  'app.name': 'Luma',
  'app.tagline': 'Pemetaan dan analisis perkotaan',
  'common.language': 'Bahasa',
  'common.theme': 'Tema',
  'common.loading': 'Memuat...',
  'common.error': 'Terjadi kesalahan',
  'theme.light': 'Terang',
  'theme.dark': 'Gelap',
  'theme.system': 'Sesuai sistem',
  'home.title': 'Pahami kotamu lebih baik',
  'home.description': 'Jelajahi data dan insight wilayah DKI Jakarta.',
  'home.status': 'Fondasi frontend siap',
} as const

export type TranslationKey = keyof typeof id

const en: Record<TranslationKey, string> = {
  'app.name': 'Luma',
  'app.tagline': 'Local urban mapping and analytics',
  'common.language': 'Language',
  'common.theme': 'Theme',
  'common.loading': 'Loading...',
  'common.error': 'Something went wrong',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.system': 'System',
  'home.title': 'Understand your city better',
  'home.description': 'Explore regional data and insights across DKI Jakarta.',
  'home.status': 'Frontend foundation is ready',
}

export const DEFAULT_LANGUAGE: Language = 'id'

export const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  id,
  en,
}
