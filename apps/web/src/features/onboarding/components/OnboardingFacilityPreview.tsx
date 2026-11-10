import { useMemo } from 'react'
import { CategoryIconBadge } from '../../../components/ui/CategoryIconBadge'
import { getOnboardingFacilityPreview } from '../data/facility-preview-provider'
import { useTranslation } from '../../../i18n/useTranslation'

export function OnboardingFacilityPreview() {
  const { language } = useTranslation()
  const facility = useMemo(() => getOnboardingFacilityPreview(), [])

  if (!facility) {
    return (
      <div className="mt-2 rounded-xl border border-dashed border-border/80 bg-surface-muted/40 p-3 text-center text-xs text-muted">
        {language === 'en'
          ? 'Facility preview is not available currently.'
          : 'Contoh informasi fasilitas belum tersedia saat ini.'}
      </div>
    )
  }

  const isEn = language === 'en'

  return (
    <div
      data-testid="onboarding-facility-preview"
      className="mt-2.5 flex flex-col gap-2 rounded-xl border border-primary/20 bg-surface/80 p-3 shadow-xs dark:bg-surface/50"
    >
      {/* Header Tag */}
      <div className="flex items-center justify-between gap-1.5 text-[10px] font-semibold text-primary">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {isEn ? 'Mobile Preview Example' : 'Contoh Pratinjau Mobile'}
        </span>
        <span className="text-muted text-[9.5px]">
          {isEn ? 'Facility Detail' : 'Detail Fasilitas'}
        </span>
      </div>

      {/* Facility Header */}
      <div className="flex items-start gap-2">
        <CategoryIconBadge category="health" size="sm" className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold leading-tight text-foreground truncate">
            {facility.name}
          </h3>
          <p className="text-[10px] text-muted truncate">
            {facility.subCategory} · {facility.wilayah}
          </p>
        </div>
      </div>

      {/* Address */}
      <div className="flex items-center gap-1.5 text-[10.5px] text-muted">
        <svg
          className="h-3 w-3 shrink-0 text-primary/80"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="truncate">{facility.address}</span>
      </div>

      {/* Specs Chips */}
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {facility.specs?.Status && (
          <span className="rounded-md border border-border/80 bg-surface-muted/60 px-2 py-0.5 font-medium text-foreground">
            {facility.specs.Status}
          </span>
        )}
        {facility.specs?.['Jam Layanan'] && (
          <span className="rounded-md border border-border/80 bg-surface-muted/60 px-2 py-0.5 font-medium text-foreground">
            {facility.specs['Jam Layanan']}
          </span>
        )}
      </div>

      {/* Key Metrics / Attributes */}
      <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-border/50 bg-surface-muted/30 p-2 text-[10px]">
        <div>
          <span className="text-[9px] text-muted block">
            {isEn ? 'Transit Access' : 'Akses Transit'}
          </span>
          <span className="font-semibold text-foreground">
            {String(facility.metrics?.transit_access ?? '120m ke Halte')}
          </span>
        </div>
        <div>
          <span className="text-[9px] text-muted block">
            {isEn ? 'Budget Source' : 'Sumber Anggaran'}
          </span>
          <span className="font-semibold text-foreground">
            {facility.budget?.source ?? 'APBD DKI Jakarta'}
          </span>
        </div>
      </div>

      {/* Helpful Hint */}
      <p className="text-[9.5px] leading-tight text-muted/90 italic">
        {isEn
          ? 'Tap any facility pin on the map to view complete real-time details.'
          : 'Ketuk pin fasilitas mana pun di peta untuk membuka detail lengkapnya.'}
      </p>
    </div>
  )
}

