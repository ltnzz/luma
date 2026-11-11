import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from '../../../i18n/useTranslation'
import ThemeToggle from '../../../components/ThemeToggle'
import { MapPinIcon, ChevronDownIcon, HelpCircleIcon } from '../../../components/ui/Icons'

const WILAYAH_ITEMS = [
  { key: 'ALL', label: 'Seluruh DKI Jakarta', labelEn: 'All DKI Jakarta', logoSrc: '/region-logos/dki-jakarta.png', districts: 6 },
  { key: 'JAKARTA PUSAT', label: 'Jakarta Pusat', labelEn: 'Central Jakarta', logoSrc: '/region-logos/jakarta-pusat.png', districts: 8 },
  { key: 'JAKARTA SELATAN', label: 'Jakarta Selatan', labelEn: 'South Jakarta', logoSrc: '/region-logos/jakarta-selatan.png', districts: 10 },
  { key: 'JAKARTA BARAT', label: 'Jakarta Barat', labelEn: 'West Jakarta', logoSrc: '/region-logos/jakarta-barat.png', districts: 8 },
  { key: 'JAKARTA UTARA', label: 'Jakarta Utara', labelEn: 'North Jakarta', logoSrc: '/region-logos/jakarta-utara.png', districts: 6 },
  { key: 'JAKARTA TIMUR', label: 'Jakarta Timur', labelEn: 'East Jakarta', logoSrc: '/region-logos/jakarta-timur.png', districts: 10 },
  { key: 'KEP. SERIBU', label: 'Kep. Seribu', labelEn: 'Thousand Islands', logoSrc: '/region-logos/kepulauan-seribu.png', districts: 2 },
] as const

interface DashboardHeaderProps {
  activeWilayah?: string
  onSelectWilayah?: (wilayah: string) => void
  onRestartTutorial?: () => void
  onNavigateToDashboard?: () => void
}

/**
 * Unified Modern Navbar (Persis Sesuai Mockup Pen Node 2U1UA):
 * - Kiri: Brand Luma + Region Selector Dropdown (Pill)
 * - Kanan: Live Date & Time Realtime + Switch Bahasa [ID | EN] + Theme Toggle + Help (Tour)
 */
export function DashboardHeader({
  activeWilayah = 'ALL',
  onSelectWilayah,
  onRestartTutorial,
  onNavigateToDashboard,
}: DashboardHeaderProps) {
  const { language, setLanguage, t } = useTranslation()
  const [isRegionOpen, setIsRegionOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Realtime live clock & date (Desain Node 2U1UA)
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsRegionOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsRegionOpen(false)
    }
    if (isRegionOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isRegionOpen])

  const timeString = useMemo(() => {
    return (
      currentTime.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB'
    )
  }, [currentTime, language])

  const dateString = useMemo(() => {
    return currentTime.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [currentTime, language])

  const currentWilayah = useMemo(() => {
    const found = WILAYAH_ITEMS.find((item) => item.key === activeWilayah)
    return found ?? WILAYAH_ITEMS[0]
  }, [activeWilayah])

  const getRegionLabel = (item: (typeof WILAYAH_ITEMS)[number]) =>
    language === 'en' ? item.labelEn : item.label

  const currentWilayahLabel = getRegionLabel(currentWilayah)

  const getRegionMeta = (item: (typeof WILAYAH_ITEMS)[number]) => {
    if (item.key === 'ALL') {
      return language === 'id' ? '5 kota + Kep. Seribu' : '5 cities + Thousand Islands'
    }
    return `${item.districts} ${language === 'id' ? 'kecamatan' : 'districts'}`
  }

  return (
    <header className="relative z-[60] flex h-12 shrink-0 items-center justify-between gap-1.5 border-b border-border bg-surface px-2 shadow-2xs select-none sm:h-14 sm:gap-2 sm:px-6">
      {/* 1. Kiri: Brand Logo & Title */}
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault()
          onNavigateToDashboard?.()
        }}
        aria-label={t('common.brandA11y')}
        className="flex min-w-0 shrink-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary cursor-pointer"
      >
        <img
          src="/luma-logo.png"
          alt="Luma"
          width={112}
          height={37}
          fetchPriority="high"
          decoding="async"
          className="luma-brand-logo h-auto w-[76px] object-contain transition-[filter] duration-200 sm:w-[112px]"
        />
      </a>

      {/* 2. Kanan: Region Selector + Live Date & Time + Language Switcher + Theme Toggle */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2.5">
        {/* Region Selector Dropdown */}
        {onSelectWilayah && (
          <div className="relative w-[108px] shrink-0 min-[380px]:w-[116px] sm:w-[176px]" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsRegionOpen((prev) => !prev)}
              className={`group flex h-8 w-full items-center justify-between rounded-lg border px-1 pr-1.5 text-left transition-all cursor-pointer sm:h-9 sm:rounded-xl sm:px-1.5 sm:pr-2 ${
                isRegionOpen
                  ? 'border-primary/45 bg-primary/[0.06] shadow-[0_0_0_3px_rgba(34,197,94,0.08)]'
                  : 'border-border/80 bg-surface hover:border-primary/35 hover:bg-surface-muted/55 shadow-2xs'
              }`}
              aria-haspopup="listbox"
              data-tour="region-selector"
              aria-expanded={isRegionOpen}
              aria-label={`${t('mapFirst.header.selectRegion')}. ${t('mapFirst.header.current')} ${currentWilayahLabel}`}
            >
              <div className="flex min-w-0 items-center gap-1 sm:gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/90 p-0.5 shadow-2xs ring-1 ring-inset ring-border/70 dark:bg-white/85 sm:h-7 sm:w-7 sm:rounded-lg">
                  <img
                    src={currentWilayah.logoSrc}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-contain"
                  />
                </span>
                <span className="min-w-0 truncate text-[10px] font-semibold leading-tight text-foreground sm:text-xs">
                  {currentWilayahLabel}
                </span>
              </div>
              <ChevronDownIcon
                size={10}
                className={`shrink-0 text-muted transition-transform group-hover:text-foreground ${isRegionOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isRegionOpen && (
              <div
                role="listbox"
                aria-label={t('mapFirst.header.selectRegion')}
                className="fixed inset-x-2 top-[3.25rem] z-[80] max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain rounded-2xl luma-map-card luma-region-dropdown p-1.5 animate-in fade-in slide-in-from-top-1 duration-150 sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.5rem)] sm:w-[288px] sm:max-h-[calc(100dvh-4.5rem)]"
              >
                <div className="mb-1 flex items-center justify-between border-b border-border/50 px-2.5 py-2">
                  <div>
                    <p className="text-xs font-bold text-foreground">{t('mapFirst.header.selectRegion')}</p>
                    <p className="mt-0.5 text-[10.5px] font-medium text-muted">
                      {language === 'id' ? 'Peta dan indikator akan menyesuaikan' : 'Map and indicators will update'}
                    </p>
                  </div>
                  <MapPinIcon size={14} className="text-primary" />
                </div>

                <div className="grid gap-0.5">
                  {WILAYAH_ITEMS.map((item) => {
                    const isSelected = activeWilayah === item.key
                    const label = getRegionLabel(item)
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          onSelectWilayah(item.key)
                          setIsRegionOpen(false)
                        }}
                        className={`group/region flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/15'
                            : 'text-foreground hover:bg-surface-muted/75'
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/90 p-1 shadow-2xs ring-1 ring-inset transition-colors dark:bg-white/85 ${
                          isSelected
                            ? 'ring-primary/55'
                            : 'ring-border/70 group-hover/region:ring-primary/30'
                        }`}>
                          <img
                            src={item.logoSrc}
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full object-contain transition-transform duration-150 group-hover/region:scale-105"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold leading-tight">{label}</span>
                          <span className="mt-0.5 block truncate text-[10.5px] font-medium text-muted">{getRegionMeta(item)}</span>
                        </span>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition ${
                          isSelected ? 'bg-primary text-on-primary' : 'text-transparent'
                        }`} aria-hidden="true">
                          ✓
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Date Time Widget */}
        <div data-dashboard="clock" className="hidden md:flex h-9 items-center gap-2.5 rounded-xl border border-border/80 bg-surface px-3 text-xs text-muted shadow-2xs">
          <span className="font-mono font-bold text-foreground text-[11px]">{timeString}</span>
          <span className="h-3.5 w-px bg-border/80 shrink-0" aria-hidden="true" />
          <span className="font-medium text-muted text-[11px] inline-block min-w-[155px] text-center">{dateString}</span>
        </div>

        {/* Language Switcher [ID | EN] */}
        <div
          data-tour="language-switcher"
          role="group"
          aria-label={t('common.language')}
          className="relative isolate grid h-9 grid-cols-2 items-center rounded-xl border border-border/80 bg-surface-muted p-0.5 text-xs font-semibold shadow-2xs"
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0.5 left-0.5 z-0 w-[calc(50%_-_2px)] rounded-lg bg-surface shadow-2xs transition-transform duration-200 ease-out motion-reduce:transition-none ${
              language === 'en' ? 'translate-x-full' : 'translate-x-0'
            }`}
          />
          <button
            type="button"
            onClick={() => setLanguage('id')}
            className={`relative z-10 flex h-full cursor-pointer items-center justify-center rounded-lg px-2 text-[10.5px] transition-[color,transform] duration-200 active:scale-95 sm:text-[11px] ${
              language === 'id' ? 'text-foreground' : 'text-muted hover:text-foreground'
            }`}
            aria-label="Bahasa Indonesia"
            aria-pressed={language === 'id'}
          >
            ID
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`relative z-10 flex h-full cursor-pointer items-center justify-center rounded-lg px-2 text-[10.5px] transition-[color,transform] duration-200 active:scale-95 sm:text-[11px] ${
              language === 'en' ? 'text-foreground' : 'text-muted hover:text-foreground'
            }`}
            aria-label="English"
            aria-pressed={language === 'en'}
          >
            EN
          </button>
        </div>

        {/* Theme Mode Button */}
        <ThemeToggle dataTour="theme-toggle" />

        {/* Help Button: restarts the guided tour */}
        {onRestartTutorial && (
          <button
            type="button"
            onClick={() => {
              setIsRegionOpen(false)
              onRestartTutorial()
            }}
            data-tour="help-tour"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border/80 bg-surface text-foreground transition-colors hover:bg-surface-muted shadow-2xs"
            aria-label={t('tour.restartTitle')}
            data-tooltip={t('tour.restartTitle')}
            data-tooltip-side="bottom"
            data-tooltip-align="right"
          >
            <HelpCircleIcon size={16} className="text-foreground" />
          </button>
        )}
      </div>
    </header>
  )
}
