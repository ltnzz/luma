import { useState } from 'react'
import {
  HospitalIcon,
  TreeIcon,
  SchoolIcon,
  BusIcon,
  DropletIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '../../../components/ui/Icons'
import { useTranslation } from '../../../i18n/useTranslation'

export function MapLegend() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="pointer-events-auto flex flex-col items-end">
      {/* Floating Panel Legenda (Expanded) */}
      {isOpen && (
        <div className="mb-2 w-72 rounded-2xl border border-border bg-surface/95 p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header Panel */}
          <div className="flex items-center justify-between border-b border-border/80 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-primary" />
              <h4 className="text-xs font-bold text-foreground">
                {t('dashboard.legend.title')}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-5 w-5 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground transition-colors cursor-pointer"
              title="Tutup Legenda"
              aria-label="Tutup Legenda"
            >
              <ChevronDownIcon size={13} />
            </button>
          </div>

          {/* List of Legend Items */}
          <div className="flex flex-col gap-2.5">
            {/* 1. Faskes */}
            <div className="flex items-start gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-danger text-white shadow-2xs">
                <HospitalIcon size={13} className="text-white" />
              </span>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground">
                    {t('dashboard.legend.faskes')}
                  </span>
                  <span className="text-[10px] font-semibold text-danger">51</span>
                </div>
                <span className="text-[11px] text-muted leading-tight">
                  {t('dashboard.legend.faskesSub')}
                </span>
              </div>
            </div>

            {/* 2. RTH */}
            <div className="flex items-start gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary shadow-2xs">
                <TreeIcon size={13} className="text-on-primary" />
              </span>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground">
                    {t('dashboard.legend.rth')}
                  </span>
                  <span className="text-[10px] font-semibold text-primary">34</span>
                </div>
                <span className="text-[11px] text-muted leading-tight">
                  {t('dashboard.legend.rthSub')}
                </span>
              </div>
            </div>

            {/* 3. Pendidikan */}
            <div className="flex items-start gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                <SchoolIcon size={13} className="text-white" />
              </span>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground">
                    {t('dashboard.legend.schools')}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600">1.503</span>
                </div>
                <span className="text-[11px] text-muted leading-tight">
                  {t('dashboard.legend.schoolsSub')}
                </span>
              </div>
            </div>

            {/* 4. Transportasi */}
            <div className="flex items-start gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white shadow-2xs">
                <BusIcon size={13} className="text-white" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground">
                  {t('dashboard.legend.transit')}
                </span>
                <span className="text-[11px] text-muted leading-tight">
                  {t('dashboard.legend.transitSub')}
                </span>
              </div>
            </div>

            {/* 5. Lingkungan Hidup */}
            <div className="flex items-start gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-2xs">
                <DropletIcon size={13} className="text-white" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground">
                  {t('dashboard.legend.environment')}
                </span>
                <span className="text-[11px] text-muted leading-tight">
                  {t('dashboard.legend.environmentSub')}
                </span>
              </div>
            </div>

            {/* 6. Batas Administrasi Wilayah */}
            <div className="flex items-start gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-primary/80 bg-primary/10">
                <span className="h-0.5 w-3.5 rounded-full bg-primary" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground">
                  {t('dashboard.legend.boundary')}
                </span>
                <span className="text-[11px] text-muted leading-tight">
                  {t('dashboard.legend.boundarySub')}
                </span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-3 border-t border-border/60 pt-2 text-center">
            <span className="text-[10px] text-muted font-medium">
              Data spasial berbasis koordinat GPS riil terverifikasi
            </span>
          </div>
        </div>
      )}

      {/* Pill Toggle Button Legenda */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-bold shadow-md backdrop-blur-md transition-all cursor-pointer ${
          isOpen
            ? 'bg-primary text-on-primary border-primary'
            : 'bg-surface/95 text-foreground hover:bg-surface-muted hover:border-primary/50'
        }`}
        title="Buka / tutup legenda peta"
        aria-expanded={isOpen}
      >
        <span className="flex h-2 w-2 rounded-full bg-primary" />
        <span>{t('dashboard.legend.title')}</span>
        {isOpen ? <ChevronDownIcon size={12} /> : <ChevronUpIcon size={12} />}
      </button>
    </div>
  )
}

