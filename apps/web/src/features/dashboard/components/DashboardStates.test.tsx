import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { EmptyState } from '../../../components/ui/EmptyState'
import { I18nProvider } from '../../../i18n/I18nProvider'
import { ContextualCategoryFilterCard } from './ContextualCategoryFilterCard'

describe('dashboard data states', () => {
  it('menampilkan empty state tanpa mengubah nilai kosong menjadi nol', () => {
    render(<EmptyState title="Belum ada fasilitas" description="Ubah filter atau wilayah." />)
    expect(screen.getByText('Belum ada fasilitas')).toBeInTheDocument()
    expect(screen.getByText('Ubah filter atau wilayah.')).toBeInTheDocument()
  })

  it('meneruskan pilihan subfilter sekolah', () => {
    const onFilterChange = vi.fn()
    render(
      <I18nProvider>
        <ContextualCategoryFilterCard
          category="sekolah"
          schoolFilter="all"
          onSchoolFilterChange={onFilterChange}
          schoolCounts={{ total: 205, sma: 28, smp: 45, sd: 132 }}
          onClose={vi.fn()}
        />
      </I18nProvider>,
    )

    const smpFilter = screen.getByRole('button', { name: 'SMP (45)' })
    expect(smpFilter).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(smpFilter)
    expect(onFilterChange).toHaveBeenCalledWith('smp')
  })
})
