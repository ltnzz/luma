import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Map as MapLibreMap,
  Marker,
  Popup,
  setWorkerUrl,
  type GeoJSONSource,
  type MapLayerMouseEvent,
} from 'maplibre-gl'
import maplibreglWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import type { Facility } from '../../lib/api'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTheme } from '../../context/useTheme'
import { useTranslation } from '../../i18n/useTranslation'
import { Skeleton } from './Skeleton'
import { TargetIcon, SatelliteIcon } from './Icons'
import jakartaBoundary from '../../data/jakarta-boundary.json'
import jakartaCityBoundaries from '../../data/jakarta-subdistricts-boundary.json'
import { validateJakartaBoundaryData } from '../../data/jakarta-boundary-validation'
import transitNetwork from '../../data/transit-network.json'
import { CITY_AGGREGATES } from '../../data/city-aggregates'
import { TRANSJAKARTA_CORRIDORS } from '../../data/transit-corridors'
import { buildDeduplicatedStations } from '../../data/transit-stations-deduped'
import { clusterNearbyItems } from '../../features/dashboard/utils/proximityClustering'
import { SPKU_STATIONS, getAqiLevel } from '../../features/dashboard/utils/airQualityLevels'
import { WATER_NETWORK, WATER_FACILITIES } from '../../data/water-network'
import {
  buildFacilityPopupHtml,
  createFacilityMarkerElement,
  getCategoryColor,
} from './map-marker'

// Konfigurasi Worker MapLibre GL untuk lingkungan Vite (mencegah error Worker 404)
setWorkerUrl(maplibreglWorkerUrl)

type StyleSpecification = Exclude<NonNullable<Parameters<MapLibreMap['setStyle']>[0]>, string>
type FilterSpecification = NonNullable<Parameters<MapLibreMap['setFilter']>[1]>
type GeoJSONData = Parameters<GeoJSONSource['setData']>[0]
type ExpressionSpecification = Parameters<MapLibreMap['setPaintProperty']>[2]

const CITY_BOUNDARY_SOURCE_ID = 'jakarta-city-boundary'
const CITY_BOUNDARY_VALIDATION = validateJakartaBoundaryData(jakartaCityBoundaries)

export type MapMode = 'light' | 'dark' | 'satellite'

const CITY_NAME_EN: Record<string, string> = {
  'JAKARTA PUSAT': 'Central Jakarta',
  'JAKARTA SELATAN': 'South Jakarta',
  'JAKARTA BARAT': 'West Jakarta',
  'JAKARTA UTARA': 'North Jakarta',
  'JAKARTA TIMUR': 'East Jakarta',
  'KEP. SERIBU': 'Thousand Islands',
}

// Style Kanvas Terpadu (Light, Dark, dan Satelit dalam 1 Style Specification)
// Menghilangkan kebutuhan memanggil map.setStyle() saat pergantian tema,
// sehingga WebGL layers dan GeoJSON tidak terhapus dan kanvas tidak berkedip.
function createBaseStyle(initialMode: MapMode): StyleSpecification {
  const isLight = initialMode === 'light'
  const isDark = initialMode === 'dark'
  const isSat = initialMode === 'satellite'

  return {
    version: 8,
    sources: {
      'esri-light-base': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 16,
        attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
      },
      'esri-light-ref': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 16,
      },
      'esri-dark-base': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 16,
        attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
      },
      'esri-dark-ref': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 16,
      },
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
      },
    },
    layers: [
      {
        id: 'esri-light-base-layer',
        type: 'raster',
        source: 'esri-light-base',
        minzoom: 0,
        maxzoom: 24,
        layout: { visibility: isLight ? 'visible' : 'none' },
      },
      {
        id: 'esri-light-ref-layer',
        type: 'raster',
        source: 'esri-light-ref',
        minzoom: 0,
        maxzoom: 24,
        layout: { visibility: isLight ? 'visible' : 'none' },
      },
      {
        id: 'esri-dark-base-layer',
        type: 'raster',
        source: 'esri-dark-base',
        minzoom: 0,
        maxzoom: 24,
        layout: { visibility: isDark ? 'visible' : 'none' },
      },
      {
        id: 'esri-dark-ref-layer',
        type: 'raster',
        source: 'esri-dark-ref',
        minzoom: 0,
        maxzoom: 24,
        layout: { visibility: isDark ? 'visible' : 'none' },
      },
      {
        id: 'esri-satellite-layer',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 24,
        layout: { visibility: isSat ? 'visible' : 'none' },
      },
    ],
  }
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
  showWaterNetwork?: boolean
  activeCategory?: string | null
}

interface MarkerEntry {
  marker: Marker
  innerEl: HTMLDivElement
  popup: Popup
}

// Helper untuk menambahkan garis batas tebal (bold boundary) DKI Jakarta
function applyJakartaBoundary(map: MapLibreMap, mode: MapMode) {
  try {
    const boundaryColor = mode === 'dark' ? '#a5d6a7' : (mode === 'satellite' ? '#66bb6a' : '#1b5e20')
    const glowColor = mode === 'dark' ? '#2b5748' : '#e8f5e9'

    // Update warna dinamis pada layer batas yang sudah terpasang saat mode berubah
    if (map.getLayer('jakarta-province-fill')) {
      map.setPaintProperty('jakarta-province-fill', 'fill-color', boundaryColor)
      map.setPaintProperty('jakarta-province-fill', 'fill-opacity', mode === 'satellite' ? 0.04 : 0.035)
    }
    if (map.getLayer('jakarta-province-glow')) {
      map.setPaintProperty('jakarta-province-glow', 'line-color', glowColor)
    }
    if (map.getLayer('jakarta-province-line')) {
      map.setPaintProperty('jakarta-province-line', 'line-color', boundaryColor)
    }
    if (map.getLayer('jakarta-city-dim-fill')) {
      map.setPaintProperty('jakarta-city-dim-fill', 'fill-color', mode === 'dark' ? '#000000' : '#0f172a')
    }
    if (map.getLayer('jakarta-city-focus-fill')) {
      map.setPaintProperty('jakarta-city-focus-fill', 'fill-color', boundaryColor)
    }
    if (map.getLayer('jakarta-city-line')) {
      map.setPaintProperty('jakarta-city-line', 'line-color', boundaryColor)
    }
    if (map.getLayer('jakarta-city-focus-glow')) {
      map.setPaintProperty('jakarta-city-focus-glow', 'line-color', glowColor)
    }
    if (map.getLayer('jakarta-city-focus-line')) {
      map.setPaintProperty('jakarta-city-focus-line', 'line-color', boundaryColor)
    }

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

    // Dataset ini tervalidasi pada level kota/kabupaten (NAME_2), bukan
    // kecamatan (NAME_3). Jangan aktifkan selector kecamatan dari layer ini.
    if (!CITY_BOUNDARY_VALIDATION.isValidCityBoundary) {
      console.error('[jakarta city boundary invalid]', CITY_BOUNDARY_VALIDATION.issues)
      return
    }

    // 4. Garis Batas Antar-Wilayah Kota Administrasi (Dashed lembut di dalam Jakarta)
    if (!map.getSource(CITY_BOUNDARY_SOURCE_ID)) {
      map.addSource(CITY_BOUNDARY_SOURCE_ID, {
        type: 'geojson',
        data: jakartaCityBoundaries as unknown as GeoJSONData,
      })
    }

    // Layer Dimming untuk area di luar kota aktif saat Layer 2 (Per-Kota)
    if (!map.getLayer('jakarta-city-dim-fill')) {
      map.addLayer({
        id: 'jakarta-city-dim-fill',
        type: 'fill',
        source: CITY_BOUNDARY_SOURCE_ID,
        filter: ['==', 'NAME_2', ''],
        paint: {
          'fill-color': mode === 'dark' ? '#000000' : '#0f172a',
          'fill-opacity': 0.28,
        },
      })
    }

    // Layer Highlight Fill untuk kota yang terpilih saat Layer 2
    if (!map.getLayer('jakarta-city-focus-fill')) {
      map.addLayer({
        id: 'jakarta-city-focus-fill',
        type: 'fill',
        source: CITY_BOUNDARY_SOURCE_ID,
        filter: ['==', 'NAME_2', ''],
        paint: {
          'fill-color': boundaryColor,
          'fill-opacity': 0.08,
        },
      })
    }

    // Interactive pointer surface for city polygons in Layer 1
    if (!map.getLayer('jakarta-city-interactive')) {
      map.addLayer({
        id: 'jakarta-city-interactive',
        type: 'fill',
        source: CITY_BOUNDARY_SOURCE_ID,
        paint: {
          'fill-color': '#000000',
          'fill-opacity': 0.001,
        },
      })
    }

    if (!map.getLayer('jakarta-city-line')) {
      map.addLayer({
        id: 'jakarta-city-line',
        type: 'line',
        source: CITY_BOUNDARY_SOURCE_ID,
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
    if (!map.getLayer('jakarta-city-focus-glow')) {
      map.addLayer({
        id: 'jakarta-city-focus-glow',
        type: 'line',
        source: CITY_BOUNDARY_SOURCE_ID,
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

    if (!map.getLayer('jakarta-city-focus-line')) {
      map.addLayer({
        id: 'jakarta-city-focus-line',
        type: 'line',
        source: CITY_BOUNDARY_SOURCE_ID,
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
function applyWaterLayers(map: MapLibreMap) {
  try {
    if (!map.getSource('water-network-source')) {
      map.addSource('water-network-source', {
        type: 'geojson',
        data: WATER_NETWORK as unknown as GeoJSONData,
      })
    }

    if (!map.getLayer('water-network-glow')) {
      map.addLayer({
        id: 'water-network-glow',
        type: 'line',
        source: 'water-network-source',
        paint: {
          'line-color': '#38bdf8',
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3.5, 14, 7],
          'line-opacity': 0.45,
          'line-blur': 2,
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
      })
    }

    if (!map.getLayer('water-network-line')) {
      map.addLayer({
        id: 'water-network-line',
        type: 'line',
        source: 'water-network-source',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2.4, 14, 4.4],
          'line-opacity': 0.95,
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
      })
    }

    if (!map.getSource('water-facilities-source')) {
      map.addSource('water-facilities-source', {
        type: 'geojson',
        data: WATER_FACILITIES as unknown as GeoJSONData,
      })
    }

    if (!map.getLayer('water-facilities-circle')) {
      map.addLayer({
        id: 'water-facilities-circle',
        type: 'circle',
        source: 'water-facilities-source',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4.5, 14, 7],
          'circle-color': '#0284c7',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })
    }

    if (!map.getLayer('water-facilities-label')) {
      map.addLayer({
        id: 'water-facilities-label',
        type: 'symbol',
        source: 'water-facilities-source',
        minzoom: 11.5,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 10,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-font': ['Open Sans Semibold'],
        },
        paint: {
          'text-color': '#0369a1',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
      })
    }
  } catch (err) {
    console.error('[applyWaterLayers error]', err)
  }
}

function applyTransitLayers(map: MapLibreMap, initialFacilities: Facility[] = []) {
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

    // 4. Source Stasiun & Halte (Deduplikasi Anti-Double Pin)
    if (!map.getSource('transit-stations-source')) {
      map.addSource('transit-stations-source', {
        type: 'geojson',
        data: buildDeduplicatedStations(initialFacilities) as unknown as GeoJSONData,
      })
    }

    // 5. Circle Simbol Stasiun / Halte Transit
    if (!map.getLayer('transit-stations-circle')) {
      map.addLayer({
        id: 'transit-stations-circle',
        type: 'circle',
        source: 'transit-stations-source',
        minzoom: 12.3,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12.3, 3,
            14, 5,
            16, 7.5,
          ],
          'circle-color': '#ffffff',
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12.3, 1.6,
            14, 2.6,
          ],
        },
      })
    }
  } catch (err) {
    console.error('[applyTransitLayers error]', err)
  }
}

export function InteractiveMap({
  initialCenter = JAKARTA_CENTER,
  initialZoom = 10.8,
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
  showWaterNetwork = true,
  showTransit = true,
  activeTransitModes = ['mrt', 'transjakarta', 'lrt', 'krl'],
  selectedWilayah = 'ALL',
  onSelectWilayah,
  focusedCorridorId,
  onSelectCorridor,
  activeCategory = null,
}: InteractiveMapProps) {
  const { theme } = useTheme()
  const { t, language } = useTranslation()
  const themeMapMode: Exclude<MapMode, 'satellite'> =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light'
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersMapRef = useRef<Record<string, MarkerEntry>>({})
  const cityMarkersRef = useRef<Record<string, Marker>>({})
  const provinsiMarkerRef = useRef<Marker | null>(null)
  const lastMarkerModeRef = useRef<'provinsi' | 'kota' | null>(null)
  const lastActiveCategoryRef = useRef<string | null>(null)
  const syncCityMarkersRef = useRef<() => void>(() => {})
  const [mapMode, setMapMode] = useState<MapMode>(themeMapMode)
  const modeRef = useRef<MapMode>(themeMapMode)
  const [isLoaded, setIsLoaded] = useState(false)

  const selectedWilayahRef = useRef(selectedWilayah)
  const onSelectWilayahRef = useRef(onSelectWilayah)
  const onSelectCorridorRef = useRef(onSelectCorridor)
  const facilitiesRef = useRef(facilities)

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
    facilitiesRef.current = facilities
  }, [facilities])

  useEffect(() => {
    modeRef.current = mapMode
  }, [mapMode])

  const languageRef = useRef(language)
  useEffect(() => {
    languageRef.current = language
  }, [language])

  // Sinkronisasi data halte terdeduplikasi setiap kali facilities diperbarui
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return
    const source = mapRef.current.getSource('transit-stations-source') as GeoJSONSource | undefined
    if (source) {
      source.setData(buildDeduplicatedStations(facilities) as unknown as GeoJSONData)
    }
  }, [facilities, isLoaded])

  // Inisialisasi Peta
  useEffect(() => {
    if (!mapContainerRef.current) return

    let isDisposed = false

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: createBaseStyle(modeRef.current),
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
        applyTransitLayers(map, facilitiesRef.current)
        applyWaterLayers(map)
        syncCityMarkersRef.current()
      }
    }

    map.on('style.load', () => {
      if (!isDisposed) {
        applyJakartaBoundary(map, modeRef.current)
        applyTransitLayers(map, facilitiesRef.current)
        applyWaterLayers(map)
        syncCityMarkersRef.current()
      }
    })

    map.on('idle', () => {
      if (!isDisposed) {
        syncCityMarkersRef.current()
      }
    })

    // Interaktivitas klik & hover pada poligon wilayah kota administrasi di Layer 1
    const handleCityBoundaryClick = (e: {
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

    const handleCityBoundaryEnter = () => {
      if (!selectedWilayahRef.current || selectedWilayahRef.current === 'ALL') {
        map.getCanvas().style.cursor = 'pointer'
      }
    }

    const handleCityBoundaryLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', 'jakarta-city-interactive', handleCityBoundaryClick)
    map.on('mouseenter', 'jakarta-city-interactive', handleCityBoundaryEnter)
    map.on('mouseleave', 'jakarta-city-interactive', handleCityBoundaryLeave)

    // Interaktivitas hover pada stasiun transit
    const stationPopup = new Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 16,
      className: 'luma-facility-popup',
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
      const name = String(p.name || 'Halte Transjakarta')
      const line = String(p.allLines || p.line || 'Transjakarta BRT')
      const allKoridors = String(p.allKoridors || p.koridor || '')
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
        <article class="luma-popup-card w-[220px] overflow-hidden rounded-xl text-foreground sm:w-[260px]">
          <div class="p-3.5">
            <div class="flex items-center justify-between gap-2">
              <span class="flex min-w-0 items-center gap-1.5 truncate text-[9.5px] font-bold uppercase tracking-[0.08em]" style="color:${color}">
                <span class="h-1.5 w-1.5 shrink-0 rounded-full" style="background:${color}"></span>
                ${line}
              </span>
            ${
              isHub
                ? '<span class="shrink-0 text-[9px] font-semibold text-blue-600">Transfer</span>'
                : ''
            }
            </div>
            <h4 class="m-0 mt-1.5 text-[13px] font-bold leading-snug text-foreground">${name}</h4>
            ${allKoridors && allKoridors !== line ? `<p class="m-0 mt-1 text-[10px] font-semibold text-blue-600">${allKoridors}</p>` : ''}
            ${lokasi ? `<p class="m-0 mt-1 text-[10.5px] leading-relaxed text-muted">${lokasi}</p>` : ''}
            ${
              tipeAkses || tahun
                ? `<dl class="m-0 mt-2.5 flex flex-col gap-1 border-t border-border/70 pt-2.5 text-[10.5px]">
                    ${tipeAkses ? `<div class="flex justify-between gap-3"><dt class="font-semibold text-muted">${languageRef.current === 'id' ? 'Akses' : 'Access'}</dt><dd class="m-0 text-right font-medium text-foreground">${tipeAkses}</dd></div>` : ''}
                    ${tahun ? `<div class="flex justify-between gap-3"><dt class="font-semibold text-muted">Tahun</dt><dd class="m-0 text-right font-medium text-foreground">${tahun}</dd></div>` : ''}
                  </dl>`
                : ''
            }
            ${interchangeList.length > 0 ? `<p class="m-0 mt-2 text-[10px] font-semibold text-primary">Terhubung: ${interchangeList.join(' • ')}</p>` : ''}
          </div>
        </article>
      `
      stationPopup.setLngLat(coords).setHTML(html).addTo(map)
    }

    const handleStationLeave = () => {
      map.getCanvas().style.cursor = ''
      stationPopup.remove()
    }

    const handleStationClick = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature) return
      const geom = feature.geometry as { coordinates: [number, number] }
      if (geom?.coordinates) {
        map.flyTo({
          center: geom.coordinates,
          zoom: Math.max(map.getZoom(), 14.5),
          duration: 700,
        })
      }
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
    map.on('click', 'transit-stations-circle', handleStationClick)
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
      map.off('click', 'jakarta-city-interactive', handleCityBoundaryClick)
      map.off('mouseenter', 'jakarta-city-interactive', handleCityBoundaryEnter)
      map.off('mouseleave', 'jakarta-city-interactive', handleCityBoundaryLeave)
      map.off('mouseenter', 'transit-stations-circle', handleStationEnter)
      map.off('mouseleave', 'transit-stations-circle', handleStationLeave)
      map.off('click', 'transit-stations-circle', handleStationClick)
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
    const map = mapRef.current
    const targetZoom = focusZoom ?? Math.max(map.getZoom(), 15)
    map.flyTo({
      center: focusCoords,
      zoom: targetZoom,
      speed: 1.4,
      curve: 1.2,
      essential: true,
    })
  }, [focusCoords, focusZoom])

  // =========================================================================
  // LAYER 1: Marker Agregat Kota Administrasi (Macro View — Seluruh DKI)
  // =========================================================================
  const syncCityMarkers = useCallback(() => {
    if (!mapRef.current || !isLoaded) return
    const map = mapRef.current

    // Jika di Layer 2 (ada kota spesifik dipilih), lebur / hapus semua marker kota & provinsi
    const isStandaloneMode = Boolean(onFacilitySelect && !onSelectWilayah)
    const isLayer1Active = !isStandaloneMode && (!selectedWilayah || selectedWilayah === 'ALL')

    if (!isLayer1Active) {
      Object.values(cityMarkersRef.current).forEach((marker) => marker.remove())
      cityMarkersRef.current = {}
      if (provinsiMarkerRef.current) {
        provinsiMarkerRef.current.remove()
        provinsiMarkerRef.current = null
      }
      lastMarkerModeRef.current = null
      return
    }

    const currentZoom = map.getZoom()
    const isProvinceLevel = currentZoom < 10.2

    // -------------------------------------------------------------------------
    // MODE 1: ZOOM OUT (< 10.2) -> 1 MARKER TUNGGAL AGREGAT PROVINSI DKI JAKARTA
    // -------------------------------------------------------------------------
    if (isProvinceLevel) {
      // Hapus marker per-kota jika sebelumnya aktif
      if (Object.keys(cityMarkersRef.current).length > 0) {
        Object.values(cityMarkersRef.current).forEach((marker) => marker.remove())
        cityMarkersRef.current = {}
      }

      // Hindari re-render jika marker provinsi sudah terpasang dan kategori tidak berubah
      if (
        lastMarkerModeRef.current === 'provinsi' &&
        provinsiMarkerRef.current &&
        provinsiMarkerRef.current.getElement()?.isConnected &&
        lastActiveCategoryRef.current === activeCategory
      ) {
        return
      }

      lastMarkerModeRef.current = 'provinsi'
      lastActiveCategoryRef.current = activeCategory

      if (provinsiMarkerRef.current) {
        provinsiMarkerRef.current.remove()
        provinsiMarkerRef.current = null
      }

      // Hitung metrik dinamis se-DKI sesuai kategori yang aktif di dock bawah
      let badgeText = `1.740 ${t('mapFirst.map.facilities')}`
      let badgeClass = 'bg-primary/15 text-primary border border-primary/30'
      let cardBorder = 'border-primary/50 group-hover:border-primary'
      let dotColor = 'bg-primary'

      if (activeCategory === 'kesehatan') {
        const totalFaskes = facilities.filter((f) => f.category === 'kesehatan').length
        badgeText = `${totalFaskes > 0 ? totalFaskes : 47} ${t('mapFirst.dock.health')}`
        badgeClass = 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
        cardBorder = 'border-rose-500/50 group-hover:border-rose-500'
        dotColor = 'bg-rose-500'
      } else if (activeCategory === 'rth') {
        const totalRth = facilities.filter((f) => f.category === 'fasum').length
        badgeText = `${totalRth > 0 ? totalRth : 24} ${t('mapFirst.dock.green')}`
        badgeClass = 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
        cardBorder = 'border-emerald-500/50 group-hover:border-emerald-500'
        dotColor = 'bg-emerald-500'
      } else if (activeCategory === 'sekolah') {
        badgeText = `1.503 ${t('mapFirst.dock.school')}`
        badgeClass = 'bg-blue-500/15 text-blue-600 border border-blue-500/30'
        cardBorder = 'border-blue-500/50 group-hover:border-blue-500'
        dotColor = 'bg-blue-500'
      } else if (activeCategory === 'transum') {
        badgeText = `13 ${t('mapFirst.dock.transitUnit')} BRT`
        badgeClass = 'bg-purple-500/15 text-purple-600 border border-purple-500/30'
        cardBorder = 'border-purple-500/50 group-hover:border-purple-500'
        dotColor = 'bg-purple-500'
      } else if (activeCategory === 'air') {
        badgeText = `68% ${t('mapFirst.dock.water')}`
        badgeClass = 'bg-sky-500/15 text-sky-600 border border-sky-500/30'
        cardBorder = 'border-sky-500/50 group-hover:border-sky-500'
        dotColor = 'bg-sky-500'
      }

      const aqiInfo = getAqiLevel(173) // Rata-rata indeks kualitas udara DKI Jakarta
      const airQualityUnit = t('mapFirst.air.unit')
      const aqiDot = `<span class="h-2 w-2 shrink-0 rounded-full ring-2 ring-white/70 dark:ring-black/30" style="background-color:${aqiInfo.color}" title="${t('mapFirst.air.title')}: 173 ${airQualityUnit}" aria-label="${t('mapFirst.air.title')}: 173 ${airQualityUnit}"></span>`

      const wrapperEl = document.createElement('div')
      wrapperEl.className = 'luma-region-marker group relative flex flex-col items-center cursor-pointer select-none z-10'
      wrapperEl.style.transformOrigin = 'center bottom'

      const cardEl = document.createElement('div')
      cardEl.className = `luma-region-card min-w-[150px] px-3 py-2 luma-map-card border ${cardBorder} rounded-xl transition-all`

      cardEl.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2">
            <span class="h-2 w-2 shrink-0 rounded-full ${dotColor} shadow-[0_0_0_3px_rgba(34,197,94,0.12)]"></span>
            <span class="luma-map-label-text truncate text-[11px] font-bold text-foreground tracking-tight">DKI Jakarta</span>
          </div>
          ${aqiDot}
        </div>
        <span class="mt-1.5 inline-flex max-w-full px-2 py-0.5 text-[9.5px] font-bold ${badgeClass} rounded-md">${badgeText}</span>
      `
      wrapperEl.setAttribute('data-scope', 'DKI')
      wrapperEl.setAttribute('role', 'button')
      wrapperEl.setAttribute('tabindex', '0')
      wrapperEl.setAttribute('aria-label', `DKI Jakarta, ${badgeText}`)

      const notchEl = document.createElement('div')
      notchEl.className = `w-2 h-2 -mt-1 rotate-45 luma-glass border-r border-b ${cardBorder}`

      wrapperEl.appendChild(cardEl)
      wrapperEl.appendChild(notchEl)

      // Klik 1 Marker DKI -> Auto flyTo halus ke zoom 10.8 di pusat DKI (otomatis terurai jadi 5-6 kota)
      const handleProvinceClick = (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        map.flyTo({ center: [106.8272, -6.185], zoom: 10.8, duration: 800 })
      }

      wrapperEl.addEventListener('mousedown', (e) => e.stopPropagation())
      wrapperEl.addEventListener('pointerdown', (e) => e.stopPropagation())
      wrapperEl.addEventListener('click', handleProvinceClick)
      wrapperEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') handleProvinceClick(e as unknown as MouseEvent)
      })

      const marker = new Marker({ element: wrapperEl, anchor: 'bottom' })
        .setLngLat([106.8272, -6.185])
        .addTo(map)

      provinsiMarkerRef.current = marker
      return
    }

    // -------------------------------------------------------------------------
    // MODE 2: ZOOM IN (>= 10.2) -> 5-6 MARKER KOTA ADMINISTRATIF TERURAI
    // -------------------------------------------------------------------------
    if (provinsiMarkerRef.current) {
      provinsiMarkerRef.current.remove()
      provinsiMarkerRef.current = null
    }

    // Cek apakah semua marker kota masih utuh dan terhubung
    const allMarkersHealthy =
      lastMarkerModeRef.current === 'kota' &&
      Object.keys(cityMarkersRef.current).length === CITY_AGGREGATES.length &&
      Object.values(cityMarkersRef.current).every((m) => m.getElement()?.isConnected)

    if (allMarkersHealthy && lastActiveCategoryRef.current === activeCategory) return
    lastMarkerModeRef.current = 'kota'
    lastActiveCategoryRef.current = activeCategory

    // Bersihkan instance lama jika kategori berubah atau ada marker rusak
    Object.values(cityMarkersRef.current).forEach((marker) => marker.remove())
    cityMarkersRef.current = {}

    const defaultCounts: Record<string, { faskes: number; rth: number; sekolah: number; air: number }> = {
      'JAKARTA PUSAT': { faskes: 9, rth: 7, sekolah: 205, air: 72 },
      'JAKARTA SELATAN': { faskes: 12, rth: 7, sekolah: 320, air: 68 },
      'JAKARTA BARAT': { faskes: 8, rth: 5, sekolah: 385, air: 65 },
      'JAKARTA UTARA': { faskes: 8, rth: 6, sekolah: 186, air: 70 },
      'JAKARTA TIMUR': { faskes: 10, rth: 6, sekolah: 395, air: 64 },
      'KEP. SERIBU': { faskes: 4, rth: 3, sekolah: 12, air: 45 },
    }

    CITY_AGGREGATES.forEach((city) => {
      const station = SPKU_STATIONS.find((s) => s.code === city.code)
      const aqiInfo = station ? getAqiLevel(station.aqi) : null

      let badgeText = `${city.counts.facilities} ${t('mapFirst.map.facilities')}`
      let badgeClass = 'bg-primary/15 text-primary border border-primary/30'
      let cardBorder = 'border-primary/50 group-hover:border-primary'

      if (activeCategory === 'kesehatan') {
        const cityFaskes = facilities.filter((f) => f.wilayah === city.code && f.category === 'kesehatan').length
        const count = cityFaskes > 0 ? cityFaskes : (defaultCounts[city.code]?.faskes ?? 8)
        badgeText = `${count} ${t('mapFirst.dock.health')}`
        badgeClass = 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
        cardBorder = 'border-rose-500/50 group-hover:border-rose-500'
      } else if (activeCategory === 'rth') {
        const cityRth = facilities.filter((f) => f.wilayah === city.code && f.category === 'fasum').length
        const count = cityRth > 0 ? cityRth : (defaultCounts[city.code]?.rth ?? 6)
        badgeText = `${count} ${t('mapFirst.dock.green')}`
        badgeClass = 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
        cardBorder = 'border-emerald-500/50 group-hover:border-emerald-500'
      } else if (activeCategory === 'sekolah') {
        const count = defaultCounts[city.code]?.sekolah ?? 200
        badgeText = `${count} ${t('mapFirst.dock.school')}`
        badgeClass = 'bg-blue-500/15 text-blue-600 border border-blue-500/30'
        cardBorder = 'border-blue-500/50 group-hover:border-blue-500'
      } else if (activeCategory === 'transum') {
        const count = city.corridors.length
        badgeText = `${count} ${t('mapFirst.dock.transitUnit')} BRT`
        badgeClass = 'bg-purple-500/15 text-purple-600 border border-purple-500/30'
        cardBorder = 'border-purple-500/50 group-hover:border-purple-500'
      } else if (activeCategory === 'air') {
        const pct = defaultCounts[city.code]?.air ?? 68
        badgeText = `${pct}% ${t('mapFirst.dock.water')}`
        badgeClass = 'bg-sky-500/15 text-sky-600 border border-sky-500/30'
        cardBorder = 'border-sky-500/50 group-hover:border-sky-500'
      }

      // Wrapper luar khusus untuk positioning MapLibre (TIDAK BOLEH ada CSS transition-transform atau scale)
      const wrapperEl = document.createElement('div')
      wrapperEl.className = 'luma-region-marker group relative flex flex-col items-center cursor-pointer select-none z-10'
      wrapperEl.style.transformOrigin = 'center bottom'

      // Card dalam tempat styling, hover effect, dan konten
      const cardEl = document.createElement('div')
      cardEl.className = `luma-region-card flex items-center justify-center gap-2 px-2.5 py-1.5 min-w-[120px] bg-white/75 dark:bg-zinc-900/75 backdrop-blur-xl border ${cardBorder} rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.4)] transition-all`

      const airQualityUnit = t('mapFirst.air.unit')
      const aqiBadge = station
        ? `<span class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-extrabold rounded-md" style="background-color:${aqiInfo?.color}2b;color:${aqiInfo?.color};border:1px solid ${aqiInfo?.color}70;box-shadow:0 0 10px ${aqiInfo?.color}28" title="${t('mapFirst.air.title')}: ${station.aqi} ${airQualityUnit}">
            ${station.aqi} ${airQualityUnit}
          </span>`
        : ''
      const displayCityName = language === 'en' ? (CITY_NAME_EN[city.code] ?? city.name) : city.name

      cardEl.innerHTML = `
        <div class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="luma-map-label-text text-xs font-bold text-foreground tracking-tight">${displayCityName}</span>
          <span class="px-1.5 py-0.5 text-[10px] font-extrabold ${badgeClass} rounded-md">${badgeText}</span>
          ${aqiBadge}
        </div>
      `
      wrapperEl.setAttribute('data-city-code', city.code)
      wrapperEl.setAttribute('role', 'button')
      wrapperEl.setAttribute('tabindex', '0')
      wrapperEl.setAttribute('aria-label', `${displayCityName}, ${badgeText}`)

      const notchEl = document.createElement('div')
      notchEl.className = `w-2 h-2 -mt-1 rotate-45 luma-glass border-r border-b ${cardBorder}`

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
      wrapperEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') handleCityClick(e as unknown as MouseEvent)
      })

      const marker = new Marker({ element: wrapperEl, anchor: 'bottom' })
        .setLngLat(city.center)
        .addTo(map)

      cityMarkersRef.current[city.code] = marker
    })
  }, [isLoaded, selectedWilayah, onFacilitySelect, onSelectWilayah, activeCategory, facilities, t, language])

  useEffect(() => {
    syncCityMarkersRef.current = syncCityMarkers
  }, [syncCityMarkers])

  useEffect(() => {
    syncCityMarkers()

    const map = mapRef.current
    if (map) {
      map.on('zoomend', syncCityMarkers)
    }

    return () => {
      if (map) {
        map.off('zoomend', syncCityMarkers)
      }
      Object.values(cityMarkersRef.current).forEach((marker) => marker.remove())
      cityMarkersRef.current = {}
      if (provinsiMarkerRef.current) {
        provinsiMarkerRef.current.remove()
        provinsiMarkerRef.current = null
      }
    }
  }, [syncCityMarkers, mapMode])

  // =========================================================================
  // LAYER 2: Marker Fasilitas Individual & Clustered (Hanya aktif saat kota dipilih)
  // =========================================================================
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return
    const map = mapRef.current

    const clearOldMarkers = () => {
      Object.values(markersMapRef.current).forEach(({ marker, popup }) => {
        popup.remove()
        marker.remove()
      })
      markersMapRef.current = {}
    }

    const isStandaloneMode = Boolean(onFacilitySelect && !onSelectWilayah)
    if (!isStandaloneMode && (!selectedWilayah || selectedWilayah === 'ALL')) {
      clearOldMarkers()
      return
    }

    const activeFacilities = isStandaloneMode
      ? facilities
      : facilities.filter((f) => !f.wilayah || f.wilayah === selectedWilayah)

    const renderMarkers = () => {
      clearOldMarkers()
      const currentZoom = map.getZoom()
      const clusteredItems = clusterNearbyItems<Facility>(activeFacilities, currentZoom)

      clusteredItems.forEach((group) => {
        if (group.isCluster) {
          // Render Cluster Badge untuk titik-titik yang berdekatan
          const wrapperEl = document.createElement('div')
          wrapperEl.className =
            'luma-facility-marker relative flex items-center justify-center cursor-pointer select-none group'
          wrapperEl.style.width = '36px'
          wrapperEl.style.height = '36px'

          const sampleCategory = group.items[0]?.category || 'fasum'
          const clusterColor = getCategoryColor(sampleCategory)

          const innerEl = document.createElement('div')
          innerEl.className =
            'flex items-center justify-center rounded-full text-white font-extrabold text-xs shadow-[0_8px_18px_rgba(0,0,0,0.24)] transition-transform hover:scale-110 border-2 border-surface ring-2 ring-black/10'
          innerEl.style.backgroundColor = clusterColor
          innerEl.style.width = '30px'
          innerEl.style.height = '30px'
          innerEl.innerText = String(group.count)
          wrapperEl.appendChild(innerEl)

          const previewList = group.items
            .slice(0, 4)
            .map(
              (it) =>
                `<li style="margin-bottom:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${it.name}</li>`
            )
            .join('')
          const moreCount =
            group.count > 4
              ? `<li style="color:#64748b;font-style:italic;">+${group.count - 4} ${language === 'id' ? 'fasilitas lainnya' : 'more facilities'}</li>`
              : ''

          const popupHtml = `
            <article class="luma-popup-card w-[220px] overflow-hidden rounded-xl text-foreground sm:w-[250px]">
              <div class="p-3.5">
                <div class="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em]" style="color:${clusterColor}">
                  <span class="h-1.5 w-1.5 rounded-full" style="background:${clusterColor}"></span>
                  ${language === 'id' ? 'Kelompok fasilitas' : 'Facility cluster'}
                </div>
                <h4 class="m-0 mt-1.5 text-[13px] font-bold leading-snug text-foreground">${group.count} ${language === 'id' ? 'fasilitas di area ini' : 'facilities in this area'}</h4>
                <ul class="m-0 mt-2 space-y-0.5 border-t border-border/70 pt-2 pl-4 text-[10.5px] leading-relaxed text-muted">
                  ${previewList}
                  ${moreCount}
                </ul>
                <p class="m-0 mt-2 text-[9.5px] font-semibold text-primary">${t('mapFirst.map.clusterHint')}</p>
              </div>
            </article>
          `

          const popup = new Popup({
            offset: 22,
            closeButton: false,
            closeOnClick: false,
            className: 'luma-facility-popup',
          }).setHTML(popupHtml)

          wrapperEl.addEventListener('mouseenter', () => {
            popup.setLngLat([group.lng, group.lat]).addTo(map)
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
            map.flyTo({
              center: [group.lng, group.lat],
              zoom: Math.min(map.getZoom() + 2.5, 17),
              duration: 600,
            })
          })

          const marker = new Marker({ element: wrapperEl, anchor: 'center' })
            .setLngLat([group.lng, group.lat])
            .addTo(map)

          markersMapRef.current[group.id] = { marker, innerEl, popup }
        } else {
          // Render Single Facility Pin
          const f = group.items[0]
          const { wrapperEl, innerEl } = createFacilityMarkerElement(f.category)
          const popupHtml = buildFacilityPopupHtml(f, {
            categoryLabel: f.subCategory || f.category,
            budget: t('mapFirst.map.funding'),
            airQuality: t('mapFirst.map.airQuality'),
          })

          const popup = new Popup({
            offset: 22,
            closeButton: false,
            closeOnClick: false,
            className: 'luma-facility-popup',
          }).setHTML(popupHtml)

          wrapperEl.addEventListener('mouseenter', () => {
            popup.setLngLat([group.lng, group.lat]).addTo(map)
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
            .setLngLat([group.lng, group.lat])
            .addTo(map)

          markersMapRef.current[f.id] = { marker, innerEl, popup }
        }
      })
    }

    renderMarkers()

    // Rekalkulasi klaster secara dinamis saat pengguna zoom in / zoom out
    map.on('zoomend', renderMarkers)

    return () => {
      map.off('zoomend', renderMarkers)
      clearOldMarkers()
    }
  }, [facilities, selectedWilayah, isLoaded, onSelectFacility, onFacilitySelect, onOpenDetail, onSelectWilayah, t, language])

  // =========================================================================
  // DYNAMIC TRANSIT, BOUNDARY HIGHLIGHT & DIMMING FILTER
  // =========================================================================
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return
    const map = mapRef.current

    const isLayer2 = Boolean(selectedWilayah && selectedWilayah !== 'ALL')
    const activeCity = isLayer2 ? CITY_AGGREGATES.find((c) => c.code === selectedWilayah) : null

    // 0. Visibilitas Jalur Pipa Air Bersih PAM JAYA
    const waterVisibility = showWaterNetwork ? 'visible' : 'none'
    if (map.getLayer('water-network-glow')) {
      map.setLayoutProperty('water-network-glow', 'visibility', waterVisibility)
    }
    if (map.getLayer('water-network-line')) {
      map.setLayoutProperty('water-network-line', 'visibility', waterVisibility)
    }
    if (map.getLayer('water-facilities-circle')) {
      map.setLayoutProperty('water-facilities-circle', 'visibility', waterVisibility)
    }
    if (map.getLayer('water-facilities-label')) {
      map.setLayoutProperty('water-facilities-label', 'visibility', waterVisibility)
    }

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

      // Halte / Stasiun untuk rute yang difokuskan (Deduplicated with interchange support)
      if (map.getLayer('transit-stations-circle')) {
        map.setLayerZoomRange('transit-stations-circle', 0, 24)
        map.setLayoutProperty('transit-stations-circle', 'visibility', 'visible')
        map.setFilter('transit-stations-circle', [
          'any',
          ['==', ['get', 'koridor'], targetKoridor],
          ['==', ['get', 'line'], targetShort],
          ['in', targetKoridor, ['get', 'allKoridors']],
          ['in', targetShort, ['get', 'allLines']],
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

      // 3. Titik Halte / Stasiun: Tampilkan halte jika showTransit aktif (Zero Double Pin & minzoom 12.3)
      if (map.getLayer('transit-stations-circle')) {
        map.setLayerZoomRange('transit-stations-circle', 12.3, 24)
        if (showTransit) {
          map.setLayoutProperty('transit-stations-circle', 'visibility', 'visible')
          if (isLayer2 && activeCity) {
            map.setFilter('transit-stations-circle', ['==', ['get', 'wilayah'], selectedWilayah])
          } else {
            // Tampilkan semua halte unik di seluruh DKI Jakarta
            map.setFilter('transit-stations-circle', null)
          }
          map.setPaintProperty('transit-stations-circle', 'circle-opacity', 0.95)
          map.setPaintProperty('transit-stations-circle', 'circle-color', ['get', 'color'])
        } else {
          map.setLayoutProperty('transit-stations-circle', 'visibility', 'none')
        }
      }
    }

    // 4. Highlight Batas Kota Terpilih & Dimming Wilayah Luar
    if (map.getLayer('jakarta-city-dim-fill')) {
      map.setFilter(
        'jakarta-city-dim-fill',
        isLayer2 && activeCity ? ['!=', 'NAME_2', activeCity.subdistrictName] : ['==', 'NAME_2', '']
      )
    }
    if (map.getLayer('jakarta-city-focus-fill')) {
      map.setFilter(
        'jakarta-city-focus-fill',
        isLayer2 && activeCity ? ['==', 'NAME_2', activeCity.subdistrictName] : ['==', 'NAME_2', '']
      )
    }
    if (map.getLayer('jakarta-city-focus-glow')) {
      map.setFilter(
        'jakarta-city-focus-glow',
        isLayer2 && activeCity ? ['==', 'NAME_2', activeCity.subdistrictName] : ['==', 'NAME_2', '']
      )
    }
    if (map.getLayer('jakarta-city-focus-line')) {
      map.setFilter(
        'jakarta-city-focus-line',
        isLayer2 && activeCity ? ['==', 'NAME_2', activeCity.subdistrictName] : ['==', 'NAME_2', '']
      )
    }
  }, [showWaterNetwork, showTransit, activeTransitModes, selectedWilayah, focusedCorridorId, mapMode, isLoaded])

  // Update status visual seleksi tanpa merecreate marker di DOM
  useEffect(() => {
    Object.entries(markersMapRef.current).forEach(([facilityId, { innerEl }]) => {
      const isSelected = selectedFacilityId === facilityId
      if (isSelected) {
        innerEl.style.width = '34px'
        innerEl.style.height = '34px'
        innerEl.classList.add('ring-4', 'ring-primary', 'ring-offset-2', 'scale-115')
      } else {
        innerEl.style.width = '30px'
        innerEl.style.height = '30px'
        innerEl.classList.remove('ring-4', 'ring-primary', 'ring-offset-2', 'scale-115')
      }
    })
  }, [selectedFacilityId])

  // Ganti Mode Kanvas (Light Canvas vs Dark Canvas vs Satelit) tanpa reload map.setStyle()
  // Menghindari penghancuran layer kustom dan kedipan canvas kosong
  const switchMode = useCallback(
    (mode: MapMode) => {
      if (!mapRef.current || mode === mapMode) return
      setMapMode(mode)
      modeRef.current = mode

      const map = mapRef.current
      const isLight = mode === 'light'
      const isDark = mode === 'dark'
      const isSat = mode === 'satellite'

      if (map.getLayer('esri-light-base-layer')) {
        map.setLayoutProperty('esri-light-base-layer', 'visibility', isLight ? 'visible' : 'none')
      }
      if (map.getLayer('esri-light-ref-layer')) {
        map.setLayoutProperty('esri-light-ref-layer', 'visibility', isLight ? 'visible' : 'none')
      }
      if (map.getLayer('esri-dark-base-layer')) {
        map.setLayoutProperty('esri-dark-base-layer', 'visibility', isDark ? 'visible' : 'none')
      }
      if (map.getLayer('esri-dark-ref-layer')) {
        map.setLayoutProperty('esri-dark-ref-layer', 'visibility', isDark ? 'visible' : 'none')
      }
      if (map.getLayer('esri-satellite-layer')) {
        map.setLayoutProperty('esri-satellite-layer', 'visibility', isSat ? 'visible' : 'none')
      }

      applyJakartaBoundary(map, mode)
      syncCityMarkersRef.current()
    },
    [mapMode]
  )

  // Tema kanvas mengikuti kontrol tema global di header. Mode satelit tetap
  // dipertahankan sampai user menonaktifkannya melalui satu tombol peta.
  useEffect(() => {
    if (mapMode !== 'satellite' && mapMode !== themeMapMode) {
      switchMode(themeMapMode)
    }
  }, [mapMode, switchMode, themeMapMode])

  const handleResetView = useCallback(() => {
    if (!mapRef.current) return
    onSelectWilayahRef.current?.('ALL')
    mapRef.current.flyTo({
      center: initialCenter,
      zoom: initialZoom,
      essential: true,
    })
    setTimeout(() => {
      syncCityMarkersRef.current?.()
    }, 150)
  }, [initialCenter, initialZoom])

  return (
    <div
      style={height !== '100%' ? { height } : undefined}
      className={`relative w-full h-full overflow-hidden ${className}`}
      data-tour="map-canvas"
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
              <Skeleton className="h-8 w-24 rounded-xl bg-surface border border-border/80 shadow-xs" />
            </div>
          </div>
        </div>
      )}

      {/* Floating Control Stack di Kanan Bawah: Zoom (+/-/Reset) dan di bawahnya Mode 3-Icon Switcher */}
      <div data-tour="map-controls" className="pointer-events-auto absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
        {/* Kontrol Navigasi (Zoom In, Zoom Out, Reset Pandangan) */}
        <div className="flex flex-col rounded-xl border border-border bg-surface shadow-md overflow-hidden">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="flex h-8 w-8 items-center justify-center text-foreground hover:bg-surface-muted transition-colors border-b border-border text-base font-bold cursor-pointer"
            title={t('mapFirst.map.zoomIn')}
            aria-label={t('mapFirst.map.zoomIn')}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="flex h-8 w-8 items-center justify-center text-foreground hover:bg-surface-muted transition-colors border-b border-border text-base font-bold cursor-pointer"
            title={t('mapFirst.map.zoomOut')}
            aria-label={t('mapFirst.map.zoomOut')}
          >
            −
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="flex h-8 w-8 items-center justify-center text-primary hover:bg-surface-muted transition-colors cursor-pointer"
            title={t('mapFirst.map.reset')}
            aria-label={t('mapFirst.map.reset')}
          >
            <TargetIcon size={15} />
          </button>
        </div>

        {/* Satu kontrol tambahan untuk beralih antara kanvas tema dan citra satelit. */}
        <button
          type="button"
          onClick={() => switchMode(mapMode === 'satellite' ? themeMapMode : 'satellite')}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border shadow-md transition-colors cursor-pointer ${
            mapMode === 'satellite'
              ? 'border-primary/70 bg-primary text-on-primary hover:bg-primary-hover'
              : 'border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground'
          }`}
          title={mapMode === 'satellite' ? t('mapFirst.map.canvas') : t('mapFirst.map.satellite')}
          aria-label={mapMode === 'satellite' ? t('mapFirst.map.canvas') : t('mapFirst.map.satellite')}
        >
          <SatelliteIcon size={14} className="shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
