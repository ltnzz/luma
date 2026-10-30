import { useEffect, useRef, useState } from 'react'
import { Map, NavigationControl, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export type MapMode = 'default' | 'satellite'

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
}

const DEFAULT_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

interface InteractiveMapProps {
  initialCenter?: [number, number] // [lng, lat]
  initialZoom?: number
  height?: string
  className?: string
}

export function InteractiveMap({
  initialCenter = [106.8456, -6.2088], // Jakarta Pusat
  initialZoom = 11,
  height = '420px',
  className = '',
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const [mapMode, setMapMode] = useState<MapMode>('default')
  const [isLoaded, setIsLoaded] = useState(false)

  // Inisialisasi Peta
  useEffect(() => {
    if (!mapContainerRef.current) return

    const map = new Map({
      container: mapContainerRef.current,
      style: DEFAULT_STYLE,
      center: initialCenter,
      zoom: initialZoom,
    })

    // Kontrol navigasi (zoom in/out, kompas)
    map.addControl(new NavigationControl({ showCompass: true }), 'top-left')

    map.on('load', () => {
      setIsLoaded(true)
    })

    mapRef.current = map

    // Resize observer agar peta selalu menyesuaikan ukuran container
    const resizeObserver = new ResizeObserver(() => {
      map.resize()
    })
    resizeObserver.observe(mapContainerRef.current)

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [initialCenter, initialZoom])

  // Ganti Style (Default vs Satelit)
  const switchMode = (mode: MapMode) => {
    if (!mapRef.current || mode === mapMode) return
    setMapMode(mode)

    if (mode === 'satellite') {
      mapRef.current.setStyle(SATELLITE_STYLE)
    } else {
      mapRef.current.setStyle(DEFAULT_STYLE)
    }
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-border shadow-sm ${className}`}>
      {/* Kontainer Peta */}
      <div ref={mapContainerRef} style={{ height }} className="w-full bg-surface-muted" />

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/60 backdrop-blur-xs">
          <span className="text-xs font-medium text-muted">Memuat peta...</span>
        </div>
      )}

      {/* Floating Mode Toggle (Default vs Satelit) */}
      <div className="absolute top-3 right-3 z-10 flex items-center rounded-lg border border-border/80 bg-surface/90 p-1 shadow-md backdrop-blur-md">
        <button
          type="button"
          onClick={() => switchMode('default')}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            mapMode === 'default'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <span>🗺️</span>
          <span>Default</span>
        </button>
        <button
          type="button"
          onClick={() => switchMode('satellite')}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            mapMode === 'satellite'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <span>🛰️</span>
          <span>Satelit</span>
        </button>
      </div>
    </div>
  )
}
