// Application-wide type definitions

export interface TranslationKeys {
  app: {
    name: string
    tagline: string
  }
  common: {
    language: string
    theme: string
    loading: string
    error: string
  }
  theme: {
    light: string
    dark: string
    system: string
  }
  home: {
    title: string
    description: string
    status: string
  }
}

export interface ThemeConfig {
  default: 'light' | 'dark' | 'system'
  storageKey: string
  prefersColorScheme: 'light' | 'dark' | 'no-preference'
}