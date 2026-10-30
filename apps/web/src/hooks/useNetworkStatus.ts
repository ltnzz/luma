import { useCallback, useEffect, useState } from 'react'

import {
  API_CONNECTION_EVENT,
  getApiHealth,
  requestApiRetry,
  type ApiConnectionState,
} from '../lib/api-client'

export type NetworkStatus = 'online' | 'offline' | 'server-unreachable' | 'checking' | 'recovered'

type ConnectionEvent = CustomEvent<{ state: ApiConnectionState }>

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>(() =>
    navigator.onLine ? 'online' : 'offline',
  )

  const retry = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus('offline')
      return
    }

    setStatus('checking')
    try {
      await getApiHealth()
      setStatus('recovered')
      requestApiRetry()
    } catch {
      setStatus('server-unreachable')
    }
  }, [])

  useEffect(() => {
    const handleOffline = () => setStatus('offline')
    const handleOnline = () => void retry()
    const handleApiConnection = (event: Event) => {
      const { state } = (event as ConnectionEvent).detail
      if (state === 'unavailable') {
        setStatus(navigator.onLine ? 'server-unreachable' : 'offline')
        return
      }

      setStatus((previous) => {
        if (previous === 'recovered') return previous
        if (previous === 'offline' || previous === 'server-unreachable' || previous === 'checking') {
          return 'recovered'
        }
        return 'online'
      })
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    window.addEventListener(API_CONNECTION_EVENT, handleApiConnection)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener(API_CONNECTION_EVENT, handleApiConnection)
    }
  }, [retry])

  useEffect(() => {
    if (status !== 'recovered') return
    const timeoutId = window.setTimeout(() => setStatus('online'), 3_500)
    return () => window.clearTimeout(timeoutId)
  }, [status])

  return {
    status,
    isVisible: status !== 'online',
    retry,
  }
}
