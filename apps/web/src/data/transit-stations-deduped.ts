import transitNetwork from './transit-network.json'
import type { Facility } from '../lib/api'

export interface StationProperties {
  id: string
  name: string
  line: string
  lines: string[]
  allLines: string
  koridor: string
  koridors: string[]
  allKoridors: string
  lokasi?: string
  tipeAkses?: string
  tahunDibangun?: string
  mode: string
  color: string
  isInterchange: boolean
  interchangeWith: string[]
  wilayah: string
}

export interface StationFeature {
  type: 'Feature'
  id: string
  properties: StationProperties
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

export interface StationsFeatureCollection {
  type: 'FeatureCollection'
  features: StationFeature[]
}

function cleanKeywords(name: string): string {
  return name
    .toLowerCase()
    .replace(
      /\b(halte|transjakarta|stasiun|terminal|integrasi|sentra|transit|terpadu|brt|busway|mrt|lrt|krl|kai|beos|dermaga|pelabuhan|arah|barat|timur|utara|selatan|raya|utama|rujukan)\b/g,
      ''
    )
    .replace(/\s+(astra|bca|grab|bni)$/i, '')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Deduplicates raw BRT halte from transit-network.json and ensures:
 * 1. Halte served by multiple corridors are merged into a single unique pin with aggregated corridor metadata.
 * 2. Halte that are already rendered as curated facility markers in Layer 2 are excluded to prevent duplicate pins.
 */
export function buildDeduplicatedStations(facilities: Facility[] = []): StationsFeatureCollection {
  const rawFeatures = ((transitNetwork.stations?.features ?? []) as unknown) as Array<{
    type: 'Feature'
    id: string
    properties: Record<string, unknown>
    geometry: { type: 'Point'; coordinates: [number, number] }
  }>

  // 1. Deduplicate raw stations by cleaned keywords and proximity (< 60m)
  const uniqueMap = new Map<string, StationFeature>()

  rawFeatures.forEach((feat) => {
    const rawProps = feat.properties || {}
    const name = String(rawProps.name || '')
    const koridor = String(rawProps.koridor || '')
    const line = String(rawProps.line || '')
    const normKey = cleanKeywords(name)
    const [lng, lat] = feat.geometry.coordinates

    let matchedKey: string | null = null

    for (const [key, existing] of uniqueMap.entries()) {
      const existingNorm = cleanKeywords(existing.properties.name)
      const [eLng, eLat] = existing.geometry.coordinates
      const dLat = Math.abs(eLat - lat)
      const dLng = Math.abs(eLng - lng)
      const distApproxM = Math.sqrt(dLat * dLat + dLng * dLng) * 111000

      if (existingNorm === normKey || distApproxM < 60) {
        matchedKey = key
        break
      }
    }

    if (matchedKey) {
      const existing = uniqueMap.get(matchedKey)!
      const currentKoridors = existing.properties.koridors
      if (koridor && !currentKoridors.includes(koridor)) {
        currentKoridors.push(koridor)
      }
      const currentLines = existing.properties.lines
      if (line && !currentLines.includes(line)) {
        currentLines.push(line)
      }
      existing.properties.isInterchange = currentKoridors.length > 1
      existing.properties.allLines = currentLines.join(' • ')
      existing.properties.allKoridors = currentKoridors.join(', ')
    } else {
      const stationFeature: StationFeature = {
        type: 'Feature',
        id: String(rawProps.id || `station-${lng}-${lat}`),
        properties: {
          id: String(rawProps.id || `station-${lng}-${lat}`),
          name,
          line,
          lines: line ? [line] : [],
          allLines: line,
          koridor,
          koridors: koridor ? [koridor] : [],
          allKoridors: koridor,
          lokasi: rawProps.lokasi ? String(rawProps.lokasi) : undefined,
          tipeAkses: rawProps.tipeAkses ? String(rawProps.tipeAkses) : undefined,
          tahunDibangun: rawProps.tahunDibangun ? String(rawProps.tahunDibangun) : undefined,
          mode: String(rawProps.mode || 'transjakarta'),
          color: String(rawProps.color || '#2563eb'),
          isInterchange: false,
          interchangeWith: Array.isArray(rawProps.interchangeWith)
            ? (rawProps.interchangeWith as string[])
            : [],
          wilayah: String(rawProps.wilayah || 'JAKARTA PUSAT'),
        },
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      }
      uniqueMap.set(stationFeature.id, stationFeature)
    }
  })

  // 2. Filter out stations that overlap with existing transum facility markers
  const transumFacilities = facilities.filter(
    (f) => f.category === 'transum' || f.category === 'transportasi'
  )

  const dedupedList = Array.from(uniqueMap.values()).filter((st) => {
    const stKey = cleanKeywords(st.properties.name)
    const [sLng, sLat] = st.geometry.coordinates

    const hasDuplicateFacility = transumFacilities.some((fac) => {
      const facKey = cleanKeywords(fac.name)
      const dLat = Math.abs(fac.lat - sLat)
      const dLng = Math.abs(fac.lng - sLng)
      const distApproxM = Math.sqrt(dLat * dLat + dLng * dLng) * 111000

      // Match jika keyword inti sama (misal harmoni, tosari, ragunan, kalideres, grogol, pgc)
      // dan jaraknya dalam radius koridor wajar (< 650m), atau jika koordinatnya sangat dekat (< 150m)
      const isDirectNameMatch =
        facKey.length >= 3 &&
        stKey.length >= 3 &&
        (facKey.includes(stKey) || stKey.includes(facKey))

      return (isDirectNameMatch && distApproxM < 650) || distApproxM < 150
    })

    return !hasDuplicateFacility
  })

  return {
    type: 'FeatureCollection',
    features: dedupedList,
  }
}
