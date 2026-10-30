import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Map as MapLibreMap,
  Marker,
  Popup,
  setWorkerUrl,
  type StyleSpecification,
  type GeoJSONSourceSpecification,
  type FilterSpecification,
  type ExpressionSpecification,
  type MapLayerMouseEvent,
} from 'maplibre-gl'
import maplibreglWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import type { Facility } from '../../lib/api'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Skeleton } from './Skeleton'
import { TargetIcon, SunIcon, MoonIcon, SatelliteIcon } from './Icons'
import jakartaBoundary from '../../data/jakarta-boundary.json'
import jakartaSubdistricts from '../../data/jakarta-subdistricts-boundary.json'
import transitNetwork from '../../data/transit-network.json'
import { CITY_AGGREGATES } from '../../data/city-aggregates'
import { TRANSJAKARTA_CORRIDORS } from '../../data/transit-corridors'

// Konfigurasi Worker MapLibre GL untuk lingkungan Vite (mencegah error Worker 404)
setWorkerUrl(maplibreglWorkerUrl)

type GeoJSONData = GeoJSONSourceSpecification['data']

export type MapMode = 'light' | 'dark' | 'satellite'

// Clean Minimalist Light Gray Canvas (Esri World Light Gray Base + Reference Halus)
const LIGHT_CANVAS_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'esri-light-base': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
    },
    'esri-light-ref': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: 'esri-light-base-layer',
      type: 'raster',
      source: 'esri-light-base',
      minzoom: 0,
      maxzoom: 18,
    },
    {
      id: 'esri-light-ref-layer',
      type: 'raster',
      source: 'esri-light-ref',
      minzoom: 0,
      maxzoom: 18,
    },
  ],
}

// Clean Minimalist Dark Gray Canvas (Esri World Dark Gray Base + Reference Halus)
const DARK_CANVAS_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'esri-dark-base': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
    },
    'esri-dark-ref': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: 'esri-dark-base-layer',
      type: 'raster',
      source: 'esri-dark-base',
      minzoom: 0,
      maxzoom: 18,
    },
    {
      id: 'esri-dark-ref-layer',
      type: 'raster',
      source: 'esri-dark-ref',
      minzoom: 0,
      maxzoom: 18,
    },
  ],
}

// Citra Satelit Beresolusi Tinggi (Esri World Imagery)
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

const JAKARTA_CENTER: [number, number] = [106.8272, -6.185]

interface InteractiveMapProps {
  initialCenter?: [number, number] // [lng, lat]
  initialZoom?: number
  minZoom?: number
  maxZoom?: number
  maxBounds?: [[number, number], [number, number]]
  height?: string
  className?: string
  facilities?: Facility[]
  selectedFacilityId?: string | null
  onSelectFacility?: (facility: Facility) => void
  onFacilitySelect?: (facility: Facility) => void
  onOpenDetail?: (facility: Facility) => void
  focusCoords?: [number, number] | null // [lng, lat] to fly to
  focusZoom?: number | null
  showTransit?: boolean
  activeTransitModes?: string[]
  selectedWilayah?: string
  onSelectWilayah?: (wilayah: string) => void
  focusedCorridorId?: string | null
  onSelectCorridor?: (corridorId: string | null) => void
}

interface MarkerEntry {
  marker: Marker
  innerEl: HTMLDivElement
  popup: Popup
}

// Helper untuk menambahkan garis batas tebal (bold boundary) DKI Jakarta
function applyJakartaBoundary(map: MapLibreMap, mode: MapMode) {
  try {
    const boundaryColor = mode === 'dark' ? '#22c55e' : (mode === 'satellite' ? '#4ade80' : '#16a34a')
    const glowColor = mode === 'dark' ? '#143120' : '#dcfce7'

    // 1. Source Batas Provinsi DKI Jakarta
    if (!map.getSource('jakarta-province-boundary')) {
      map.addSource('jakarta-province-boundary', {
        type: 'geojson',
        data: jakartaBoundary as unknown as GeoJSONData,
      })
    }

    // 2. Fill Transparan di dalam batas DKI Jakarta (area Jakarta terlihat kontras & tegas)
    if (!map.getLayer('jakarta-province-fill')) {
      map.addLayer({
        id: 'jakarta-province-fill',
        type: 'fill',
        source: 'jakarta-province-boundary',
        paint: {
          'fill-color': boundaryColor,
          'fill-opacity': mode === 'satellite' ? 0.04 : 0.035,
        },
      })
    }

    // 3. Garis Luar BOLD (Outer Glow & Bold Stroke)
    if (!map.getLayer('jakarta-province-glow')) {
      map.addLayer({
        id: 'jakarta-province-glow',
        type: 'line',
        source: 'jakarta-province-boundary',
        paint: {
          'line-color': glowColor,
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 5,
            14, 9,
          ],
          'line-opacity': 0.65,
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
      })
    }

    if (!map.getLayer('jakarta-province-line')) {
      map.addLayer({
        id: 'jakarta-province-line',
        type: 'line',
        source: 'jakarta-province-boundary',
        paint: {
          'line-color': boundaryColor,
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 2.5,
            14, 4.5,
          ],
          'line-opacity': 0.95,
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
      })
    }

    // 4. Garis Batas Antar-Wilayah Kota Administrasi (Dashed lembut di dalam Jakarta)
    if (!map.getSource('jakarta-subdistricts-boundary')) {
      map.addSource('jakarta-subdistricts-boundary', {
        type: 'geojson',
        data: jakartaSubdistricts as unknown as GeoJSONData,
      })
    }

    // Layer Dimming untuk area di luar kota aktif saat Layer 2 (Per-Kota)
    if (!map.getLayer('jakarta-subdistricts-dim-fill')) {
      map.addLayer({
        id: 'jakarta-subdistricts-dim-fill',
        type: 'fill',
        source: 'jakarta-subdistricts-boundary',
        filter: ['==', 'NAME_2', ''],
        paint: {
          'fill-color': mode === 'dark' ? '#000000' : '#0f172a',
          'fill-opacity': 0.28,
        },
      })
    }

    // Layer Highlight Fill untuk kota yang terpilih saat Layer 2
    if (!map.getLayer('jakarta-subdistricts-focus-fill')) {
      map.addLayer({
        id: 'jakarta-subdistricts-focus-fill',
        type: 'fill',
        source: 'jakarta-subdistricts-boundary',
        filter: ['==', 'NAME_2', ''],
        paint: {
          'fill-color': boundaryColor,
          'fill-opacity': 0.08,
        },
      })
    }

    // Interactive pointer surface for city polygons in Layer 1
    if (!map.getLayer('jakarta-subdistricts-interactive')) {
      map.addLayer({
        id: 'jakarta-subdistricts-interactive',
        type: 'fill',
        source: 'jakarta-subdistricts-boundary',
        paint: {
          'fill-color': '#000000',
          'fill-opacity': 0.001,
        },
      })
    }

    if (!map.getLayer('jakarta-subdistricts-line')) {
      map.addLayer({
        id: 'jakarta-subdistricts-line',
        type: 'line',
        source: 'jakarta-subdistricts-boundary',
        paint: {
          'line-color': boundaryColor,
          'line-width': 1.2,
          'line-dasharray': [3, 2],
          'line-opacity': 0.45,
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
      })
    }

    // Garis Batas Fokus Kota Terpilih (Stroke BOLD & Glow)
    if (!map.getLayer('jakarta-subdistricts-focus-glow')) {
      map.addLayer({
        id: 'jakarta-subdistricts-focus-glow',
        type: 'line',
        source: 'jakarta-subdistricts-boundary',
        filter: ['==', 'NAME_2', ''],
        paint: {
          'line-color': glowColor,
          'line-width': 8,
          'line-opacity': 0.7,
          'line-blur': 3,
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
      })
    }

    if (!map.getLayer('jakarta-subdistricts-focus-line')) {
      map.addLayer({
        id: 'jakarta-subdistricts-focus-line',
        type: 'line',
        source: 'jakarta-subdistricts-boundary',
        filter: ['==', 'NAME_2', ''],
        paint: {
          'line-color': boundaryColor,
          'line-width': 3.5,
          'line-opacity': 1.0,
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
      })
    }
  } catch (err) {
    console.error('[applyJakartaBoundary error]', err)
  }
}

// Helper untuk menambahkan rute dan stasiun trayek transportasi publik (MRT, Transjakarta, LRT)
function applyTransitLayers(map: MapLibreMap) {
  try {
    // 1. Source Rute Trayek
    if (!map.getSource('transit-routes-source')) {
      map.addSource('transit-routes-source', {
        type: 'geojson',
        data: transitNetwork.routes as unknown as GeoJSONData,
      })
    }

    // 2. Glow Jalur Trayek
    if (!map.getLayer('transit-routes-glow')) {
      map.addLayer({
        id: 'transit-routes-glow',
        type: 'line',
        source: 'transit-routes-source',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 3.5,
            14, 7,
          ],
          'line-opacity': 0.35,
          'line-blur': 2,
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
      })
    }

    // 3. Garis Utama Trayek
    if (!map.getLayer('transit-routes-line')) {
      map.addLayer({
        id: 'transit-routes-line',
        type: 'line',
        source: 'transit-routes-source',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 2.5,
            14, 4.5,
          ],
          'line-opacity': 0.95,
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
      })
    }

    // 4. Source Stasiun & Halte
    if (!map.getSource('transit-stations-source')) {
      map.addSource('transit-stations-source', {
        type: 'geojson',
        data: transitNetwork.stations as unknown as GeoJSONData,
      })
    }

    // 5. Circle Simbol Stasiun / Halte Transit
    if (!map.getLayer('transit-stations-circle')) {
      map.addLayer({
        id: 'transit-stations-circle',
        type: 'circle',
        source: 'transit-stations-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 2.5,
            12, 3.5,
            14, 5,
            16, 6.5,
          ],
          'circle-color': '#ffffff',
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 1.5,
            14, 2.5,
          ],
        },
      })
    }
  } catch (err) {
    console.error('[applyTransitLayers error]', err)
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  fasum: '#16a34a', // green
  transum: '#2563eb', // blue
  kesehatan: '#dc2626', // red
  pendidikan: '#7e22ce', // purple
  lingkungan: '#06b6d4', // cyan
}

const CATEGORY_SVGS: Record<string, string> = {
  fasum: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 3-7h-2l3-6-4 1-3-4-3 4-4-1 3 6h-2l3 7"/><path d="M12 19v3"/></svg>',
  transum: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="12" x="3" y="6" rx="2"/><path d="M4 11V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v4"/><circle cx="7" cy="18" r="1"/><circle cx="17" cy="18" r="1"/></svg>',
  kesehatan: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v12"/><path d="M6 12h12"/></svg>',
  pendidikan: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><circle cx="12" cy="10" r="2"/></svg>',
  lingkungan: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>',
}

const DEFAULT_PIN_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>'

export function InteractiveMap({
  initialCenter = JAKARTA_CENTER,
  initialZoom = 11.6,
  minZoom,
  maxZoom = 19,
  maxBounds,
  height = '100%', 
  className = '',
  facilities = [],
  selectedFacilityId,
  onSelectFacility,
  onFacilitySelect,
  onOpenDetail,
  focusCoords,
  focusZoom,
  showTransit = true,
  activeTransitModes = ['mrt', 'transjakarta', 'lrt', 'krl'],
  selectedWilayah = 'ALL',
  onSelectWilayah,
  focusedCorridorId,
  onSelectCorridor,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersMapRef = useRef<Record<string, MarkerEntry>>({})
  const cityMarkersRef = useRef<Record<string, Marker>>({})
  const [mapMode, setMapMode] = useState<MapMode>('light')
  const modeRef = useRef<MapMode>('light')
  const [isLoaded, setIsLoaded] = useState(false)

  const selectedWilayahRef = useRef(selectedWilayah)
  const onSelectWilayahRef = useRef(onSelectWilayah)
  const onSelectCorridorRef = useRef(onSelectCorridor)

  useEffect(() => {
    selectedWilayahRef.current = selectedWilayah
  }, [selectedWilayah])

  useEffect(() => {
    onSelectWilayahRef.current = onSelectWilayah
  }, [onSelectWilayah])

  useEffect(() => {
    onSelectCorridorRef.current = onSelectCorridor
  }, [onSelectCorridor])

  useEffect(() => {
    modeRef.current = mapMode
  }, [mapMode])

  // Inisialisasi Peta
  useEffect(() => {
    if (!mapContainerRef.current) return

    let isDisposed = false

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: LIGHT_CANVAS_STYLE,
      center: initialCenter,
      zoom: initialZoom,
      minZoom,
      maxZoom,
      maxBounds,
      attributionControl: false,
    })

    // Mark as loaded when map triggers 'load' or 'idle'
    const handleLoaded = () => {
      if (!isDisposed) {
        setIsLoaded(true)
        map.resize()
        applyJakartaBoundary(map, modeRef.current)
        applyTransitLayers(map)
      }
    }

    map.on('style.load', () => {
      if (!isDisposed) {
        applyJakartaBoundary(map, modeRef.current)
        applyTransitLayers(map)
      }
    })

    // Interaktivitas klik & hover pada poligon wilayah kota administrasi di Layer 1
    const handleSubdistrictClick = (e: {
      features?: Array<{
        properties?: Record<string, unknown>
      }>
    }) => {
      if (selectedWilayahRef.current && selectedWilayahRef.current !== 'ALL') return
      const name2 = e.features?.[0]?.properties?.NAME_2
      if (name2) {
        const city = CITY_AGGREGATES.find((c) => c.subdistrictName === name2)
        if (city && onSelectWilayahRef.current) {
          onSelectWilayahRef.current(city.code)
        }
      }
    }

    const handleSubdistrictEnter = () => {
      if (!selectedWilayahRef.current || selectedWilayahRef.current === 'ALL') {
        map.getCanvas().style.cursor = 'pointer'
      }
    }

    const handleSubdistrictLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', 'jakarta-subdistricts-interactive', handleSubdistrictClick)
    map.on('mouseenter', 'jakarta-subdistricts-interactive', handleSubdistrictEnter)
    map.on('mouseleave', 'jakarta-subdistricts-interactive', handleSubdistrictLeave)

    // Interaktivitas hover pada stasiun transit
    const stationPopup = new Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
    })

    const handleStationEnter = (e: {
      features?: Array<{
        geometry: { type: string; coordinates: [number, number] }
        properties?: Record<string, unknown>
      }>
    }) => {
      const feature = e.features?.[0]
      if (!feature || !feature.geometry || feature.geometry.type !== 'Point') return
      map.getCanvas().style.cursor = 'pointer'
      const coords = feature.geometry.coordinates.slice() as [number, number]
      const p = feature.properties || {}
      const name = String(p.name || '')
      const line = String(p.line || 'Transjakarta BRT')
      const lokasi = p.lokasi ? String(p.lokasi) : ''
      const tipeAkses = p.tipeAkses ? String(p.tipeAkses) : ''
      const tahun = p.tahunDibangun ? String(p.tahunDibangun) : ''
      const color = String(p.color || '#2563eb')
      const isHub = p.isInterchange === true || p.isInterchange === 'true'
      let interchangeList: string[] = []
      if (p.interchangeWith) {
        try {
          interchangeList =
            typeof p.interchangeWith === 'string'
              ? JSON.parse(p.interchangeWith)
              : (p.interchangeWith as string[])
        } catch {
          interchangeList = [String(p.interchangeWith)]
        }
      }

      const html = `
        <div style="padding: 10px 12px; font-family: 'Plus Jakarta Sans', sans-serif; min-width: 190px; max-width: 270px; color: #1c2620;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 3px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${color}; letter-spacing: 0.05em;">
              ${line}
            </span>
            ${
              isHub
                ? '<span style="font-size: 9px; font-weight: 700; background: #dbeafe; color: #1e40af; padding: 1px 5px; border-radius: 4px;">TRANSFER</span>'
                : ''
            }
          </div>
          <h4 style="margin: 2px 0 4px 0; font-size: 13px; font-weight: 700; line-height: 1.3;">
            ${name}
          </h4>
          ${
            lokasi
              ? `<p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b; line-height: 1.3;">📍 ${lokasi}</p>`
              : ''
          }
          ${
            tipeAkses
              ? `<div style="margin-top: 6px; padding-top: 5px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #334155;">
                   <div><span style="font-weight: 600; color: #0f172a;">Akses:</span> ${tipeAkses}</div>
                   ${tahun ? `<div style="margin-top: 2px;"><span style="font-weight: 600; color: #0f172a;">Tahun:</span> ${tahun}</div>` : ''}
                 </div>`
              : ''
          }
          ${
            interchangeList.length > 0
              ? `<div style="margin-top: 4px; font-size: 10px; color: #16a34a; font-weight: 600;">
                   ${interchangeList.join(' • ')}
                 </div>`
              : ''
          }
        </div>
      `
      stationPopup.setLngLat(coords).setHTML(html).addTo(map)
    }

    const handleStationLeave = () => {
      map.getCanvas().style.cursor = ''
      stationPopup.remove()
    }

    const handleRouteEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const handleRouteLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    const handleRouteClick = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature || !feature.properties) return
      const routeId = String(feature.properties.id || '')
      if (routeId && onSelectCorridorRef.current) {
        onSelectCorridorRef.current(routeId)
      }
    }

    map.on('mouseenter', 'transit-stations-circle', handleStationEnter)
    map.on('mouseleave', 'transit-stations-circle', handleStationLeave)
    map.on('mouseenter', 'transit-routes-line', handleRouteEnter)
    map.on('mouseleave', 'transit-routes-line', handleRouteLeave)
    map.on('click', 'transit-routes-line', handleRouteClick)

    map.once('load', handleLoaded)
    map.once('idle', handleLoaded)
    map.on('error', (e) => {
      console.error('[MapLibre error]', e)
    })

    // Pastikan resize awal dieksekusi setelah render DOM
    requestAnimationFrame(() => {
      if (!isDisposed) {
        map.resize()
      }
    })

    // Fallback safety timeout (maksimal 2.5 detik) agar UI tidak stuck di overlay memuat
    const timer = setTimeout(() => {
      handleLoaded()
    }, 2500)

    mapRef.current = map

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize()
      }
    })
    resizeObserver.observe(mapContainerRef.current)

    const markers = markersMapRef.current
    const cityMarkers = cityMarkersRef.current
    return () => {
      isDisposed = true
      clearTimeout(timer)
      resizeObserver.disconnect()
      stationPopup.remove()
      map.off('click', 'jakarta-subdistricts-interactive', handleSubdistrictClick)
      map.off('mouseenter', 'jakarta-subdistricts-interactive', handleSubdistrictEnter)
      map.off('mouseleave', 'jakarta-subdistricts-interactive', handleSubdistrictLeave)
      map.off('mouseenter', 'transit-stations-circle', handleStationEnter)
      map.off('mouseleave', 'transit-stations-circle', handleStationLeave)
      map.off('mouseenter', 'transit-routes-line', handleRouteEnter)
      map.off('mouseleave', 'transit-routes-line', handleRouteLeave)
      map.off('click', 'transit-routes-line', handleRouteClick)
      Object.values(markers).forEach(({ marker, popup }) => {
        popup.remove()
        marker.remove()
      })
      markersMapRef.current = {}
      Object.values(cityMarkers).forEach((marker) => {
        marker.remove()
      })
      cityMarkersRef.current = {}
      map.remove()
      mapRef.current = null
    }
  }, [initialCenter, initialZoom, minZoom, maxZoom, maxBounds])

  // Fly to focus coordinate if updated
  useEffect(() => {
    if (!mapRef.current || !focusCoords) return
    mapRef.current.flyTo({
      center: focusCoords,
      zoom: focusZoom ?? 15,
      speed: 1.4,
      curve: 1.2,
      essential: true,
    })
  }, [focusCoords, focusZoom])

  // =========================================================================
  // LAYER 1: Marker Agregat Kota Administrasi (Macro View — Seluruh DKI)
  // =========================================================================
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return
    const map = mapRef.current

    // Jika di Layer 2 (ada kota spesifik dipilih), lebur / hapus semua marker kota
    const isStandaloneMode = Boolean(onFacilitySelect && !onSelectWilayah)
    if (isStandaloneMode || (selectedWilayah && selectedWilayah !== 'ALL')) {
      Object.values(cityMarkersRef.current).forEach((marker) => marker.remove())
      cityMarkersRef.current = {}
      return
    }

    // Jika sudah ada marker kota yang terpasang di Layer 1, hindari render ulang yang tidak perlu
    if (Object.keys(cityMarkersRef.current).length > 0) return

    CITY_AGGREGATES.forEach((city) => {
      // Wrapper luar khusus untuk positioning MapLibre (TIDAK BOLEH ada CSS transition-transform atau scale)
      const wrapperEl = document.createElement('div')
      wrapperEl.className = 'group relative flex flex-col items-center cursor-pointer select-none'
      wrapperEl.style.transformOrigin = 'center bottom'

      // Card dalam tempat styling, hover effect, dan konten
      const cardEl = document.createElement('div')
      cardEl.className =
        'flex items-center gap-2 px-2.5 py-1.5 bg-surface/95 backdrop-blur-md border border-primary/50 rounded-xl shadow-lg group-hover:border-primary group-hover:shadow-xl transition-all'

      cardEl.innerHTML = `
        <div class="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"></span>
          <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary"></span>
        </div>
        <div class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="text-xs font-bold text-foreground tracking-tight">${city.name}</span>
          <span class="px-1.5 py-0.5 text-[10px] font-extrabold bg-primary/15 text-primary rounded-md">
            ${city.counts.facilities} Fasilitas
          </span>
        </div>
      `

      wrapperEl.setAttribute('data-city-code', city.code)

      const notchEl = document.createElement('div')
      notchEl.className =
        'w-2 h-2 -mt-1 rotate-45 bg-surface border-r border-b border-primary/50 group-hover:border-primary'

      wrapperEl.appendChild(cardEl)
      wrapperEl.appendChild(notchEl)

      const handleCityClick = (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onSelectWilayahRef.current?.(city.code)
      }

      // Cegah MapLibre map drag / pan handler mengintersepsi klik pada marker
      wrapperEl.addEventListener('mousedown', (e) => e.stopPropagation())
      wrapperEl.addEventListener('pointerdown', (e) => e.stopPropagation())
      wrapperEl.addEventListener('click', handleCityClick)

      const marker = new Marker({ element: wrapperEl, anchor: 'bottom' })
        .setLngLat(city.center)
        .addTo(map)

      cityMarkersRef.current[city.code] = marker
    })

    return () => {
      Object.values(cityMarkersRef.current).forEach((marker) => marker.remove())
      cityMarkersRef.current = {}
    }
  }, [selectedWilayah, isLoaded, onFacilitySelect, onSelectWilayah])

  // =========================================================================
  // LAYER 2: Marker Fasilitas Individual (Hanya aktif saat kota dipilih)
  // =========================================================================
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return

    // Bersihkan marker lama
    Object.values(markersMapRef.current).forEach(({ marker, popup }) => {
      popup.remove()
      marker.remove()
    })
    markersMapRef.current = {}

    const isStandaloneMode = Boolean(onFacilitySelect && !onSelectWilayah)
    if (!isStandaloneMode && (!selectedWilayah || selectedWilayah === 'ALL')) {
      return
    }

    const activeFacilities = isStandaloneMode
      ? facilities
      : facilities.filter((f) => !f.wilayah || f.wilayah === selectedWilayah)

    activeFacilities.forEach((f) => {
      const color = CATEGORY_COLORS[f.category] ?? '#16a34a'
      const iconSvg = CATEGORY_SVGS[f.category] ?? DEFAULT_PIN_SVG

      const wrapperEl = document.createElement('div')
      wrapperEl.className = 'relative flex items-center justify-center cursor-pointer select-none'
      wrapperEl.style.width = '36px'
      wrapperEl.style.height = '36px'

      const innerEl = document.createElement('div')
      innerEl.className =
        'flex items-center justify-center rounded-full shadow-md transition-all duration-200 hover:scale-125'
      innerEl.style.backgroundColor = color
      innerEl.style.width = '28px'
      innerEl.style.height = '28px'
      innerEl.style.border = '2px solid white'
      innerEl.innerHTML = iconSvg
      wrapperEl.appendChild(innerEl)

      const popupHtml = `
        <div style="padding: 10px; font-family: 'Plus Jakarta Sans', sans-serif; min-width: 180px; max-width: 240px; color: #1c2620;">
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${color}; letter-spacing: 0.05em;">
            ${f.subCategory || f.category}
          </span>
          <h4 style="margin: 4px 0 2px 0; font-size: 13px; font-weight: 700; line-height: 1.3;">
            ${f.name}
          </h4>
          <p style="margin: 0; font-size: 11px; color: #5d6962; line-height: 1.4;">
            ${f.address || f.wilayah}
          </p>
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 600; color: #16a34a;">
              ${f.budget?.total ? f.budget.total : 'Fasilitas Publik'}
            </span>
          </div>
        </div>
      `

      const popup = new Popup({ offset: 20, closeButton: false, closeOnClick: false }).setHTML(popupHtml)

      wrapperEl.addEventListener('mouseenter', () => {
        popup.setLngLat([f.lng, f.lat]).addTo(mapRef.current!)
      })
      wrapperEl.addEventListener('mouseleave', () => {
        popup.remove()
      })

      wrapperEl.addEventListener('mousedown', (e) => e.stopPropagation())
      wrapperEl.addEventListener('pointerdown', (e) => e.stopPropagation())

      wrapperEl.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        popup.remove()
        const selectHandler = onSelectFacility ?? onFacilitySelect
        selectHandler?.(f)
        onOpenDetail?.(f)
      })

      const marker = new Marker({ element: wrapperEl, anchor: 'center' })
        .setLngLat([f.lng, f.lat])
        .addTo(mapRef.current!)

      markersMapRef.current[f.id] = { marker, innerEl, popup }
    })

    const markers = markersMapRef.current
    return () => {
      Object.values(markers).forEach(({ marker, popup }) => {
        popup.remove()
        marker.remove()
      })
      markersMapRef.current = {}
    }
  }, [facilities, selectedWilayah, isLoaded, onSelectFacility, onFacilitySelect, onOpenDetail, onSelectWilayah])

  // =========================================================================
  // DYNAMIC TRANSIT, BOUNDARY HIGHLIGHT & DIMMING FILTER
  // =========================================================================
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return
    const map = mapRef.current

    const isLayer2 = Boolean(selectedWilayah && selectedWilayah !== 'ALL')
    const activeCity = isLayer2 ? CITY_AGGREGATES.find((c) => c.code === selectedWilayah) : null

    // 1. Visibilitas Garis & Glow Rute Trayek
    const routeVisibility = showTransit ? 'visible' : 'none'
    if (map.getLayer('transit-routes-glow')) {
      map.setLayoutProperty('transit-routes-glow', 'visibility', routeVisibility)
    }
    if (map.getLayer('transit-routes-line')) {
      map.setLayoutProperty('transit-routes-line', 'visibility', routeVisibility)
    }

    // Filter Mode Transportasi
    if (showTransit && activeTransitModes && activeTransitModes.length > 0) {
      const modeFilter: FilterSpecification = ['in', 'mode', ...activeTransitModes]
      if (map.getLayer('transit-routes-line')) {
        map.setFilter('transit-routes-line', modeFilter)
      }
      if (map.getLayer('transit-routes-glow')) {
        map.setFilter('transit-routes-glow', modeFilter)
      }
    }

    // 2. Opacity & Warna Koridor: Jika ada koridor yang difokuskan, rute lain menjadi abu-abu
    if (focusedCorridorId) {
      const matched = TRANSJAKARTA_CORRIDORS.find(
        (c) => c.id === focusedCorridorId || c.koridorCode === focusedCorridorId
      )
      const targetId = matched?.id ?? focusedCorridorId
      const targetKoridor = matched?.koridorCode ?? ''
      const targetShort = matched?.shortCode ?? ''

      const isFocusedRoute: ExpressionSpecification = [
        'any',
        ['==', ['get', 'id'], targetId],
        ['==', ['get', 'koridor'], targetKoridor],
        ['==', ['get', 'shortName'], targetShort],
      ]

      const unfocusedColor = mapMode === 'dark' ? '#475569' : '#94a3b8'

      if (map.getLayer('transit-routes-line')) {
        map.setPaintProperty('transit-routes-line', 'line-color', [
          'case',
          isFocusedRoute,
          ['get', 'color'],
          unfocusedColor,
        ])
        map.setPaintProperty('transit-routes-line', 'line-width', [
          'case',
          isFocusedRoute,
          [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 4.5,
            14, 7.5,
          ],
          [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 1.8,
            14, 3.0,
          ],
        ])
        map.setPaintProperty('transit-routes-line', 'line-opacity', [
          'case',
          isFocusedRoute,
          1.0,
          0.28,
        ])
      }

      if (map.getLayer('transit-routes-glow')) {
        map.setPaintProperty('transit-routes-glow', 'line-color', [
          'case',
          isFocusedRoute,
          ['get', 'color'],
          'transparent',
        ])
        map.setPaintProperty('transit-routes-glow', 'line-opacity', [
          'case',
          isFocusedRoute,
          0.65,
          0.0,
        ])
      }

      // Halte / Stasiun untuk rute yang difokuskan
      if (map.getLayer('transit-stations-circle')) {
        map.setLayoutProperty('transit-stations-circle', 'visibility', 'visible')
        map.setFilter('transit-stations-circle', [
          'any',
          ['==', ['get', 'koridor'], targetKoridor],
          ['==', ['get', 'line'], targetShort],
        ])
        map.setPaintProperty('transit-stations-circle', 'circle-opacity', 1.0)
        map.setPaintProperty('transit-stations-circle', 'circle-color', ['get', 'color'])
      }
    } else {
      // Keadaan Normal: Tidak ada koridor spesifik yang difokuskan
      if (map.getLayer('transit-routes-line')) {
        map.setPaintProperty('transit-routes-line', 'line-color', ['get', 'color'])
        map.setPaintProperty('transit-routes-line', 'line-width', [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 2.5,
          14, 4.5,
        ])
        if (isLayer2 && activeCity && activeCity.corridors.length > 0) {
          map.setPaintProperty('transit-routes-line', 'line-opacity', [
            'case',
            ['in', ['get', 'koridor'], ['literal', activeCity.corridors]],
            1.0,
            0.2,
          ])
        } else {
          map.setPaintProperty('transit-routes-line', 'line-opacity', 0.95)
        }
      }

      if (map.getLayer('transit-routes-glow')) {
        map.setPaintProperty('transit-routes-glow', 'line-color', ['get', 'color'])
        if (isLayer2 && activeCity && activeCity.corridors.length > 0) {
          map.setPaintProperty('transit-routes-glow', 'line-opacity', [
            'case',
            ['in', ['get', 'koridor'], ['literal', activeCity.corridors]],
            0.45,
            0.05,
          ])
        } else {
          map.setPaintProperty('transit-routes-glow', 'line-opacity', 0.35)
        }
      }

      // 3. Titik Halte / Stasiun: Hanya muncul di Layer 2 khusus untuk kota aktif
      if (map.getLayer('transit-stations-circle')) {
        if (showTransit && isLayer2 && activeCity) {
          map.setLayoutProperty('transit-stations-circle', 'visibility', 'visible')
          map.setFilter('transit-stations-circle', ['==', ['get', 'wilayah'], selectedWilayah])
          map.setPaintProperty('transit-stations-circle', 'circle-opacity', 0.9)
          map.setPaintProperty('transit-stations-circle', 'circle-color', ['get', 'color'])
        } else {
          map.setLayoutProperty('transit-stations-circle', 'visibility', 'none')
        }
      }
    }

    // 4. Highlight Batas Kota Terpilih & Dimming Wilayah Luar
    if (map.getLayer('jakarta-subdistricts-dim-fill')) {
      map.setFilter(
        'jakarta-subdistricts-dim-fill',
        isLayer2 && activeCity ? ['!=', 'NAME_2', activeCity.subdistrictName] : ['==', 'NAME_2', '']
      )
    }
    if (map.getLayer('jakarta-subdistricts-focus-fill')) {
      map.setFilter(
        'jakarta-subdistricts-focus-fill',
        isLayer2 && activeCity ? ['==', 'NAME_2', activeCity.subdistrictName] : ['==', 'NAME_2', '']
      )
    }
    if (map.getLayer('jakarta-subdistricts-focus-glow')) {
      map.setFilter(
        'jakarta-subdistricts-focus-glow',
        isLayer2 && activeCity ? ['==', 'NAME_2', activeCity.subdistrictName] : ['==', 'NAME_2', '']
      )
    }
    if (map.getLayer('jakarta-subdistricts-focus-line')) {
      map.setFilter(
        'jakarta-subdistricts-focus-line',
        isLayer2 && activeCity ? ['==', 'NAME_2', activeCity.subdistrictName] : ['==', 'NAME_2', '']
      )
    }
  }, [showTransit, activeTransitModes, selectedWilayah, focusedCorridorId, mapMode, isLoaded])

  // Update status visual seleksi tanpa merecreate marker di DOM
  useEffect(() => {
    Object.entries(markersMapRef.current).forEach(([facilityId, { innerEl }]) => {
      const isSelected = selectedFacilityId === facilityId
      if (isSelected) {
        innerEl.style.width = '34px'
        innerEl.style.height = '34px'
        innerEl.classList.add('ring-4', 'ring-primary', 'ring-offset-2', 'scale-115')
      } else {
        innerEl.style.width = '28px'
        innerEl.style.height = '28px'
        innerEl.classList.remove('ring-4', 'ring-primary', 'ring-offset-2', 'scale-115')
      }
    })
  }, [selectedFacilityId])

  // Ganti Style (Light Canvas vs Dark Canvas vs Satelit)
  const switchMode = useCallback(
    (mode: MapMode) => {
      if (!mapRef.current || mode === mapMode) return
      setMapMode(mode)

      if (mode === 'dark') {
        mapRef.current.setStyle(DARK_CANVAS_STYLE)
      } else if (mode === 'satellite') {
        mapRef.current.setStyle(SATELLITE_STYLE)
      } else {
        mapRef.current.setStyle(LIGHT_CANVAS_STYLE)
      }
    },
    [mapMode]
  )

  const handleResetView = useCallback(() => {
    if (!mapRef.current) return
    onSelectWilayah?.('ALL')
    mapRef.current.flyTo({
      center: initialCenter,
      zoom: initialZoom,
      essential: true,
    })
  }, [initialCenter, initialZoom, onSelectWilayah])

  return (
    <div
      style={height !== '100%' ? { height } : undefined}
      className={`relative w-full h-full overflow-hidden ${className}`}
    >
      {/* Kontainer Peta */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 h-full w-full bg-surface-muted"
      />

      {/* Map Skeleton Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-4 bg-surface-muted/80 backdrop-blur-xs pointer-events-none transition-opacity duration-300">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-44 rounded-2xl bg-surface border border-border/80 shadow-xs" />
            <Skeleton className="h-9 w-28 rounded-2xl bg-surface border border-border/80 shadow-xs" />
          </div>
          <div className="self-center flex flex-col items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/25" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-primary/70" />
            </div>
            <Skeleton className="h-4 w-36 rounded-full bg-surface border border-border/70 shadow-xs" />
          </div>
          <div className="flex justify-between items-end">
            <Skeleton className="h-9 w-32 rounded-xl bg-surface border border-border/80 shadow-xs" />
            <div className="flex flex-col gap-2 items-end">
              <Skeleton className="h-24 w-8 rounded-xl bg-surface border border-border/80 shadow-xs" />
              <Skeleton className="h-8 w-28 rounded-xl bg-surface border border-border/80 shadow-xs" />
            </div>
          </div>
        </div>
      )}

      {/* Floating Control Stack di Kanan Bawah: Zoom (+/-) dan tepat di bawahnya Mode 3-Icon Switcher & Reset */}
      <div className="pointer-events-auto absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
        {/* Kontrol Zoom (+, -, Kompas) */}
        <div className="flex flex-col rounded-xl border border-border bg-surface shadow-md overflow-hidden">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="flex h-8 w-8 items-center justify-center text-foreground hover:bg-surface-muted transition-colors border-b border-border text-base font-bold cursor-pointer"
            title="Perbesar (Zoom In)"
            aria-label="Perbesar"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="flex h-8 w-8 items-center justify-center text-foreground hover:bg-surface-muted transition-colors border-b border-border text-base font-bold cursor-pointer"
            title="Perkecil (Zoom Out)"
            aria-label="Perkecil"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.resetNorthPitch()}
            className="flex h-8 w-8 items-center justify-center text-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer text-xs"
            title="Reset Arah Utara (Kompas)"
            aria-label="Arah Utara"
          >
            ▲
          </button>
        </div>

        {/* Tepat di bawahnya: Tombol Reset & 3-Icon Mode Switcher (Matahari / Bulan / Satelit) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleResetView}
            className="flex h-8 items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 text-xs font-semibold text-foreground shadow-md hover:bg-surface-muted transition-colors cursor-pointer"
            title="Reset ke pandangan seluruh Jakarta"
          >
            <TargetIcon size={14} className="text-primary" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <div className="flex items-center rounded-xl border border-border bg-surface p-0.5 shadow-md">
            <button
              type="button"
              onClick={() => switchMode('light')}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                mapMode === 'light'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-muted hover:text-foreground'
              }`}
              title="Kanvas Terang (Light Gray Canvas)"
              aria-label="Kanvas Terang"
            >
              <SunIcon size={14} />
            </button>
            <button
              type="button"
              onClick={() => switchMode('dark')}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                mapMode === 'dark'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-muted hover:text-foreground'
              }`}
              title="Kanvas Gelap (Dark Gray Canvas)"
              aria-label="Kanvas Gelap"
            >
              <MoonIcon size={14} />
            </button>
            <button
              type="button"
              onClick={() => switchMode('satellite')}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                mapMode === 'satellite'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-muted hover:text-foreground'
              }`}
              title="Citra Satelit (Satellite Imagery)"
              aria-label="Citra Satelit"
            >
              <SatelliteIcon size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
