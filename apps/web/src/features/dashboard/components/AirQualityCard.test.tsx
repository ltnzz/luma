import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { I18nProvider } from '../../../i18n/I18nProvider'
import { AirQualityCard } from './AirQualityCard'

describe('AirQualityCard tooltip', () => {
  beforeEach(() => {
    window.localStorage.setItem('luma-language', 'id')
  })

  it('mengunci tooltip status pembaruan berkala ke sisi kanan card', () => {
    render(
      <I18nProvider>
        <AirQualityCard airAqi={78} isAirLive status="success" />
      </I18nProvider>,
    )

    const liveBadge = screen.getByText((_, element) => element?.tagName.toLowerCase() === 'span' && element.hasAttribute('data-tooltip'))
    expect(liveBadge).toHaveAttribute('data-tooltip', 'Diperbarui berkala mengikuti model atmosfer, cache 15 menit')
    expect(liveBadge).toHaveAttribute('data-tooltip-align', 'right')
    expect(liveBadge).toHaveAttribute('data-tooltip-side', 'bottom')
  })
})
