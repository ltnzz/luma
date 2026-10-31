import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  Map as MapLibreMap,
  Marker,
  Popup,
  GeoJSONSource,
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
import { TargetIcon, SunIcon, MoonIcon, SatelliteIcon, MapPinIcon, SearchIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons'
import { MapLegend } from './MapLegend'
import { useTranslation } from '../../i18n/useTranslation'
import { Snackbar, type SnackbarTone } from './Snackbar'
import {
  CATEGORY_COLORS,
  CATEGORY_LABEL_KEYS,
  DEFAULT_CATEGORY_COLOR,
  FACILITY_CATEGORIES,
  buildFacilityPointCollection,
  buildFacilityPopupHtml,
  createFacilityMarkerElement,
  filterFacilities,
  isFacilityFilterActive,
  normalizeCategoryKey,
  type FacilityCategoryFilter,
  type FacilityPointCollection,
  type FacilityPopupTexts,
  type FacilityCategory,
} from './map-marker'
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
  // Endpoint glyph untuk text layers (label angka cluster). Fontstack
  // "Open Sans Regular/Bold" merupakan pbf yang tersedia di CDN openmaptiles.
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
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
  // "Open Sans Bold" merupakan pbf yang tersedia di CDN openmaptiles (range 0-255).
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
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
  // "Open Sans Bold" (glyph pbf tersedia di CDN openmaptiles).
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
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

/* ------------------------------------------------------------------ */
/* Smart Marker Cluster (Layer 1 — tampilan seluruh DKI)                */
/* ------------------------------------------------------------------ */
const FACILITY_CLUSTER_SOURCE = 'facility-cluster-source'
const FACILITY_CLUSTER_POINT = 'facility-cluster-point'
const FACILITY_CLUSTER_CIRCLE = 'facility-cluster-circle'
const FACILITY_CLUSTER_LABEL = 'facility-cluster-label'
const FACILITY_CLUSTER_LAYER_IDS = [FACILITY_CLUSTER_POINT, FACILITY_CLUSTER_CIRCLE, FACILITY_CLUSTER_LABEL]

// Zoom awal tampilan DKI = 11.6 — cluster tetap aktif hingga zoom 12; di atas
// itu cluster terurai menjadi titik individual berwarna kategori.
const FACILITY_CLUSTER_MAX_ZOOM = 12
const FACILITY_CLUSTER_RADIUS_PX = 60
const FACILITY_CLUSTER_MIN_POINTS = 2

/* ------------------------------------------------------------------ */
/* Lokasi Saya (browser Geolocation API)                                */
/* ------------------------------------------------------------------ */
const USER_ACCURACY_SOURCE = 'user-location-accuracy'
const USER_ACCURACY_FILL = 'user-location-accuracy-fill'
const USER_ACCURACY_LINE = 'user-location-accuracy-line'

/** Circle akurasi dalam meter (polygon geodesik sederhana, 48 segmen). */
function buildAccuracyCircleFeature(lngLat: [number, number], radiusMeters: number) {
  const [lng, lat] = lngLat
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || !(radiusMeters > 0)) return null
  const metersPerDegLat = 111_320
  const metersPerDegLng = Math.max(metersPerDegLat * Math.cos((lat * Math.PI) / 180), 1)
  const points: Array<[number, number]> = []
  for (let index = 0; index < 48; index += 1) {
    const theta = (index / 48) * Math.PI * 2
    points.push([
      lng + (radiusMeters * Math.cos(theta)) / metersPerDegLng,
      lat + (radiusMeters * Math.sin(theta)) / metersPerDegLat,
    ])
  }
  points.push(points[0])
  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [points],
        },
      },
    ],
  }
}

/** User marker element — dibuat berbeda dari marker fasilitas (amber + ping halo). */
function createUserLocationElement(): HTMLDivElement {
  const el = document.createElement('div')
  el.className = 'relative flex h-8 w-8 items-center justify-center'
  el.innerHTML = `
    <span class="absolute h-6 w-6 animate-ping rounded-full bg-amber-400 opacity-50"></span>
    <span class="relative h-4 w-4 rounded-full border-2 border-white bg-amber-500 shadow-md"></span>`
  return el
}

/**
 * Reapply source & layer akurasi (mis. setelah style reload basemap) dan
 * menggambar ulang circle dari lokasi ter-cache, sehingga accuracy circle
 * tidak hilang saat light/dark/satellite berganti.
 */
function applyUserAccuracy(
  map: MapLibreMap,
  cachedLocation: {
    lngLat: [number, number]
    accuracy: number | null
  } | null,
) {
  applyUserAccuracyLayers(map)
  if (!cachedLocation?.accuracy) return
  const circle = buildAccuracyCircleFeature(cachedLocation.lngLat, cachedLocation.accuracy)
  if (!circle) return
  const source = map.getSource(USER_ACCURACY_SOURCE)
  if (source instanceof GeoJSONSource) {
    source.setData(circle as unknown as GeoJSONData)
  }
}

/** Accuracy source & layers (disetel setelah fix diterima, reapply saat style.load). */
function applyUserAccuracyLayers(map: MapLibreMap) {
  try {
    if (!map.getSource(USER_ACCURACY_SOURCE)) {
      map.addSource(USER_ACCURACY_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] } as unknown as GeoJSONData,
      })
    }
    if (!map.getLayer(USER_ACCURACY_FILL)) {
      map.addLayer({
        id: USER_ACCURACY_FILL,
        type: 'fill',
        source: USER_ACCURACY_SOURCE,
        paint: {
          'fill-color': '#f59e0b',
          'fill-opacity': 0.12,
        },
      })
    }
    if (!map.getLayer(USER_ACCURACY_LINE)) {
      map.addLayer({
        id: USER_ACCURACY_LINE,
        type: 'line',
        source: USER_ACCURACY_SOURCE,
        paint: {
          'line-color': '#f59e0b',
          'line-width': 1.5,
          'line-opacity': 0.9,
        },
      })
    }
  } catch (err) {
    console.error('[applyUserAccuracyLayers error]', err)
  }
}

/* ------------------------------------------------------------------ */
/* Reset ke batas DKI Jakarta (bounds aktual dari jakarta-boundary.json) */
/* Sumber: MultiPolygon boundary; koordinat bbox dihitung dari seluruh   */
/* ring. Terverifikasi: [106.3832, -6.3708] s.d. [106.9728, -5.1843]     */
/* (termasuk Kep. Seribu). Fallback di bawah hanya penjagaan ekstrem.    */
/* ------------------------------------------------------------------ */
const JAKARTA_BOUNDARY_PADDING = { top: 40, bottom: 88, left: 40, right: 48 }

const JAKARTA_BOUNDARY_BOUNDS: [[number, number], [number, number]] = (() => {
  try {
    const geometry = (
      jakartaBoundary as {
        features?: Array<{ geometry?: { type?: string; coordinates?: number[][][][] } }>
      }
    ).features?.[0]?.geometry
    if (geometry?.type !== 'MultiPolygon' || !geometry.coordinates) {
      throw new Error('Unexpected jakarta boundary geometry')
    }
    let minLng = Infinity
    let minLat = Infinity
    let maxLng = -Infinity
    let maxLat = -Infinity
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        for (const pair of ring) {
          const lng = pair[0]
          const lat = pair[1]
          if (lng < minLng) minLng = lng
          if (lng > maxLng) maxLng = lng
          if (lat < minLat) minLat = lat
          if (lat > maxLat) maxLat = lat
        }
      }
    }
    if (minLng !== Infinity && maxLng > minLng && maxLat > minLat) {
      return [
        [minLng, minLat],
        [maxLng, maxLat],
      ]
    }
  } catch (err) {
    console.error('[jakarta bounds calc]', err)
  }
  return [
    [106.65, -6.4],
    [107.02, -5.86],
  ]
})()

// Palet cluster mengikuti design tokens Luma (styles/tokens.css) per mode peta.
function getClusterPalette(mode: MapMode) {
  if (mode === 'dark') {
    return { fill: '#143120', stroke: '#22c55e', text: '#86efac', halo: '#143120' }
  }
  if (mode === 'satellite') {
    return { fill: '#dcfce7', stroke: '#4ade80', text: '#14532d', halo: '#dcfce7' }
  }
  return { fill: '#dcfce7', stroke: '#16a34a', text: '#14532d', halo: '#dcfce7' }
}

// Warna titik individual mengikuti warna kategori fasilitas (sama dengan DOM marker).
function buildClusterPointColorExpression(): ExpressionSpecification {
  const stops: unknown[] = []
  for (const category of FACILITY_CATEGORIES) {
    stops.push(category, CATEGORY_COLORS[category])
  }
  stops.push(DEFAULT_CATEGORY_COLOR)
  return ['match', ['get', 'category'], ...stops] as unknown as ExpressionSpecification
}

/**
 * Helper menambahkan source & layers clustering (aman dipanggil ulang, mis.
 * setelah style.load saat pindah basemap). Warna mengikuti mode peta saat ini.
 */
function applyFacilityClusterLayers(map: MapLibreMap, mode: MapMode, visible: boolean) {
  try {
    const palette = getClusterPalette(mode)
    const layoutVisibility = { visibility: visible ? ('visible' as const) : ('none' as const) }

    if (!map.getSource(FACILITY_CLUSTER_SOURCE)) {
      map.addSource(FACILITY_CLUSTER_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] } as unknown as GeoJSONData,
        cluster: true,
        clusterRadius: FACILITY_CLUSTER_RADIUS_PX,
        clusterMaxZoom: FACILITY_CLUSTER_MAX_ZOOM,
        clusterMinPoints: FACILITY_CLUSTER_MIN_POINTS,
      })
    }

    // 1. Titik individual (sisa cluster yang terurai) — warna kategori fasilitas
    if (!map.getLayer(FACILITY_CLUSTER_POINT)) {
      map.addLayer({
        id: FACILITY_CLUSTER_POINT,
        type: 'circle',
        source: FACILITY_CLUSTER_SOURCE,
        layout: { ...layoutVisibility },
        paint: {
          'circle-color': buildClusterPointColorExpression(),
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 7,
            15, 10,
          ],
          'circle-opacity': 0.95,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })
    }

    // 2. Lingkaran cluster — ukuran dibedakan berdasarkan jumlah titik
    if (!map.getLayer(FACILITY_CLUSTER_CIRCLE)) {
      map.addLayer({
        id: FACILITY_CLUSTER_CIRCLE,
        type: 'circle',
        source: FACILITY_CLUSTER_SOURCE,
        filter: ['has', 'point_count'],
        layout: { ...layoutVisibility },
        paint: {
          'circle-color': palette.fill,
          'circle-opacity': 0.95,
          'circle-stroke-color': palette.stroke,
          'circle-stroke-width': 2.5,
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18,
            15, 22,
            30, 28,
          ] as unknown as ExpressionSpecification,
        },
      })
    }

    // 3. Label angka cluster (terbaca di desktop & mobile, halo untuk kontras)
    if (!map.getLayer(FACILITY_CLUSTER_LABEL)) {
      map.addLayer({
        id: FACILITY_CLUSTER_LABEL,
        type: 'symbol',
        source: FACILITY_CLUSTER_SOURCE,
        filter: ['has', 'point_count'],
        layout: {
          ...layoutVisibility,
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': palette.text,
          'text-halo-color': palette.halo,
          'text-halo-width': 1,
        },
      })
    }

    for (const layerId of FACILITY_CLUSTER_LAYER_IDS) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', layoutVisibility.visibility)
      }
    }
  } catch (err) {
    console.error('[applyFacilityClusterLayers error]', err)
  }
}

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
  onSelectWilayah?: (wilayah: string, options?: { skipFocus?: boolean }) => void
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

  /* Geolocation state */
  const [isLocating, setIsLocating] = useState(false)
  const userMarkerRef = useRef<{ marker: Marker; lngLat: [number, number] } | null>(null)
  const userLocationRef = useRef<{
    lngLat: [number, number]
    accuracy: number | null
  } | null>(null)
  const snackbarTimerRef = useRef<number | null>(null)
  const [snackbar, setSnackbar] = useState<{
    tone: SnackbarTone
    title: string
    message?: string
  } | null>(null)

  const { t, language } = useTranslation()
  const tRef = useRef(t)
  const onOpenDetailRef = useRef(onOpenDetail)
  const onSelectFacilityRef = useRef(onSelectFacility ?? onFacilitySelect)
  // ID fasilitas yang popup-nya "pinned" (dibuka via click/tap) — popup hover
  // dirupakan sementara dan tidak menimpa popup pinned.
  const pinnedFacilityIdRef = useRef<string | null>(null)
  // Handler untuk menutup semua popup fasilitas; di-set oleh effect Layer 2
  // dan dipanggil dari map click (init effect) tanpa re-render.
  const closeAllFacilityPopupsRef = useRef<() => void>(() => {})

  /* Smart Cluster (Layer 1) */
  const facilitiesRef = useRef(facilities)
  const facilityDataRef = useRef<FacilityPointCollection>({ type: 'FeatureCollection', features: [] })
  const showClustersRef = useRef(true)

  /* Quick Search & Category Filter (Fase D) */
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<FacilityCategoryFilter>('all')
  const isFilterActive = isFacilityFilterActive({ query: searchQuery, category: activeCategory })

  /* Affordance scroll pill kategori: tampilkan chevron hanya ketika row
     benar-benar overflow ke arah tersebut. Migration antara breakpoint
     (lebar & teks berubah) di-update juga via ResizeObserver. */
  const [pillCanScrollLeft, setPillCanScrollLeft] = useState(false)
  const [pillCanScrollRight, setPillCanScrollRight] = useState(false)
  const pillsScrollerRef = useRef<HTMLDivElement | null>(null)

  const updatePillScrollState = useCallback(() => {
    const el = pillsScrollerRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    // Threshold 4px: hindari flicker akibat pembulatan subpixel.
    setPillCanScrollLeft(el.scrollLeft > 4)
    setPillCanScrollRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4)
  }, [])

  useEffect(() => {
    updatePillScrollState()
    const el = pillsScrollerRef.current
    if (!el) return
    el.addEventListener('scroll', updatePillScrollState, { passive: true })
    const ro = new ResizeObserver(updatePillScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updatePillScrollState)
      ro.disconnect()
    }
  }, [updatePillScrollState])

  // Scroll pill satu "langkah" per klik (≈ ±120px; smooth agar sisi kanan jelas).
  const scrollPills = useCallback((direction: 'left' | 'right') => {
    const el = pillsScrollerRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'left' ? -120 : 120, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    facilitiesRef.current = facilities
  }, [facilities])

  useEffect(() => {
    tRef.current = t
  }, [t, language])

  useEffect(() => {
    onOpenDetailRef.current = onOpenDetail
  })

  useEffect(() => {
    onSelectFacilityRef.current = onSelectFacility ?? onFacilitySelect
  })

  // Teks popup bersama: dipakai DOM marker (Layer 2) & klik titik cluster terurai.
  const buildFacilityPopupTexts = useCallback((facility: Facility): FacilityPopupTexts => {
    const currentT = tRef.current
    const categoryKey: FacilityCategory | null = normalizeCategoryKey(facility.category)
    return {
      categoryLabel: categoryKey
        ? currentT(CATEGORY_LABEL_KEYS[categoryKey])
        : (facility.subCategory ?? facility.category),
      viewDetail: currentT('map.popup.viewDetail'),
      budget: currentT('map.popup.budget'),
      airQuality: currentT('map.popup.airQuality'),
    }
  }, [])

  // Fasilitas yang lolos quick search + category filter — SATU sumber kebenaran
  // untuk Layer 1 (GeoJSON cluster source) DAN Layer 2 (DOM markers), sehingga
  // jumlah hasil kedua layer selalu konsisten. Filter berjalan client-side
  // atas data yang sudah dimuat (tanpa request API per keystroke).
  const filteredFacilities = useMemo(
    () => filterFacilities(facilities, { query: searchQuery, category: activeCategory }),
    [facilities, searchQuery, activeCategory],
  )

  // FeatureCollection cluster — hanya dibangun ulang saat data fasilitas berubah.
  const facilityFeatureCollection = useMemo(
    () => buildFacilityPointCollection(filteredFacilities),
    [filteredFacilities],
  )

  // Set data ke cluster source (jika source sudah ada). Tidak ada fetch tambahan.
  const syncFacilityClusterData = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const source = map.getSource(FACILITY_CLUSTER_SOURCE)
    if (source instanceof GeoJSONSource) {
      source.setData(facilityDataRef.current as unknown as GeoJSONData)
    }
  }, [])

  // Sinkron visibility cluster (hidden saat Layer 2 / standalone mode).
  const syncFacilityClusterVisibility = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const visibility = showClustersRef.current ? 'visible' : 'none'
    for (const layerId of FACILITY_CLUSTER_LAYER_IDS) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility)
      }
    }
  }, [])

  useEffect(() => {
    facilityDataRef.current = facilityFeatureCollection
    if (!mapRef.current || !isLoaded) return
    syncFacilityClusterData()
  }, [facilityFeatureCollection, isLoaded, syncFacilityClusterData])

  // Flag clustered tampilan: Layer 1 (ALL / bukan standalone) → cluster visible.
  const isStandaloneMode = Boolean(onFacilitySelect && !onSelectWilayah)

  // Jumlah hasil yang konsisten dengan layer yang sedang terlihat:
  // Layer 1 (ALL / standalone) = seluruh DKI; Layer 2 = wilayah terpilih,
  // agar chip jumlah benar-benar cocok dengan marker yang tampak.
  const resultCount = useMemo(() => {
    if (isStandaloneMode || !selectedWilayah || selectedWilayah === 'ALL') {
      return filteredFacilities.length
    }
    return filteredFacilities.filter((f) => !f.wilayah || f.wilayah === selectedWilayah).length
  }, [filteredFacilities, selectedWilayah, isStandaloneMode])
  const showClusters = !isStandaloneMode && (!selectedWilayah || selectedWilayah === 'ALL')

  useEffect(() => {
    showClustersRef.current = showClusters
    if (!mapRef.current || !isLoaded) return
    syncFacilityClusterVisibility()
  }, [showClusters, isLoaded, syncFacilityClusterVisibility])

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
        // Smart Cluster: source & layers dibuat setelah style siap; data diambil
        // dari facilityDataRef (diperbarui effect data facilities).
        applyFacilityClusterLayers(map, modeRef.current, showClustersRef.current)
        syncFacilityClusterData()
        // Reapply layer akurasi + gambar ulang circle dari lokasi cached (jika ada).
        applyUserAccuracy(map, userLocationRef.current)
      }
    }

    map.on('style.load', () => {
      if (!isDisposed) {
        applyJakartaBoundary(map, modeRef.current)
        applyTransitLayers(map)
        // Reapply cluster juga di sini agar setelah pindah basemap
        // (light/dark/satellite) source & layers clustering tidak hilang
        // dan warna mengikuti mode baru.
        applyFacilityClusterLayers(map, modeRef.current, showClustersRef.current)
        syncFacilityClusterData()
        syncFacilityClusterVisibility()
        // Reapply layer akurasi + gambar ulang circle dari lokasi cached (jika ada).
        applyUserAccuracy(map, userLocationRef.current)
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

    /* ----------------------------------------------------------------
       Smart Cluster: cursor pointer + klik cluster = zoom halus.
       Handler terdaftar SEKALI di init effect (bukan per render marker) —
       layer baru dibuat setelah load pun tetap ter-serve oleh delegasi MapLibre.
       ---------------------------------------------------------------- */
    const setClusterPointer = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const resetClusterPointer = () => {
      map.getCanvas().style.cursor = ''
    }
    for (const layerId of [FACILITY_CLUSTER_CIRCLE, FACILITY_CLUSTER_LABEL]) {
      map.on('mouseenter', layerId, setClusterPointer)
      map.on('mouseleave', layerId, resetClusterPointer)
    }
    map.on('mouseenter', FACILITY_CLUSTER_POINT, setClusterPointer)
    map.on('mouseleave', FACILITY_CLUSTER_POINT, resetClusterPointer)

    const handleClusterClick = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      const clusterId = (feature?.properties as Record<string, unknown> | undefined)?.cluster_id
      if (typeof clusterId !== 'number') return
      const source = map.getSource(FACILITY_CLUSTER_SOURCE)
      if (!(source instanceof GeoJSONSource)) return
      source
        .getClusterExpansionZoom(clusterId)
        .then((expansionZoom) => {
          if (isDisposed) return
          const coords =
            feature?.geometry && feature.geometry.type === 'Point'
              ? ([...feature.geometry.coordinates] as [number, number])
              : undefined
          map.easeTo({
            center: coords,
            // Clamp agar tidak melewati maxZoom yang dikonfigurasi.
            zoom: Math.min(expansionZoom, maxZoom ?? 19),
            duration: 480,
            essential: true,
          })
        })
        .catch((err) => console.error('[facility cluster expansion]', err))
    }
    map.on('click', FACILITY_CLUSTER_CIRCLE, handleClusterClick)

    // Popup bersama untuk titik individual hasil cluster terurai (Layer 1).
    const clusterPointPopup = new Popup({ offset: 18, closeButton: false, closeOnClick: false })
    let clusterPointFacility: Facility | null = null

    const attachClusterPointPopupChrome = () => {
      const el = clusterPointPopup.getElement()
      if (!el || el.dataset.lumaPopupChrome === '1') return
      el.dataset.lumaPopupChrome = '1'
      const content = el.querySelector<HTMLElement>('.maplibregl-popup-content')
      if (content) {
        content.setAttribute(
          'style',
          'padding:0;background:transparent;box-shadow:none;overflow:hidden;border-radius:0.75rem;',
        )
      }
      el.addEventListener('mousedown', (e) => e.stopPropagation())
      el.addEventListener('pointerdown', (e) => e.stopPropagation())
      el.addEventListener('click', (e) => {
        const target = e.target instanceof HTMLElement ? e.target : null
        if (!target?.closest('[data-luma-popup-detail]')) return
        e.preventDefault()
        e.stopPropagation()
        clusterPointPopup.remove()
        if (clusterPointFacility) {
          onOpenDetailRef.current?.(clusterPointFacility)
        }
      })
    }

    const handleClusterPointClick = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      const facilityId = (feature?.properties as Record<string, unknown> | undefined)?.id
      if (typeof facilityId !== 'string') return
      const facility = facilitiesRef.current.find((f) => f.id === facilityId)
      if (!facility) return

      clusterPointFacility = facility
      clusterPointPopup
        .setHTML(buildFacilityPopupHtml(facility, buildFacilityPopupTexts(facility)))
        .setLngLat([facility.lng, facility.lat])
        .addTo(map)
      attachClusterPointPopupChrome()
      // Callback seleksi dipertahankan (ring/tanda terpilih, dsb.).
      onSelectFacilityRef.current?.(facility)
      // Detail TIDAK dibuka otomatis — tombol popup yang memanggil onOpenDetail.
    }
    map.on('click', FACILITY_CLUSTER_POINT, handleClusterPointClick)

    map.once('load', handleLoaded)
    map.once('idle', handleLoaded)
    map.on('error', (e) => {
      console.error('[MapLibre error]', e)
    })

    // Klik peta (area kosong) menutup popup fasilitas yang di-pin (pinned)
    // dan popup titik cluster.
    const handleMapBaseClick = () => {
      closeAllFacilityPopupsRef.current()
      clusterPointPopup.remove()
      clusterPointFacility = null
    }
    map.on('click', handleMapBaseClick)

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
      map.off('mouseenter', FACILITY_CLUSTER_CIRCLE, setClusterPointer)
      map.off('mouseleave', FACILITY_CLUSTER_CIRCLE, resetClusterPointer)
      map.off('mouseenter', FACILITY_CLUSTER_LABEL, setClusterPointer)
      map.off('mouseleave', FACILITY_CLUSTER_LABEL, resetClusterPointer)
      map.off('mouseenter', FACILITY_CLUSTER_POINT, setClusterPointer)
      map.off('mouseleave', FACILITY_CLUSTER_POINT, resetClusterPointer)
      map.off('click', FACILITY_CLUSTER_CIRCLE, handleClusterClick)
      map.off('click', FACILITY_CLUSTER_POINT, handleClusterPointClick)
      clusterPointPopup.remove()
      map.off('click', handleMapBaseClick)
      Object.values(markers).forEach(({ marker, popup }) => {
        popup.remove()
        marker.remove()
      })
      markersMapRef.current = {}
      Object.values(cityMarkers).forEach((marker) => {
        marker.remove()
      })
      cityMarkersRef.current = {}
      userMarkerRef.current?.marker.remove()
      userMarkerRef.current = null
      // Circle di-set lewat userLocationRef; harus dibersihkan juga agar
      // remount tidak menggambar accuracy circle tanpa marker.
      userLocationRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [initialCenter, initialZoom, minZoom, maxZoom, maxBounds, syncFacilityClusterData, syncFacilityClusterVisibility, buildFacilityPopupTexts])

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
      ? filteredFacilities
      : filteredFacilities.filter((f) => !f.wilayah || f.wilayah === selectedWilayah)

    const closeAllPopups = () => {
      pinnedFacilityIdRef.current = null
      Object.values(markersMapRef.current).forEach(({ popup }) => popup.remove())
    }
    // Didaftarkan agar map click (init effect) bisa menutup popup pinned.
    closeAllFacilityPopupsRef.current = closeAllPopups

    activeFacilities.forEach((f) => {
      const { wrapperEl, innerEl } = createFacilityMarkerElement(f.category)

      const popup = new Popup({ offset: 20, closeButton: false, closeOnClick: false })

      // Normalisasi chrome popup (padding/bg bawaan maplibre & proteksi drag)
      // sekali per popup element. HTML fasilitas diklik → onOpenDetail.
      const attachPopupChrome = () => {
        const popupEl = popup.getElement()
        if (!popupEl) return
        if (popupEl.dataset.lumaPopupChrome === '1') return
        popupEl.dataset.lumaPopupChrome = '1'

        const content = popupEl.querySelector<HTMLElement>('.maplibregl-popup-content')
        if (content) {
          content.setAttribute(
            'style',
            'padding:0;background:transparent;box-shadow:none;overflow:hidden;border-radius:0.75rem;',
          )
        }

        // Mencegah drag/pan peta tereksekusi saat berinteraksi dengan popup.
        popupEl.addEventListener('mousedown', (e) => e.stopPropagation())
        popupEl.addEventListener('pointerdown', (e) => e.stopPropagation())
        popupEl.addEventListener('click', (e) => {
          const target = e.target instanceof HTMLElement ? e.target : null
          if (!target?.closest('[data-luma-popup-detail]')) return
          e.preventDefault()
          e.stopPropagation()
          popup.remove()
          pinnedFacilityIdRef.current = null
          onOpenDetailRef.current?.(f)
        })
      }

      const showPopup = () => {
        if (!mapRef.current) return
        // Tutup popup fasilitas lain agar tidak menumpuk (mis. pinned pop-up lain).
        Object.entries(markersMapRef.current).forEach(([id, entry]) => {
          if (entry.popup === popup) return
          entry.popup.remove()
          if (pinnedFacilityIdRef.current === id) {
            pinnedFacilityIdRef.current = null
          }
        })
        popup
          .setHTML(buildFacilityPopupHtml(f, buildFacilityPopupTexts(f)))
          .setLngLat([f.lng, f.lat])
          .addTo(mapRef.current)
        attachPopupChrome()
      }

      // Hover membuka popup sementara; popup pinned (via click/tap) tidak
      // ditimpa hover — mouseleave hanya menutup popup transient.
      wrapperEl.addEventListener('mouseenter', () => {
        if (pinnedFacilityIdRef.current === f.id) return
        showPopup()
      })
      wrapperEl.addEventListener('mouseleave', () => {
        if (pinnedFacilityIdRef.current === f.id) return
        popup.remove()
      })

      wrapperEl.addEventListener('mousedown', (e) => e.stopPropagation())
      wrapperEl.addEventListener('pointerdown', (e) => e.stopPropagation())

      wrapperEl.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const wasPinned = pinnedFacilityIdRef.current === f.id
        closeAllPopups()
        if (!wasPinned) {
          showPopup()
          pinnedFacilityIdRef.current = f.id
        }
        // Callback seleksi tetap sesuai perilaku sebelumnya (dipertahankan).
        onSelectFacilityRef.current?.(f)
        onOpenDetailRef.current?.(f)
      })

      const marker = new Marker({ element: wrapperEl, anchor: 'center' })
        .setLngLat([f.lng, f.lat])
        .addTo(mapRef.current!)

      markersMapRef.current[f.id] = { marker, innerEl, popup }
    })

    const markers = markersMapRef.current
    return () => {
      pinnedFacilityIdRef.current = null
      closeAllFacilityPopupsRef.current = () => {}
      Object.values(markers).forEach(({ marker, popup }) => {
        popup.remove()
        marker.remove()
      })
      markersMapRef.current = {}
    }
  }, [filteredFacilities, selectedWilayah, isLoaded, onFacilitySelect, onSelectWilayah, buildFacilityPopupTexts])

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

  /* ----------------------------------------------------------------
     Snackbar feedback (komponen reusable, auto-hide)
     ---------------------------------------------------------------- */
  const showSnackbar = useCallback((tone: SnackbarTone, title: string, message?: string) => {
    if (snackbarTimerRef.current !== null) {
      window.clearTimeout(snackbarTimerRef.current)
    }
    setSnackbar({ tone, title, message })
    snackbarTimerRef.current = window.setTimeout(() => {
      setSnackbar(null)
      snackbarTimerRef.current = null
    }, 5000)
  }, [])

  useEffect(() => {
    return () => {
      if (snackbarTimerRef.current !== null) {
        window.clearTimeout(snackbarTimerRef.current)
        snackbarTimerRef.current = null
      }
    }
  }, [])

  // Menempatkan user marker + accuracy circle. Tidak disimpan ke backend /
  // localStorage, tidak dikirim ke API — hanya state memori sesi.
  const placeUserLocation = useCallback((lngLat: [number, number], accuracy: number | null) => {
    const map = mapRef.current
    if (!map) return

    // Bersihkan marker lama sebelum memasang yang baru.
    userMarkerRef.current?.marker.remove()
    userMarkerRef.current = null

    const marker = new Marker({
      element: createUserLocationElement(),
      anchor: 'center',
    })
      .setLngLat(lngLat)
      .addTo(map)

    userMarkerRef.current = { marker, lngLat }
    // Cache lokasi (memori sesi saja — tidak ke backend/localStorage/API);
    // dipakai untuk menggambar ulang accuracy circle setelah style reload.
    userLocationRef.current = { lngLat, accuracy }

    // Accuracy circle (geojson, meter) — reset jika radius tidak valid.
    const source = map.getSource(USER_ACCURACY_SOURCE)
    const circleFeature = accuracy ? buildAccuracyCircleFeature(lngLat, accuracy) : null
    if (source instanceof GeoJSONSource) {
      source.setData(
        (circleFeature ?? { type: 'FeatureCollection', features: [] }) as unknown as GeoJSONData,
      )
    }
  }, [])

  /* ----------------------------------------------------------------
     Lokasi Saya — geolocation hanya diminta SETELAH tombol ditekan.
     ---------------------------------------------------------------- */
  const handleLocateMe = useCallback(() => {
    const currentT = tRef.current
    if (!mapRef.current) {
      showSnackbar('warning', currentT('map.locate.title'), currentT('map.locate.mapNotReady'))
      return
    }
    if (!('geolocation' in navigator)) {
      showSnackbar('error', currentT('map.locate.title'), currentT('map.locate.unsupported'))
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const map = mapRef.current
        if (!map) return // siklus unmount: abaikan hasil telat

        const lngLat: [number, number] = [position.coords.longitude, position.coords.latitude]
        const accuracy = position.coords.accuracy ?? null
        placeUserLocation(lngLat, accuracy)

        map.flyTo({
          center: lngLat,
          zoom: Math.max(map.getZoom(), 15),
          duration: 1000,
          essential: true,
        })
        showSnackbar('success', currentT('map.locate.title'), currentT('map.locate.success'))
      },
      (error) => {
        setIsLocating(false)
        const t = tRef.current
        if (error.code === error.PERMISSION_DENIED) {
          showSnackbar('error', t('map.locate.denied'), t('map.locate.deniedDetail'))
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          showSnackbar('warning', t('map.locate.unavailable'), t('map.locate.unavailableDetail'))
        } else if (error.code === error.TIMEOUT) {
          showSnackbar('warning', t('map.locate.timeout'), t('map.locate.timeoutDetail'))
        } else {
          showSnackbar('warning', t('map.locate.unavailable'), t('map.locate.unavailableDetail'))
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    )
  }, [showSnackbar, placeUserLocation])

  /* ----------------------------------------------------------------
     Reset ke batas DKI Jakarta — bbox aktual dari jakarta-boundary.json.
     skipFocus memastikan parent TIDAK mem-set focusCoords baru sehingga
     external focus effect tidak menimpa fitBounds (kolisi ada di state parent).
     ---------------------------------------------------------------- */
  const handleResetView = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    onSelectWilayah?.('ALL', { skipFocus: true })
    map.fitBounds(JAKARTA_BOUNDARY_BOUNDS, {
      padding: JAKARTA_BOUNDARY_PADDING,
      maxZoom: initialZoom,
      duration: 900,
      essential: true,
    })
  }, [initialZoom, onSelectWilayah])

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
            <Skeleton className="h-10 w-48 rounded-full bg-surface border border-border/80 shadow-xs" />
            <Skeleton className="h-8 w-40 rounded-full bg-surface border border-border/80 shadow-xs" />
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

      {/* Quick Search & Category Filter (Fase D) — kanan atas; kiri/tengah atas
          dipakai widget dashboard. Filter bekerja client-side atas data yang
          sudah dimuat, memengaruhi Layer 1 (cluster) & Layer 2 (DOM markers).
          <480px tetap w-56 agar tidak overlap widget kiri; ≥480px lebar kolom
          mengikuti `min(20rem, 100vw-1.5rem)` — tidak pernah horizontal
          overflow halaman. */}
      <div className="pointer-events-auto absolute top-3 right-3 z-10 flex w-56 min-[480px]:w-[min(20rem,calc(100vw-1.5rem))] flex-col items-stretch gap-2 sm:top-4 sm:right-4">
        {/* Quick search — focus ring di container agar input tidak ber-outline
            "kotak" di dalam bentuk pill; state tetap di controlled input. */}
        <div className="flex h-10 items-center gap-2 rounded-full border border-border bg-surface/90 px-3.5 shadow-md shadow-black/5 backdrop-blur-md transition-colors hover:border-muted/50 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
          <SearchIcon size={15} className="shrink-0 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('')
                e.currentTarget.blur()
              }
            }}
            placeholder={t('map.search.placeholder')}
            aria-label={t('map.search.aria')}
            className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-foreground placeholder:font-normal placeholder:text-muted/90 focus:outline-none selection:bg-primary/20 selection:text-foreground"
          />
          {searchQuery.trim() !== '' && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              title={t('map.search.clear')}
              aria-label={t('map.search.clear')}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary cursor-pointer"
            >
              <CloseIcon size={12} />
            </button>
          )}
        </div>

        {/* Category filter pills — single-select, warna aktif konsisten dengan marker.
            Row scroll horizontal (TANPA wrap) dan SANGAT intentionally full-width,
            bukan right-aligned: right-align membuat pill pertama unreachable saat
            overflow di RTL/awal scroll. Chevron kiri/kanan + fade gradient muncul
            hanya ketika row benar-benar overflow di sisi itu, sehingga pengguna
            selalu tahu bila ada kategori di luar viewport. */}
        <div role="group" aria-label={t('map.filter.aria')} className="relative w-full">
          {/* Fade chevron kiri */}
          <div
            aria-hidden="true"
            className={
              'absolute inset-y-0 left-0 z-10 flex items-center pr-8 transition-opacity ' +
              (pillCanScrollLeft ? 'opacity-100' : 'pointer-events-none opacity-0')
            }
            style={{
              background:
                'linear-gradient(to right, var(--luma-background) 0%, transparent 100%)',
            }}
          >
            <button
              type="button"
              tabIndex={pillCanScrollLeft ? 0 : -1}
              onClick={() => scrollPills('left')}
              aria-label={t('map.filter.scrollLeft')}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-muted shadow-md backdrop-blur-md transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <ChevronLeftIcon size={13} />
            </button>
          </div>

          <div
            ref={pillsScrollerRef}
            className="flex w-full flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              aria-pressed={activeCategory === 'all'}
              className={`h-7 shrink-0 rounded-full border px-3 text-[11px] font-bold shadow-md transition-colors cursor-pointer ${
                activeCategory === 'all'
                  ? 'border-transparent bg-primary text-on-primary'
                  : 'border-border bg-surface/95 text-foreground backdrop-blur-md hover:bg-surface-muted'
              }`}
            >
              {t('map.filter.all')}
            </button>
            {FACILITY_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                className={`h-7 shrink-0 rounded-full border px-3 text-[11px] font-bold shadow-md transition-colors cursor-pointer ${
                  activeCategory === category
                    ? 'border-transparent text-white'
                    : 'border-border bg-surface/95 text-foreground backdrop-blur-md hover:bg-surface-muted'
                }`}
                style={
                  activeCategory === category
                    ? { backgroundColor: CATEGORY_COLORS[category] }
                    : undefined
                }
              >
                {t(`map.filter.${category}`)}
              </button>
            ))}
          </div>

          {/* Fade chevron kanan */}
          <div
            aria-hidden="true"
            className={
              'absolute inset-y-0 right-0 z-10 flex items-center pl-8 transition-opacity ' +
              (pillCanScrollRight ? 'opacity-100' : 'pointer-events-none opacity-0')
            }
            style={{
              background:
                'linear-gradient(to left, var(--luma-background) 0%, transparent 100%)',
            }}
          >
            <button
              type="button"
              tabIndex={pillCanScrollRight ? 0 : -1}
              onClick={() => scrollPills('right')}
              aria-label={t('map.filter.scrollRight')}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-muted shadow-md backdrop-blur-md transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <ChevronRightIcon size={13} />
            </button>
          </div>
        </div>

        {/* Jumlah hasil / empty state — hanya saat filter aktif */}
        {isFilterActive && (
          <div className="flex justify-end">
            {resultCount === 0 ? (
              <span
                role="status"
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface/95 px-3 py-1 text-[11px] font-semibold text-foreground shadow-md backdrop-blur-md"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
                {t('map.search.empty')}
              </span>
            ) : (
              <span
                role="status"
                className="rounded-full border border-border bg-surface/95 px-3 py-1 text-[11px] font-semibold text-foreground shadow-md backdrop-blur-md"
              >
                {resultCount} {t('map.search.resultsUnit')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Floating Control Stack di Kanan Bawah: Legend, Zoom (+/-), Mode 3-Icon Switcher & Reset */}
      <div className="pointer-events-auto absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
        {/* Visual Legend: konsisten dengan warna & ikon marker */}
        <MapLegend />

        {/* Kontrol Zoom (Lokasi Saya, +, -, Kompas) */}
        <div className="flex flex-col rounded-xl border border-border bg-surface shadow-md overflow-hidden">
          {/* Lokasi Saya — geolocation hanya diminta setelah tombol ditekan */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating || !isLoaded}
            className={`flex h-8 w-8 items-center justify-center text-foreground hover:bg-surface-muted transition-colors border-b border-border cursor-pointer ${
              isLocating ? 'opacity-60 cursor-wait' : ''
            }`}
            title={t('map.locate.title')}
            aria-label={t('map.locate.aria')}
          >
            {isLocating ? (
              <span
                aria-hidden="true"
                className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent"
              />
            ) : (
              <MapPinIcon size={14} className="text-primary" />
            )}
          </button>
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
            title={t('map.reset.viewTitle')}
            aria-label={t('map.reset.aria')}
          >
            <TargetIcon size={14} className="text-primary" />
            <span className="hidden sm:inline">{t('map.reset.short')}</span>
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

      {/* Snackbar feedback geolokasi (komponen reusable, auto-hide) */}
      <Snackbar
        isOpen={snackbar !== null}
        tone={snackbar?.tone ?? 'success'}
        title={snackbar?.title ?? ''}
        message={snackbar?.message}
      />
    </div>
  )
}
