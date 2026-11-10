import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '../../../i18n/I18nProvider'
import type { Facility } from '../../../lib/api'
import { FacilityDetailModal } from './FacilityDetailModal'

const facility: Facility = {
  id: 'school-1',
  slug: 'smp-negeri-13',
  name: 'SMP Negeri 13',
  category: 'pendidikan',
  subCategory: 'SMP Negeri',
  wilayah: 'Jakarta Selatan',
  kecamatan: 'Kebayoran Baru',
  address: 'Jl. Tirtayasa Raya Blok O/1',
  lat: -6.2428,
  lng: 106.8068,
  specs: { 'Ruang kelas': '18', Akreditasi: 'A' },
  budget: {
    total: 'Rp4.800.000.000',
    source: 'APBD DKI Jakarta',
    year: '2024',
  },
  metrics: { aqi: 78, walkability: '4.8 / 5.0', transitAccess: '300 m' },
  documents: [{ title: 'Laporan realisasi', size: '1,2 MB', fileUrl: '/laporan.pdf' }],
  updatedAt: '2026-11-09T00:00:00.000Z',
}

describe('FacilityDetailModal', () => {
  beforeEach(() => {
    window.localStorage.setItem('luma-language', 'id')
  })

  it('menampilkan hero, tautan koordinat, dan navigasi tab', () => {
    render(
      <I18nProvider>
        <FacilityDetailModal
          facility={facility}
          isOpen
          variant="side-glass"
          onClose={vi.fn()}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole('heading', { name: 'SMP Negeri 13' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Ringkasan' })).toHaveAttribute('aria-selected', 'true')

    expect(screen.getByRole('link', { name: /Buka di Google Maps: GPS:/ })).toHaveAttribute(
      'href',
      expect.stringContaining('google.com/maps/search'),
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Fasilitas' }))
    expect(screen.getByText('Ruang kelas')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Anggaran' }))
    expect(screen.getByText('Rp4.800.000.000')).toBeInTheDocument()
    expect(screen.getByText('Laporan realisasi')).toBeInTheDocument()
  })
})
