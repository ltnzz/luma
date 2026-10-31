import { useEffect, useState } from 'react'

export interface RealtimeAirQuality {
  aqi: number
  pm25: number
  pm10: number
  category: string
  stationName: string
  updatedAt: string
  source: string
}

export const WILAYAH_COORDINATES: Record<string, { lat: number; lng: number; stationName: string }> = {
  ALL: { lat: -6.2088, lng: 106.8456, stationName: '5 SPKU Terkoneksi' },
  'JAKARTA PUSAT': { lat: -6.1805, lng: 106.8341, stationName: 'SPKU Thamrin / Monas' },
  'JAKARTA SELATAN': { lat: -6.2615, lng: 106.8097, stationName: 'SPKU Jagakarsa' },
  'JAKARTA BARAT': { lat: -6.1683, lng: 106.7589, stationName: 'SPKU Kebon Jeruk' },
  'JAKARTA UTARA': { lat: -6.1214, lng: 106.8926, stationName: 'SPKU Cilincing & Kelapa Gading' },
  'JAKARTA TIMUR': { lat: -6.225, lng: 106.9004, stationName: 'SPKU Lubang Buaya' },
  'KEP. SERIBU': { lat: -5.6122, lng: 106.5615, stationName: 'SPKU Maritim Kepulauan' },
}

export function getAqiCategory(aqi: number): string {
  if (aqi <= 50) return 'Baik'
  if (aqi <= 100) return 'Sedang'
  if (aqi <= 150) return 'Tidak Sehat (Sensitif)'
  if (aqi <= 200) return 'Tidak Sehat'
  if (aqi <= 300) return 'Sangat Tidak Sehat'
  return 'Berbahaya'
}

interface CacheEntry {
  data: RealtimeAirQuality
  timestamp: number
}

const memoryCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 menit

async function fetchAirQuality(targetKey: string, signal: AbortSignal): Promise<RealtimeAirQuality> {
  const cached = memoryCache.get(targetKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  const coord = WILAYAH_COORDINATES[targetKey]
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coord.lat}&longitude=${coord.lng}&current=us_aqi,pm2_5,pm10`

  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const current = json?.current
  if (!current || typeof current.us_aqi !== 'number') {
    throw new Error('Invalid payload')
  }

  const aqi = Math.round(current.us_aqi)
  const pm25 = typeof current.pm2_5 === 'number' ? Math.round(current.pm2_5 * 10) / 10 : 0
  const pm10 = typeof current.pm10 === 'number' ? Math.round(current.pm10 * 10) / 10 : 0
  const category = getAqiCategory(aqi)

  const timeObj = current.time ? new Date(current.time) : new Date()
  const timeStr = !Number.isNaN(timeObj.getTime())
    ? timeObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    : 'Terkini'

  const result: RealtimeAirQuality = {
    aqi,
    pm25,
    pm10,
    category,
    stationName: coord.stationName,
    updatedAt: timeStr,
    source: 'Open-Meteo Real-time',
  }

  memoryCache.set(targetKey, { data: result, timestamp: Date.now() })
  return result
}

export function useRealtimeAirQuality(wilayah: string = 'ALL') {
  const [data, setData] = useState<RealtimeAirQuality | null>(() => {
    const targetKey = WILAYAH_COORDINATES[wilayah] ? wilayah : 'ALL'
    const cached = memoryCache.get(targetKey)
    return cached && Date.now() - cached.timestamp < CACHE_TTL_MS ? cached.data : null
  })
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [isLive, setIsLive] = useState<boolean>(() => {
    const targetKey = WILAYAH_COORDINATES[wilayah] ? wilayah : 'ALL'
    const cached = memoryCache.get(targetKey)
    return Boolean(cached && Date.now() - cached.timestamp < CACHE_TTL_MS)
  })

  useEffect(() => {
    const targetKey = WILAYAH_COORDINATES[wilayah] ? wilayah : 'ALL'
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    fetchAirQuality(targetKey, controller.signal)
      .then((result) => {
        setData(result)
        setStatus('success')
        setIsLive(true)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        console.warn('[useRealtimeAirQuality] Fetch fallback to static baseline:', err)
        setStatus('error')
        setIsLive(false)
      })
      .finally(() => {
        clearTimeout(timeoutId)
      })

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [wilayah])

  return {
    data,
    status,
    isLive,
  }
}
