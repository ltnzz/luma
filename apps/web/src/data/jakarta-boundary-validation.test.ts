import { describe, expect, it } from 'vitest'
import jakartaAdministrativeBoundaries from './jakarta-subdistricts-boundary.json'
import { validateJakartaBoundaryData } from './jakarta-boundary-validation'

describe('Jakarta administrative boundary dataset', () => {
  it('contains the six valid city/regency polygons', () => {
    const validation = validateJakartaBoundaryData(jakartaAdministrativeBoundaries)

    expect(validation.isValidCityBoundary).toBe(true)
    expect(validation.featureCount).toBe(6)
    expect(validation.cityNames).toEqual([
      'JakartaBarat',
      'JakartaPusat',
      'JakartaSelatan',
      'JakartaTimur',
      'JakartaUtara',
      'KepulauanSeribu',
    ])
  })

  it('does not claim district boundaries before NAME_3 polygons exist', () => {
    const validation = validateJakartaBoundaryData(jakartaAdministrativeBoundaries)

    expect(validation.hasDistrictGeometry).toBe(false)
    expect(validation.issues).toContain('District-level NAME_3 polygons are not available')
  })
})

