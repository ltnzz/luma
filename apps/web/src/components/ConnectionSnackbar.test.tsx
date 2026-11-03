import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { I18nContext } from '../i18n/i18n-context'
import { dictionaries, type Language, type TranslationKey } from '../i18n/dictionaries'

const retry = vi.fn()

vi.mock('../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    status: 'offline',
    isVisible: true,
    retry,
  }),
}))

import { ConnectionSnackbar } from './ConnectionSnackbar'

function renderSnackbar(language: Language) {
  return render(
    <I18nContext.Provider
      value={{
        language,
        setLanguage: vi.fn(),
        t: (key: TranslationKey) => dictionaries[language][key],
      }}
    >
      <ConnectionSnackbar />
    </I18nContext.Provider>,
  )
}

describe('ConnectionSnackbar', () => {
  it('menampilkan copy Indonesia dan menjalankan Retry', () => {
    renderSnackbar('id')
    expect(screen.getByRole('alert')).toHaveTextContent('Koneksi internet terputus')
    fireEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it('menampilkan copy Inggris saat bahasa EN aktif', () => {
    renderSnackbar('en')
    expect(screen.getByRole('alert')).toHaveTextContent('Internet connection lost')
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})
