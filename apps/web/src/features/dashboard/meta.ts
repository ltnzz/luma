/**
 * Display metadata for the six DKI Jakarta administrative regions shown on
 * screen 1. Names fall back to these values when the API row has no label.
 * Hexagon coordinates are static illustration positions (per the Figma
 * design) — NOT a scaled geographic map.
 */

export interface WilayahMeta {
  /** wilayah_code as used by the backend (dataset keys / DB codes). */
  code: string
  /** Fallback display label (API row `label` takes precedence). */
  name: string
  /** Illustrative hexagon center on the SVG canvas. */
  x: number
  y: number
}

export const WILAYAH_META: WilayahMeta[] = [
  { code: 'KEP. SERIBU', name: 'Kep. Seribu', x: 398, y: 70 },
  { code: 'JAKARTA UTARA', name: 'Jakarta Utara', x: 322, y: 150 },
  { code: 'JAKARTA BARAT', name: 'Jakarta Barat', x: 196, y: 232 },
  { code: 'JAKARTA PUSAT', name: 'Jakarta Pusat', x: 268, y: 232 },
  { code: 'JAKARTA TIMUR', name: 'Jakarta Timur', x: 340, y: 232 },
  { code: 'JAKARTA SELATAN', name: 'Jakarta Selatan', x: 268, y: 316 },
]

export const HEX_RADIUS = 46

const WILAYAHS_META_BY_CODE: Record<string, WilayahMeta> = WILAYAH_META.reduce<
  Record<string, WilayahMeta>
>((acc, meta) => {
  acc[meta.code] = meta
  return acc
}, {})

export function findWilayahMeta(code: string | null): WilayahMeta | null {
  if (!code) return null
  return WILAYAHS_META_BY_CODE[code] ?? null
}

/** Pointy-top hexagon polygon points for an SVG <polygon>. */
export function hexPoints(cx: number, cy: number, radius: number): string {
  const angles = [0, 60, 120, 180, 240, 300]
  return angles
    .map((angleDegrees) => {
      const radians = (angleDegrees * Math.PI) / 180
      const x = cx + radius * Math.sin(radians)
      const y = cy - radius * Math.cos(radians)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}
