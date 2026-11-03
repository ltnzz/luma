import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from '../../../i18n/useTranslation'
import ThemeToggle from '../../../components/ThemeToggle'
import { MapPinIcon, ChevronDownIcon } from '../../../components/ui/Icons'

const WILAYAH_ITEMS = [
  { key: 'ALL', label: 'Seluruh DKI Jakarta' },
  { key: 'JAKARTA PUSAT', label: 'Jakarta Pusat' },
  { key: 'JAKARTA SELATAN', label: 'Jakarta Selatan' },
  { key: 'JAKARTA BARAT', label: 'Jakarta Barat' },
  { key: 'JAKARTA UTARA', label: 'Jakarta Utara' },
  { key: 'JAKARTA TIMUR', label: 'Jakarta Timur' },
  { key: 'KEP. SERIBU', label: 'Kep. Seribu' },
] as const

interface DashboardHeaderProps {
  activeWilayah?: string
  onSelectWilayah?: (wilayah: string) => void
}

/**
 * Unified Modern Navbar (Persis Sesuai Mockup Pen Node 2U1UA):
 * - Kiri: Brand Luma + Region Selector Dropdown (Pill)
 * - Kanan: Live Date & Time Realtime + Switch Bahasa [ID | EN] + Theme Toggle
 */
export function DashboardHeader({
  activeWilayah = 'ALL',
  onSelectWilayah,
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
    if (isRegionOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isRegionOpen])

  const timeString = useMemo(() => {
    return (
      currentTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB'
    )
  }, [currentTime])

  const dateString = useMemo(() => {
    return currentTime.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [currentTime, language])

  const currentWilayahLabel = useMemo(() => {
    const found = WILAYAH_ITEMS.find((item) => item.key === activeWilayah)
    if (found?.key === 'ALL') return t('dashboard.region.ALL')
    return found ? found.label : activeWilayah
  }, [activeWilayah, t])

  return (
    <header className="z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-2.5 sm:px-6 shadow-2xs select-none">
      {/* 1. Kiri: Brand Logo & Title */}
      <a
        href="#"
        aria-label={t('common.brandA11y')}
        className="flex min-w-0 shrink-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <img
          src="/luma-logo.png"
          alt="Luma"
          className="h-auto w-[86px] object-contain transition-[filter] duration-200 sm:w-[112px] dark:brightness-[2.15] dark:contrast-[1.08] dark:saturate-[1.25] dark:drop-shadow-[0_0_5px_rgba(255,255,255,0.20)] dark:hover:drop-shadow-[0_0_7px_rgba(255,255,255,0.27)]"
        />
      </a>

      {/* 2. Kanan: Region Selector + Live Date & Time + Language Switcher + Theme Toggle */}
      <div className="flex min-w-0 items-center gap-1 sm:gap-2.5">
        {/* Region Selector Dropdown */}
        {onSelectWilayah && (
          <div className="relative w-[108px] xs:w-[118px] sm:w-[142px]" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsRegionOpen((prev) => !prev)}
              className="flex items-center justify-between w-full rounded-full border border-border/80 bg-surface hover:bg-surface-muted/60 px-2.5 py-1 text-[10px] font-medium text-foreground hover:border-primary/50 transition-all cursor-pointer shadow-2xs leading-none"
              aria-haspopup="listbox"
              aria-expanded={isRegionOpen}
              aria-label={`${t('mapFirst.header.selectRegion')}. ${t('mapFirst.header.current')} ${currentWilayahLabel}`}
              data-tooltip={t('mapFirst.header.regionTooltip')}
              data-tooltip-side="bottom"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPinIcon size={10} className="text-primary shrink-0" />
                <span className="truncate text-[10px] leading-tight">{currentWilayahLabel}</span>
              </div>
              <ChevronDownIcon
                size={9}
                className={`text-muted transition-transform shrink-0 ${isRegionOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isRegionOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 w-full rounded-xl luma-glass p-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {WILAYAH_ITEMS.map((item) => {
                  const isSelected = activeWilayah === item.key
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        onSelectWilayah(item.key)
                        setIsRegionOpen(false)
                      }}
                      className={`w-full flex items-center justify-between rounded-lg px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-foreground hover:bg-surface-muted/80'
                      }`}
                    >
                      <span className="text-[10px] leading-tight truncate">
                        {item.key === 'ALL' ? t('dashboard.region.ALL') : item.label}
                      </span>
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 ml-1" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Live Date Time Widget */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-muted/60 px-2.5 py-1 text-[10px] text-muted shadow-2xs">
          <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-mono font-bold text-foreground text-[10px]">{timeString}</span>
          <span className="text-muted/60">•</span>
          <span className="font-medium text-muted text-[10px]">{dateString}</span>
        </div>

        {/* Language Switcher [ID | EN] */}
        <div className="flex items-center rounded-xl border border-border bg-surface-muted p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLanguage('id')}
            className={`rounded-lg px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] transition-colors cursor-pointer ${
              language === 'id' ? 'bg-surface text-foreground shadow-2xs' : 'text-muted hover:text-foreground'
            }`}
            title="Bahasa Indonesia"
          >
            ID
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`rounded-lg px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] transition-colors cursor-pointer ${
              language === 'en' ? 'bg-surface text-foreground shadow-2xs' : 'text-muted hover:text-foreground'
            }`}
            title="English"
          >
            EN
          </button>
        </div>

        {/* Theme Mode Button */}
        <ThemeToggle />
      </div>
    </header>
  )
}
