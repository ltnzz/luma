const EXPECTED_CITY_NAMES = [
  'JakartaBarat',
  'JakartaPusat',
  'JakartaSelatan',
  'JakartaTimur',
  'JakartaUtara',
  'KepulauanSeribu',
] as const

interface BoundaryFeature {
  properties?: Record<string, unknown>
  geometry?: unknown
}

interface BoundaryCollection {
  type?: unknown
  features?: BoundaryFeature[]
}

export interface JakartaBoundaryValidation {
  featureCount: number
  cityNames: string[]
  isValidCityBoundary: boolean
  hasDistrictGeometry: boolean
  issues: string[]
}

/**
 * Validates the administrative level represented by the bundled GeoJSON.
 * The current dataset contains six NAME_2 city/regency polygons. A district
 * selector must not be enabled until every polygon provides a NAME_3 value.
 */
export function validateJakartaBoundaryData(
  collection: BoundaryCollection,
): JakartaBoundaryValidation {
  const features = Array.isArray(collection.features) ? collection.features : []
  const cityNames = features.flatMap((feature) => {
    const value = feature.properties?.NAME_2
    return typeof value === 'string' && value.trim() ? [value.trim()] : []
  })
  const districtNames = features.flatMap((feature) => {
    const value = feature.properties?.NAME_3
    return typeof value === 'string' && value.trim() ? [value.trim()] : []
  })

  const uniqueCityNames = [...new Set(cityNames)].sort()
  const expectedCityNames = [...EXPECTED_CITY_NAMES].sort()
  const hasExpectedCities =
    uniqueCityNames.length === expectedCityNames.length &&
    expectedCityNames.every((name, index) => name === uniqueCityNames[index])
  const hasGeometryForEveryFeature = features.every((feature) => Boolean(feature.geometry))
  const hasDistrictGeometry =
    features.length > 0 && districtNames.length === features.length

  const issues: string[] = []
  if (collection.type !== 'FeatureCollection') issues.push('GeoJSON type is not FeatureCollection')
  if (!hasExpectedCities) issues.push('City boundary names do not match the six DKI administrations')
  if (!hasGeometryForEveryFeature) issues.push('One or more city features have no geometry')
  if (!hasDistrictGeometry) issues.push('District-level NAME_3 polygons are not available')

  return {
    featureCount: features.length,
    cityNames: uniqueCityNames,
    isValidCityBoundary:
      collection.type === 'FeatureCollection' && hasExpectedCities && hasGeometryForEveryFeature,
    hasDistrictGeometry,
    issues,
  }
}

