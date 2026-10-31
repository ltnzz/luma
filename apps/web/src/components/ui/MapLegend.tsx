import { useState } from 'react'

import { useTranslation } from '../../i18n/useTranslation'
import { cn } from '../../lib/utils'
import { CATEGORY_LABEL_KEYS, FACILITY_CATEGORIES, getCategoryColor, getCategoryIcon } from './map-marker'
import { ChevronDownIcon, ChevronUpIcon, MapPinIcon } from './Icons'

/**
 * Visual Legend — overlay ringkas di atas peta.
 *
 * Sumber ikon & warna IDENTIK dengan marker fasilitas (map-marker.ts) sehingga
 * legend selalu konsisten dengan pin di peta. Collapsibel agar tidak menutupi
 * area peta; gelap/terang via design tokens; label via i18n.
 */
export function MapLegend({ className }: { className?: string }) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={cn('pointer-events-auto flex flex-col items-end', className)}>
      <button
        type="button"
        onClick={() => setIsExpanded((open) => !open)}
        aria-expanded={isExpanded}
        aria-controls="luma-map-legend-panel"
        title={t('map.legend.title')}
        className="flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 text-xs font-semibold text-foreground shadow-md transition-colors hover:bg-surface-muted"
      >
        <MapPinIcon size={14} className="text-primary" />
        <span>{t('map.legend.title')}</span>
        {isExpanded ? (
          <ChevronUpIcon size={12} className="text-muted" />
        ) : (
          <ChevronDownIcon size={12} className="text-muted" />
        )}
      </button>

      {isExpanded && (
        <div
          id="luma-map-legend-panel"
          role="group"
          aria-label={t('map.legend.title')}
          className="mt-1.5 rounded-xl border border-border bg-surface/95 p-2 shadow-lg backdrop-blur-md"
        >
          <ul className="flex flex-col gap-1.5">
            {FACILITY_CATEGORIES.map((category) => (
              <li key={category} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: getCategoryIcon(category) }}
                  style={{ backgroundColor: getCategoryColor(category) }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                />
                <span className="text-xs font-semibold text-foreground">
                  {t(CATEGORY_LABEL_KEYS[category])}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
