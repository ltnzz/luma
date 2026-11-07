import { describe, expect, it } from 'vitest'
import { DATA_CATALOG, getDataCatalogEntry, type CatalogCategory } from './data-catalog'

const categories = Object.keys(DATA_CATALOG) as CatalogCategory[]

describe('localized data catalog metadata', () => {
  it('preserves provenance fields when switching ID and EN', () => {
    for (const category of categories) {
      const id = getDataCatalogEntry(category, 'id')
      const en = getDataCatalogEntry(category, 'en')

      expect(en.category).toBe(id.category)
      expect(en.source).toBe(id.source)
      expect(en.sourceUrl).toBe(id.sourceUrl)
      expect(en.status).toBe(id.status)
      expect(en.trendSector).toBe(id.trendSector)
      expect(en.title.trim()).not.toBe('')
      expect(en.coverage.trim()).not.toBe('')
      expect(en.unit.trim()).not.toBe('')
      expect(en.method.trim()).not.toBe('')
    }
  })

  it('uses the catalog coverage without adding map-boundary claims', () => {
    for (const category of ['kesehatan', 'rth', 'sekolah'] as const) {
      expect(getDataCatalogEntry(category, 'id').coverage).toBe('DKI Jakarta hingga atribut kecamatan')
      expect(getDataCatalogEntry(category, 'en').coverage).toBe('DKI Jakarta down to district attributes')
    }
  })
})
