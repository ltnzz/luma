/**
 * Single source of truth untuk visual marker & popup fasilitas.
 *
 * Dipakai bersama oleh:
 * - InteractiveMap.tsx  (DOM Marker MapLibre + popup preview)
 * - MapLegend.tsx       (legend overlay di atas peta)
 *
 * Kontrak:
 * - Kategori & warna & SVG TIDAK boleh diduplikasi di file lain.
 * - Marker tetap berupa DOM Marker (element) MapLibre; wrapper positioning
 *   tidak mengandung CSS transform/scale — animasi hanya pada child (innerEl).
 * - HTML popup memakai design tokens (bg-surface, text-foreground, dst.)
 *   sehingga otomatis mengikuti light/dark theme. Teks diteruskan melalui
 *   FacilityPopupTexts agar i18n tetap di luar (t() di pemanggil).
 * - Tidak ada informasi yang dikarang: hanya field yang benar-benar ada
 *   pada data ter-normalisasi dari src/lib/api.ts (name, category,
 *   subCategory, wilayah, kecamatan, address, budget.total, metrics).
 */

import type { Facility } from '../../lib/api'
import type { TranslationKey } from '../../i18n/dictionaries'

export type FacilityCategory = 'fasum' | 'transum' | 'kesehatan' | 'pendidikan' | 'lingkungan'

/** Urutan kategori untuk legend & konsumsi UI lain. */
export const FACILITY_CATEGORIES: FacilityCategory[] = [
  'fasum',
  'transum',
  'kesehatan',
  'pendidikan',
  'lingkungan',
]

/** Warna kategori — dipertahankan dari implementasi marker yang sudah ada. */
export const CATEGORY_COLORS: Record<FacilityCategory, string> = {
  fasum: '#16a34a', // green
  transum: '#7c3aed', // violet
  kesehatan: '#dc2626', // red
  pendidikan: '#2563eb', // blue
  lingkungan: '#06b6d4', // cyan
}

export const DEFAULT_CATEGORY_COLOR = '#16a34a'

export const CATEGORY_SVGS: Record<FacilityCategory, string> = {
  fasum: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 3-7h-2l3-6-4 1-3-4-3 4-4-1 3 6h-2l3 7"/><path d="M12 19v3"/></svg>',
  transum: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M6 18h12"/><path d="M4 11V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v4"/><rect width="18" height="12" x="3" y="6" rx="2"/><path d="M7 18v2"/><path d="M17 18v2"/></svg>',
  kesehatan: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 3v2"/><path d="M5 3v2"/><path d="M5 4H4a2 2 0 0 0-2 2v2a6 6 0 0 0 12 0V6a2 2 0 0 0-2-2h-1"/><path d="M8 14a6 6 0 0 0 12 0v-2"/><circle cx="20" cy="10" r="2"/></svg>',
  pendidikan: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></svg>',
  lingkungan: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>',
}

export const DEFAULT_PIN_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>'

/** Label kategori (i18n) — key TranslationKey, nilai diambil via t() pemanggil. */
export const CATEGORY_LABEL_KEYS: Record<FacilityCategory, TranslationKey> = {
  fasum: 'map.category.fasum',
  transum: 'map.category.transum',
  kesehatan: 'map.category.kesehatan',
  pendidikan: 'map.category.pendidikan',
  lingkungan: 'map.category.lingkungan',
}

function normalizeCategoryKey(category: string | null | undefined): FacilityCategory | null {
  const normalized = (category ?? '').trim().toLowerCase()
  return FACILITY_CATEGORIES.includes(normalized as FacilityCategory) ? (normalized as FacilityCategory) : null
}

export { normalizeCategoryKey }

/** Warna kategori dengan fallback default (tipis). */
export function getCategoryColor(category: string | null | undefined): string {
  const key = normalizeCategoryKey(category)
  return key ? CATEGORY_COLORS[key] : DEFAULT_CATEGORY_COLOR
}

/** SVG ikon kategori dengan fallback pin default. */
export function getCategoryIcon(category: string | null | undefined): string {
  const key = normalizeCategoryKey(category)
  return key ? CATEGORY_SVGS[key] : DEFAULT_PIN_SVG
}

/**
 * Membuat elemen DOM marker fasilitas (struktur identik dengan implementasi
 * yang sudah ada di InteractiveMap — JANGAN diubah visualnya di sini).
 * Posisi/scale animasi hanya pada innerEl (child), wrapper tetap polos.
 */
export function createFacilityMarkerElement(category: string | null | undefined): {
  wrapperEl: HTMLDivElement
  innerEl: HTMLDivElement
} {
  const color = getCategoryColor(category)
  const iconSvg = getCategoryIcon(category)

  // Wrapper luar khusus positioning MapLibre — TIDAK BOLEH ada CSS
  // transition-transform atau scale di wrapper ini.
  const wrapperEl = document.createElement('div')
  wrapperEl.className = 'relative flex items-center justify-center cursor-pointer select-none'
  wrapperEl.style.width = '36px'
  wrapperEl.style.height = '36px'

  const innerEl = document.createElement('div')
  innerEl.className =
    'flex items-center justify-center rounded-[10px] transition-all duration-200 hover:-translate-y-0.5 hover:scale-110'
  innerEl.style.backgroundColor = color
  innerEl.style.width = '30px'
  innerEl.style.height = '30px'
  innerEl.style.border = '2px solid white'
  innerEl.style.boxShadow = `0 5px 14px rgba(15, 23, 42, 0.2), 0 0 0 3px ${withAlpha(color, '1f')}`
  innerEl.innerHTML = iconSvg

  wrapperEl.appendChild(innerEl)
  return { wrapperEl, innerEl }
}

/* ------------------------------------------------------------------ */
/* Quick Search & Category Filter (dipakai Layer 1 & Layer 2)          */
/* ------------------------------------------------------------------ */

export type FacilityCategoryFilter = FacilityCategory | 'all'

export interface FacilityFilterOptions {
  /** Kata kunci pencarian — case-insensitive, whitespace di-trim.
   *  Dicocokkan ke semua field teks fasilitas yang relevan (lihat
   *  getFacilitySearchText): nama, subkategori, kategori, wilayah,
   *  kecamatan, dan alamat. Kata kunci multi-token di-AND-kan, artinya
   *  "taman nasional" hanya cocok bila KEDUA token ditemukan — di field
   *  mana pun — sehingga urutan kata maupun field tidak jadi soal. */
  query?: string
  /** Kategori aktif — 'all' berarti tanpa filter kategori. */
  category?: FacilityCategoryFilter
}

/** True bila ada filter aktif (untuk menentukan tampilan chip jumlah/empty). */
export function isFacilityFilterActive(options: FacilityFilterOptions): boolean {
  return (
    Boolean(options.query?.trim()) ||
    (options.category !== undefined && options.category !== 'all')
  )
}

/**
 * Gabungan seluruh field teks yang boleh dicocokkan dengan kata kunci
 * pencarian. Hanya field yang benar-benar ada pada data ternormalisasi
 * dari normalizeFacility() (src/lib/api.ts) yang dipakai:
 * - name        (selalu ada)
 * - subCategory (mis. "Taman Nasional Kota Terbesar DKI")
 * - category    ("fasum", "transum", dst.)
 * - wilayah     ("JAKARTA PUSAT", dst.)
 * - kecamatan   ("MENTENG", dst.) — bisa null
 * - address     — bisa null
 * Field null/undefined/bukan string diabaikan. Fields di-join dengan
 * newline agar sebuah token tidak bisa "melompat" menyeberangi batas
 * dua field yang berbeda (anti false positive phrase lintas field).
 * Output sudah lowercase siap dibandingkan dengan query yang sama-samaan
 * sudah dilowercase.
 */
export function getFacilitySearchText(facility: Facility): string {
  const candidates: unknown[] = [
    facility.name,
    facility.subCategory,
    facility.category,
    facility.wilayah,
    facility.kecamatan,
    facility.address,
  ]
  return candidates
    .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
    .join('\n')
    .toLowerCase()
}

/**
 * Filter fasilitas client-side dari data yang SUDAH dimuat — tanpa request
 * API tambahan per keystroke. Dipakai bersama oleh:
 * - Layer 1: hasilnya di-set ke GeoJSON cluster source.
 * - Layer 2: hasilnya me-render DOM markers.
 *
 * Query dicocokkan ke SEMUA field teks fasilitas (lihat
 * getFacilitySearchText), bukan hanya name. Multi-token di-AND-kan:
 * "taman nasional" => token "taman" DAN "nasional" harus keduanya cocok.
 */
export function filterFacilities(
  facilities: Facility[],
  options: FacilityFilterOptions,
): Facility[] {
  const query = (options.query ?? '').trim().toLowerCase()
  const category = options.category && options.category !== 'all' ? options.category : null
  if (!query && !category) return facilities
  const tokens = query.split(/\s+/).filter(Boolean)

  return facilities.filter((facility) => {
    if (category && normalizeCategoryKey(facility.category) !== category) {
      return false
    }
    if (tokens.length > 0) {
      const searchText = getFacilitySearchText(facility)
      for (const token of tokens) {
        if (!searchText.includes(token)) return false
      }
    }
    return true
  })
}

/* ------------------------------------------------------------------ */
/* Smart Cluster — GeoJSON data (Layer 1: seluruh DKI)                 */
/* ------------------------------------------------------------------ */

/**
 * Struktur GeoJSON titik fasilitas. Properties menyimpan identitas minimum
 * yang cukup untuk cluster (id, name, category, wilayah) — tanpa payload
 * berat agar clustering tetap ringan untuk 115 titik.
 */
export interface FacilityPointFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: {
    id: string
    name: string
    category: string
    wilayah: string
    subCategory?: string
  }
}

export interface FacilityPointCollection {
  type: 'FeatureCollection'
  features: FacilityPointFeature[]
}

/**
 * Konversi facilities (sudah dinormalisasi src/lib/api.ts) menjadi
 * FeatureCollection untuk GeoJSON cluster source MapLibre.
 * Urutan koordinat GeoJSON: [longitude, latitude].
 */
export function buildFacilityPointCollection(facilities: Facility[]): FacilityPointCollection {
  return {
    type: 'FeatureCollection',
    features: facilities.map((f) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [f.lng, f.lat] },
      properties: {
        id: f.id,
        name: f.name,
        category: f.category,
        wilayah: f.wilayah,
        ...(f.subCategory ? { subCategory: f.subCategory } : {}),
      },
    })),
  }
}


/** Teks popup yang sudah diterjemahkan oleh pemanggil (t()). */
export interface FacilityPopupTexts {
  /** Label kategori yang ramah (mis. "Kesehatan"). */
  categoryLabel: string
  /** Label anggaran. */
  budget: string
  /** Label kualitas udara. */
  airQuality: string
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const escaped: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return escaped[char] ?? char
  })
}

/** #rrggbb -> #rrggbbAA (alpha tambahan, semua kategori berformat 6-digit hex). */
function withAlpha(hexColor: string, alphaSuffix = '26'): string {
  return `${hexColor}${alphaSuffix}`
}

function readMetricString(metrics: Record<string, unknown> | undefined, keys: string[]): string | null {
  for (const key of keys) {
    const value = metrics?.[key]
    if (typeof value === 'string' && value.trim() !== '') return value
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return null
}

/**
 * HTML preview fasilitas untuk maplibre-gl Popup.
 *
 * Hanya menampilkan data yang benar-benar tersedia:
 * - name, badge kategori (subCategory bila ada), wilayah/address
 * - budget.total (transparansi) bila ada
 * - metrics.aqiStatus (+ metrics.aqi bila angka) bila ada
 * - ringkasan metrik yang tersedia
 *
 * Tema dipakai via design tokens (bg-surface/text-foreground/border-border)
 * sehingga popup otomatis mendukung light & dark tanpa warna hardcoded.
 */
export function buildFacilityPopupHtml(facility: Facility, texts: FacilityPopupTexts): string {
  const color = getCategoryColor(facility.category)

  const name = escapeHtml(facility.name)
  const badge = escapeHtml(facility.subCategory || texts.categoryLabel)
  const location =
    facility.address && facility.address.trim() !== ''
      ? escapeHtml(facility.address)
      : escapeHtml(facility.wilayah)

  const budgetTotal =
    typeof facility.budget?.total === 'string' && facility.budget.total.trim() !== ''
      ? facility.budget.total.trim()
      : null

  const aqiStatus = readMetricString(facility.metrics, ['aqiStatus', 'aqi_status'])
  const aqiValue = readMetricString(facility.metrics, ['aqi', 'aqi_value'])
  const airQualityValue = aqiStatus
    ? aqiValue
      ? `${aqiValue} · ${aqiStatus}`
      : aqiStatus
    : aqiValue

  const metricRows = [
    budgetTotal ? { label: texts.budget, value: budgetTotal, strong: true } : null,
    airQualityValue ? { label: texts.airQuality, value: airQualityValue, strong: false } : null,
  ].filter((row): row is { label: string; value: string; strong: boolean } => row !== null)

  return `
    <article class="luma-popup-card w-[220px] overflow-hidden rounded-xl text-foreground sm:w-[250px]">
      <div class="p-3.5">
        <div class="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em]" style="color:${color}">
          <span class="h-1.5 w-1.5 shrink-0 rounded-full" style="background:${color}" aria-hidden="true"></span>
          <span class="min-w-0 truncate">${badge}</span>
        </div>

        <h4 class="m-0 mt-1.5 text-[13px] font-bold leading-snug tracking-tight text-foreground">${name}</h4>
        ${
          location
            ? `<p class="m-0 mt-1 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-muted">
                <svg class="mt-0.5 h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
                <span>${location}</span>
              </p>`
            : ''
        }

        ${
          metricRows.length > 0
            ? `<dl class="m-0 mt-2.5 flex flex-col gap-1.5 border-t border-border/70 pt-2.5 text-[10.5px]">
                ${metricRows
                  .map(
                    (row) => `
                    <div class="flex items-baseline justify-between gap-3">
                      <dt class="shrink-0 font-semibold text-muted">${escapeHtml(row.label)}</dt>
                      <dd class="m-0 text-right ${
                        row.strong ? 'font-extrabold text-primary' : 'font-bold text-foreground'
                      }">${escapeHtml(row.value)}</dd>
                    </div>`,
                  )
                  .join('')}
              </dl>`
            : ''
        }

      </div>
    </article>
  `
}
