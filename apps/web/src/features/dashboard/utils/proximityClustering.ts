export interface ClusterableItem {
  id: string
  lat: number
  lng: number
  name: string
  category: string
  subCategory?: string | null
}

export interface ClusteredItem<T extends ClusterableItem> {
  id: string
  lat: number
  lng: number
  items: T[]
  count: number
  isCluster: boolean
}

/**
 * Calculates approximate distance in meters between two lat/lng coordinates (Haversine formula).
 */
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Groups nearby items into clusters based on zoom level.
 * Below threshold, nearby points merge into a cluster.
 * At high zoom (micro scope >= 16), items uncluster, and nearly identical points receive slight radial offsets.
 */
export function clusterNearbyItems<T extends ClusterableItem>(
  items: T[],
  zoom = 13
): ClusteredItem<T>[] {
  if (items.length === 0) return []

  // Dynamic distance threshold based on zoom level (meters)
  // Zoom 11: ~1200m, Zoom 12: ~600m, Zoom 13: ~350m, Zoom 14: ~180m, Zoom 15: ~90m, Zoom 16+: unclustered
  let clusterRadiusMeters = 0
  if (zoom < 11.5) {
    clusterRadiusMeters = 1400
  } else if (zoom < 12.5) {
    clusterRadiusMeters = 700
  } else if (zoom < 13.5) {
    clusterRadiusMeters = 380
  } else if (zoom < 14.5) {
    clusterRadiusMeters = 180
  } else if (zoom < 15.5) {
    clusterRadiusMeters = 90
  }

  // Micro scope: do not cluster, but apply micro radial spiderfy to overlapping points (< 15 meters)
  if (clusterRadiusMeters === 0) {
    const results: ClusteredItem<T>[] = []
    const visited = new Set<string>()

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (visited.has(item.id)) continue

      const overlapping: T[] = [item]
      visited.add(item.id)

      for (let j = i + 1; j < items.length; j++) {
        const other = items[j]
        if (visited.has(other.id)) continue
        if (getDistanceMeters(item.lat, item.lng, other.lat, other.lng) < 20) {
          overlapping.push(other)
          visited.add(other.id)
        }
      }

      if (overlapping.length === 1) {
        results.push({
          id: item.id,
          lat: item.lat,
          lng: item.lng,
          items: [item],
          count: 1,
          isCluster: false,
        })
      } else {
        // Spiderfy overlapping points slightly in a circle (~18 meters offset)
        const offsetRadius = 0.00018 // ~18m in lat/lng degrees
        const angleStep = (2 * Math.PI) / overlapping.length
        overlapping.forEach((ov, idx) => {
          const angle = idx * angleStep
          results.push({
            id: ov.id,
            lat: ov.lat + offsetRadius * Math.sin(angle),
            lng: ov.lng + offsetRadius * Math.cos(angle),
            items: [ov],
            count: 1,
            isCluster: false,
          })
        })
      }
    }
    return results
  }

  // Clustering for zoom < 15.5
  const clusters: ClusteredItem<T>[] = []
  const assigned = new Set<string>()

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (assigned.has(item.id)) continue

    const clusterItems: T[] = [item]
    assigned.add(item.id)

    let sumLat = item.lat
    let sumLng = item.lng

    for (let j = i + 1; j < items.length; j++) {
      const candidate = items[j]
      if (assigned.has(candidate.id)) continue

      const dist = getDistanceMeters(item.lat, item.lng, candidate.lat, candidate.lng)
      if (dist <= clusterRadiusMeters) {
        clusterItems.push(candidate)
        assigned.add(candidate.id)
        sumLat += candidate.lat
        sumLng += candidate.lng
      }
    }

    const count = clusterItems.length
    clusters.push({
      id: count > 1 ? `cluster-${item.id}-${count}` : item.id,
      lat: sumLat / count,
      lng: sumLng / count,
      items: clusterItems,
      count,
      isCluster: count > 1,
    })
  }

  return clusters
}
