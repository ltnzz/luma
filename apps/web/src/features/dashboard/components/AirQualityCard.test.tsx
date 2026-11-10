import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { I18nProvider } from '../../../i18n/I18nProvider'
import { AirQualityCard } from './AirQualityCard'

describe('AirQualityCard tooltip', () => {
  beforeEach(() => {
    window.localStorage.setItem('luma-language', 'id')
  })

  it('mengunci tooltip status real-time ke sisi kanan card', () => {
    render(
      <I18nProvider>
        <AirQualityCard airAqi={78} isAirLive status="success" />
      </I18nProvider>,
    )

    const liveBadge = screen.getByText('Real-time', { selector: '[data-tooltip]' })
    expect(liveBadge).toHaveAttribute('data-tooltip', 'Data kualitas udara diperbarui secara real-time')
    expect(liveBadge).toHaveAttribute('data-tooltip-align', 'right')
    expect(liveBadge).toHaveAttribute('data-tooltip-side', 'bottom')
  })
})
