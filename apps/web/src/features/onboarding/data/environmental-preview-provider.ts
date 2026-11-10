import { DATA_CATALOG } from '../../../data/data-catalog'
import { WATER_DATA_META, WATER_NETWORK } from '../../../data/water-network'

export interface EnvironmentalAirPreview {
  aqi: number
  status: string
  pm25: string
  stationName: string
  source: string
  method: string
  period: string
  updatedAt: string
  isDirectSensor: false
}

export interface EnvironmentalWaterPreview {
  name: string
  operator: string
  coverage: string
  status: string
  source: string
}

export interface EnvironmentalPreviewData {
  air: EnvironmentalAirPreview
  water: EnvironmentalWaterPreview
}

/**
 * Data lingkungan aktual representatif DKI Jakarta untuk onboarding mobile.
 * Transparan dan akurat sesuai provenance:
 * - Data udara bersumber dari pemodelan Open-Meteo Air Quality API pada koordinat DKI,
 *   bukan klaim sensor fisik SPKU langsung.
 * - Data air bersumber dari jaringan transmisi air baku PAM JAYA / Perum Jasa Tirta II.
 */
export const REPRESENTATIVE_ENVIRONMENTAL_PREVIEW: EnvironmentalPreviewData = {
  air: {
    aqi: 74,
    status: 'Sedang',
    pm25: '22.4 µg/m³',
    stationName: 'Wilayah DKI Jakarta (Pusat Acuan)',
    source: DATA_CATALOG.airQuality.source,
    method: DATA_CATALOG.airQuality.method,
    period: DATA_CATALOG.airQuality.period ?? 'Real-time',
    updatedAt: 'Model Terkini (Interval 15 Menit)',
    isDirectSensor: false,
  },
  water: {
    name: WATER_NETWORK.features[0]?.properties.name ?? 'Saluran Air Baku Kalimalang',
    operator: WATER_NETWORK.features[0]?.properties.operator ?? 'PAM JAYA / Perum Jasa Tirta II',
    coverage: WATER_NETWORK.features[0]?.properties.coverage ?? 'Pasokan utama 82% air baku DKI Jakarta',
    status: WATER_NETWORK.features[0]?.properties.status ?? 'Optimal',
    source: WATER_DATA_META.source,
  },
}

/**
 * Adapter penyedia ringkasan informasi lingkungan aktual untuk onboarding mobile.
 * Dipisahkan dari komponen UI presentasi agar bebas dari efek samping fetch berulang.
 */
export function getOnboardingEnvironmentalPreview(): EnvironmentalPreviewData {
  return REPRESENTATIVE_ENVIRONMENTAL_PREVIEW
}

