// Helper utilities for Luma frontend

export const isDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const getStoredTheme = (): 'light' | 'dark' | 'system' | null => {
  if (typeof window === 'undefined') return null
  const savedTheme = localStorage.getItem('luma-theme')

  if (
    savedTheme === 'light' ||
    savedTheme === 'dark' ||
    savedTheme === 'system'
  ) {
    return savedTheme
  }

  return null
}

export const setStoredTheme = (theme: 'light' | 'dark' | 'system') => {
  if (typeof window === 'undefined') return
  localStorage.setItem('luma-theme', theme)
}