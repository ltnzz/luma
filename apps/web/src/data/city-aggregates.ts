export interface CityAggregate {
  code: string
  name: string
  subdistrictName: string
  center: [number, number]
  zoom: number
  bounds: [[number, number], [number, number]]
  counts: {
    halte: number
    facilities: number
    total: number
  }
  corridors: string[]
}

export const CITY_AGGREGATES: CityAggregate[] = [
  {
    code: 'JAKARTA PUSAT',
    name: 'Jakarta Pusat',
    subdistrictName: 'JakartaPusat',
    center: [106.8341, -6.1805],
    zoom: 13.0,
    bounds: [
      [106.7918, -6.2293],
      [106.8814, -6.1353],
    ],
    counts: {
      halte: 46,
      facilities: 6,
      total: 2531,
    },
    corridors: [
      'KORIDOR 1',
      'KORIDOR 2',
      'KORIDOR 3',
      'KORIDOR 4',
      'KORIDOR 5',
      'KORIDOR 6',
      'KORIDOR 8',
      'KORIDOR 9',
      'KORIDOR 10',
      'KORIDOR 12',
    ],
  },
  {
    code: 'JAKARTA SELATAN',
    name: 'Jakarta Selatan',
    subdistrictName: 'JakartaSelatan',
    center: [106.8097, -6.2615],
    zoom: 12.6,
    bounds: [
      [106.7374, -6.3655],
      [106.8668, -6.2027],
    ],
    counts: {
      halte: 57,
      facilities: 11,
      total: 5512,
    },
    corridors: [
      'KORIDOR 1',
      'KORIDOR 4',
      'KORIDOR 6',
      'KORIDOR 8',
      'KORIDOR 9',
      'KORIDOR 13',
    ],
  },
  {
    code: 'JAKARTA BARAT',
    name: 'Jakarta Barat',
    subdistrictName: 'JakartaBarat',
    center: [106.7589, -6.1683],
    zoom: 12.6,
    bounds: [
      [106.6862, -6.2252],
      [106.8283, -6.0956],
    ],
    counts: {
      halte: 35,
      facilities: 2,
      total: 4489,
    },
    corridors: ['KORIDOR 1', 'KORIDOR 3', 'KORIDOR 8', 'KORIDOR 9', 'KORIDOR 12'],
  },
  {
    code: 'JAKARTA TIMUR',
    name: 'Jakarta Timur',
    subdistrictName: 'JakartaTimur',
    center: [106.9004, -6.225],
    zoom: 12.6,
    bounds: [
      [106.8386, -6.3708],
      [106.9719, -6.1514],
    ],
    counts: {
      halte: 63,
      facilities: 14,
      total: 5470,
    },
    corridors: [
      'KORIDOR 2',
      'KORIDOR 4',
      'KORIDOR 5',
      'KORIDOR 7',
      'KORIDOR 9',
      'KORIDOR 10',
      'KORIDOR 11',
    ],
  },
  {
    code: 'JAKARTA UTARA',
    name: 'Jakarta Utara',
    subdistrictName: 'JakartaUtara',
    center: [106.8926, -6.1214],
    zoom: 12.6,
    bounds: [
      [106.711, -6.1831],
      [106.9728, -6.089],
    ],
    counts: {
      halte: 33,
      facilities: 1,
      total: 3153,
    },
    corridors: ['KORIDOR 2', 'KORIDOR 5', 'KORIDOR 9', 'KORIDOR 10', 'KORIDOR 12'],
  },
  {
    code: 'KEP. SERIBU',
    name: 'Kep. Seribu',
    subdistrictName: 'KepulauanSeribu',
    center: [106.5615, -5.6122],
    zoom: 11.0,
    bounds: [
      [106.3833, -6.0402],
      [106.8475, -5.1844],
    ],
    counts: {
      halte: 0,
      facilities: 0,
      total: 80,
    },
    corridors: [],
  },
]
