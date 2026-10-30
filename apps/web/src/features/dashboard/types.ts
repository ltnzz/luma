/** Status for a single API-backed query boundary. */
export type QueryStatus = 'loading' | 'success' | 'empty' | 'error'

/** Scope chip / KPI cakupan labels. */
export type IndicatorScope = 'ALL' | { wilayah: string }

/** Identifiers of the six KPI cards on screen 1 (design order). */
export type KpiKey = 'kualitasAir' | 'kualitasUdara' | 'pendidikan' | 'kesehatan' | 'rth' | 'transportasi'

export interface KpiValue {
  /** Primary display value, already locale-formatted; null -> empty state. */
  value: string | null
  /** Secondary line under the value. */
  sub: string | null
  /** Footer metadata (sumber / periode). */
  footer: string | null
}
