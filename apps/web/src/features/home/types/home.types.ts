export type HomeStatus = 'ready' | 'loading' | 'error'

export interface HomeTranslations {
  name: string
  tagline: string
  title: string
  description: string
  status: HomeStatus
}