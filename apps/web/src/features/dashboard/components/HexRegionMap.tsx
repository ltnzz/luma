import { useCallback, type KeyboardEvent } from 'react'

import { useTranslation } from '../../../i18n/useTranslation'
import { HEX_RADIUS, hexPoints, WILAYAH_META, type WilayahMeta } from '../meta'

interface HexRegionMapProps {
  /** Selected wilayah code, or null for the DKI-wide view. */
  selected: string | null
  onSelect: (code: string) => void
}

interface HexProps {
  meta: WilayahMeta
  selected: boolean
  onSelect: (code: string) => void
}

function Hex({ meta, selected, onSelect }: HexProps) {
  const points = hexPoints(meta.x, meta.y, HEX_RADIUS)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<SVGGElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onSelect(meta.code)
      }
    },
    [meta.code, onSelect],
  )

  return (
    <g
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={meta.name}
      className="cursor-pointer"
      onClick={() => onSelect(meta.code)}
      onKeyDown={handleKeyDown}
    >
      <polygon
        points={points}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        strokeWidth={selected ? 2.5 : 1.25}
        className={
          selected
            ? 'fill-primary-soft stroke-primary outline-none focus-visible:stroke-primary focus-visible:stroke-2'
            : 'fill-surface stroke-border outline-none focus-visible:stroke-primary hover:stroke-primary'
        }
      />
      <text
        x={meta.x}
        y={meta.y + 4}
        textAnchor="middle"
        className={
          selected ? 'fill-primary-soft-text text-[11px] font-semibold' : 'fill-foreground text-[11px] font-semibold'
        }
      >
        {meta.name}
      </text>
    </g>
  )
}

/**
 * Illustrative administrative map for screen 1: six hexagons positioned by
 * deterministic static coordinates (see meta.ts). This is NOT a scaled
 * geographic map — copy states that explicitly. Selection is keyboard
 * accessible. Structured so screens 2 & 3 (kecamatan hexes, facility pins)
 * can evolve from it without reworking the dashboard foundation.
 */
export function HexRegionMap({ selected, onSelect }: HexRegionMapProps) {
  const { t } = useTranslation()

  return (
    <svg
      viewBox="128 8 344 376"
      role="group"
      aria-label={t('dashboard.map.mapA11y')}
      className="mx-auto h-auto w-full max-w-[540px]"
    >
      {/* Decorative dashed guides (Figma shows subtle diagonal dashed lines). */}
      <g aria-hidden="true" pointerEvents="none" opacity="0.5">
        <line x1="150" y1="250" x2="430" y2="80" className="stroke-border" strokeWidth="1" strokeDasharray="4 6" />
        <line x1="160" y1="290" x2="420" y2="360" className="stroke-border" strokeWidth="1" strokeDasharray="4 6" />
      </g>

      {WILAYAH_META.map((meta) => (
        <Hex key={meta.code} meta={meta} selected={meta.code === selected} onSelect={onSelect} />
      ))}
    </svg>
  )
}
