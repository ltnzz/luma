import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { getApiHealth, requestApiRetry } = vi.hoisted(() => ({
  getApiHealth: vi.fn(),
  requestApiRetry: vi.fn(),
}))

vi.mock('../lib/api-client', () => ({
  API_CONNECTION_EVENT: 'luma:api-connection',
  getApiHealth,
  requestApiRetry,
}))

import { useNetworkStatus } from './useNetworkStatus'

describe('useNetworkStatus', () => {
  afterEach(() => {
    vi.useRealTimers()
    getApiHealth.mockReset()
    requestApiRetry.mockReset()
  })

  it('menampilkan gangguan server, memulihkan koneksi, lalu menutup notifikasi', async () => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    getApiHealth.mockResolvedValue({ status: 'ok' })

    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      window.dispatchEvent(
        new CustomEvent('luma:api-connection', { detail: { state: 'unavailable' } }),
      )
    })
    expect(result.current.status).toBe('server-unreachable')
    expect(result.current.isVisible).toBe(true)

    await act(async () => {
      await result.current.retry()
    })
    expect(getApiHealth).toHaveBeenCalledOnce()
    expect(requestApiRetry).toHaveBeenCalledOnce()
    expect(result.current.status).toBe('recovered')

    act(() => vi.advanceTimersByTime(3_500))
    expect(result.current.status).toBe('online')
    expect(result.current.isVisible).toBe(false)
  })

  it('membedakan perangkat offline tanpa mencoba menghubungi API', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })

    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current.status).toBe('offline')

    await act(async () => {
      await result.current.retry()
    })

    expect(result.current.status).toBe('offline')
    expect(getApiHealth).not.toHaveBeenCalled()
  })
})
