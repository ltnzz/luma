export interface AqiLevelConfig {
  min: number
  max: number
  category: string
  color: string
  textColor: string
  badgeBg: string
  badgeBorder: string
  advice: string
  icon: string
}

export const AQI_LEVELS: AqiLevelConfig[] = [
  {
    min: 0,
    max: 50,
    category: 'Baik',
    color: '#10b981',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-300/60 dark:border-emerald-700/60',
    advice: 'Kualitas udara sangat baik. Aman untuk beraktivitas luar.',
    icon: '😊',
  },
  {
    min: 51,
    max: 100,
    category: 'Sedang',
    color: '#f59e0b',
    textColor: 'text-amber-700 dark:text-amber-300',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-300/60 dark:border-amber-700/60',
    advice: 'Dapat diterima. Kelompok sangat sensitif kurangi aktivitas berat.',
    icon: '😐',
  },
  {
    min: 101,
    max: 150,
    category: 'Sensitif',
    color: '#f97316',
    textColor: 'text-orange-700 dark:text-orange-300',
    badgeBg: 'bg-orange-500/10',
    badgeBorder: 'border-orange-300/60 dark:border-orange-700/60',
    advice: 'Kelompok rentan (anak & lansia) disarankan memakai masker.',
    icon: '😷',
  },
  {
    min: 151,
    max: 200,
    category: 'Tidak Sehat',
    color: '#e11d48',
    textColor: 'text-rose-800 dark:text-rose-200',
    badgeBg: 'bg-rose-500/25 dark:bg-rose-500/20',
    badgeBorder: 'border-rose-400 dark:border-rose-500/80',
    advice: 'Gunakan masker di luar ruangan & tutup ventilasi udara.',
    icon: '😷',
  },
  {
    min: 201,
    max: 300,
    category: 'Sangat Tidak Sehat',
    color: '#a855f7',
    textColor: 'text-purple-700 dark:text-purple-300',
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-300/80 dark:border-purple-700/80',
    advice: 'Peringatan kesehatan darurat. Hindari aktivitas luar.',
    icon: '🤢',
  },
  {
    min: 301,
    max: 500,
    category: 'Berbahaya',
    color: '#78350f',
    textColor: 'text-amber-950 dark:text-amber-100',
    badgeBg: 'bg-amber-900/20',
    badgeBorder: 'border-amber-900/60',
    advice: 'Tingkat bahaya serius. Tetap berada di dalam ruangan.',
    icon: '☠️',
  },
]

export function getAqiLevel(aqi: number): AqiLevelConfig {
  const found = AQI_LEVELS.find((lvl) => aqi >= lvl.min && aqi <= lvl.max)
  return found ?? AQI_LEVELS[AQI_LEVELS.length - 1]
}

export interface AqiSamplePoint {
  id: string
  code: string
  name: string
  wilayah: string
  center: [number, number] // [lng, lat]
  aqi: number
  category: string
  pm25: number
  pm10: number
}

export type SpkuStation = AqiSamplePoint

export const AQI_SAMPLE_POINTS: AqiSamplePoint[] = [
  {
    id: 'sampel-pusat',
    code: 'JAKARTA PUSAT',
    name: 'Sampel Model Thamrin / Monas',
    wilayah: 'Jakarta Pusat',
    center: [106.8341, -6.1805],
    aqi: 173,
    category: 'Tidak Sehat',
    pm25: 68.2,
    pm10: 95.4,
  },
  {
    id: 'sampel-selatan',
    code: 'JAKARTA SELATAN',
    name: 'Sampel Model Jagakarsa',
    wilayah: 'Jakarta Selatan',
    center: [106.8097, -6.2615],
    aqi: 165,
    category: 'Tidak Sehat',
    pm25: 64.0,
    pm10: 89.1,
  },
  {
    id: 'sampel-barat',
    code: 'JAKARTA BARAT',
    name: 'Sampel Model Kebon Jeruk',
    wilayah: 'Jakarta Barat',
    center: [106.7589, -6.1683],
    aqi: 170,
    category: 'Tidak Sehat',
    pm25: 66.5,
    pm10: 92.0,
  },
  {
    id: 'sampel-utara',
    code: 'JAKARTA UTARA',
    name: 'Sampel Model Cilincing & Kelapa Gading',
    wilayah: 'Jakarta Utara',
    center: [106.8926, -6.1214],
    aqi: 156,
    category: 'Tidak Sehat',
    pm25: 58.7,
    pm10: 82.3,
  },
  {
    id: 'sampel-timur',
    code: 'JAKARTA TIMUR',
    name: 'Sampel Model Lubang Buaya',
    wilayah: 'Jakarta Timur',
    center: [106.9004, -6.225],
    aqi: 168,
    category: 'Tidak Sehat',
    pm25: 65.1,
    pm10: 90.5,
  },
  {
    id: 'sampel-seribu',
    code: 'KEP. SERIBU',
    name: 'Sampel Model Maritim Kepulauan',
    wilayah: 'Kep. Seribu',
    center: [106.5615, -5.6122],
    aqi: 48,
    category: 'Baik',
    pm25: 12.0,
    pm10: 22.4,
  },
]

export const SPKU_STATIONS = AQI_SAMPLE_POINTS

