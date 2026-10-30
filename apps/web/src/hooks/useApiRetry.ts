import { useEffect } from 'react'

import { API_RETRY_EVENT } from '../lib/api-client'

export function useApiRetry(callback: () => void): void {
  useEffect(() => {
    window.addEventListener(API_RETRY_EVENT, callback)
    return () => window.removeEventListener(API_RETRY_EVENT, callback)
  }, [callback])
}
