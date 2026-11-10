export interface WaterPipelineFeature {
  type: 'Feature'
  id: string
  properties: {
    id: string
    name: string
    type: 'transmisi' | 'distribusi' | 'air_baku'
    operator: string
    diameter: string
    coverage: string
    status: 'Aktif' | 'Optimal'
    color: string
  }
  geometry: {
    type: 'LineString'
    coordinates: [number, number][]
  }
}

export const WATER_DATA_META = {
  source: 'PAM JAYA / Perum Jasa Tirta II',
  period: null,
  updatedAt: null,
} as const

export interface WaterFacilityFeature {
  type: 'Feature'
  id: string
  properties: {
    id: string
    name: string
    type: 'IPA' | 'Reservoir'
    capacity: string
    wilayah: string
    address: string
    status: 'Operasional'
    color: string
  }
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

export const WATER_NETWORK = {
  type: 'FeatureCollection',
  features: [
    // 1. Saluran Transmisi Air Baku Kalimalang - Buaran
    {
      type: 'Feature',
      id: 'pipe-kalimalang-buaran',
      properties: {
        id: 'pipe-kalimalang-buaran',
        name: 'Saluran Pasokan Air Baku Kalimalang (Tarum Barat)',
        type: 'air_baku',
        operator: 'PAM JAYA / Perum Jasa Tirta II',
        diameter: 'Kanal Terbuka & Pipa Ø2200mm',
        coverage: 'Pasokan utama 82% air baku DKI Jakarta dari Waduk Jatiluhur',
        status: 'Optimal',
        color: '#0284c7',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [106.985, -6.252],
          [106.955, -6.242],
          [106.932, -6.234],
          [106.915, -6.228],
        ],
      },
    },
    // 2. Pipa Transmisi Buaran - Cawang - Pejompongan
    {
      type: 'Feature',
      id: 'pipe-buaran-pejompongan',
      properties: {
        id: 'pipe-buaran-pejompongan',
        name: 'Pipa Transmisi Utama Buaran – Cawang – Pejompongan',
        type: 'transmisi',
        operator: 'PAM JAYA',
        diameter: 'Pipa Baja Ø1800mm',
        coverage: 'Koneksi Tulang Punggung Antar-IPA Buaran & Pejompongan',
        status: 'Optimal',
        color: '#0284c7',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [106.915, -6.228],
          [106.885, -6.236],
          [106.865, -6.242],
          [106.843, -6.243],
          [106.824, -6.232],
          [106.808, -6.2085],
        ],
      },
    },
    // 3. Pipa Distribusi Pejompongan - Thamrin - Monas - Kota
    {
      type: 'Feature',
      id: 'pipe-pejompongan-kota',
      properties: {
        id: 'pipe-pejompongan-kota',
        name: 'Pipa Distribusi Utama Poros Thamrin – Monas – Kota',
        type: 'distribusi',
        operator: 'PAM JAYA',
        diameter: 'Pipa Ductile Iron Ø1200mm',
        coverage: 'Kawasan Bisnis Sudirman, Monas, Harmoni hingga Glodok & Kota Tua',
        status: 'Aktif',
        color: '#0ea5e9',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [106.808, -6.2085],
          [106.821, -6.198],
          [106.824, -6.185],
          [106.8272, -6.1754],
          [106.822, -6.162],
          [106.816, -6.148],
          [106.813, -6.135],
        ],
      },
    },
    // 4. Pipa Distribusi Pejompongan - Slipi - Grogol - Pluit - Hutan Kota Penjaringan
    {
      type: 'Feature',
      id: 'pipe-pejompongan-pluit',
      properties: {
        id: 'pipe-pejompongan-pluit',
        name: 'Pipa Distribusi Slipi – Grogol – Penjaringan / Pluit',
        type: 'distribusi',
        operator: 'PAM JAYA',
        diameter: 'Pipa Ø1000mm',
        coverage: 'Jakarta Barat (Grogol, Tomang) & Jakarta Utara (Pluit & Muara Baru)',
        status: 'Aktif',
        color: '#0ea5e9',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [106.808, -6.2085],
          [106.797, -6.201],
          [106.792, -6.175],
          [106.785, -6.165],
          [106.782, -6.142],
          [106.785, -6.125],
        ],
      },
    },
    // 5. Pipa Distribusi Grogol - Pesing - Daan Mogot - Kalideres
    {
      type: 'Feature',
      id: 'pipe-grogol-kalideres',
      properties: {
        id: 'pipe-grogol-kalideres',
        name: 'Pipa Distribusi Koridor Daan Mogot – Kalideres',
        type: 'distribusi',
        operator: 'PAM JAYA',
        diameter: 'Pipa Ø900mm',
        coverage: 'Layanan Pemukiman & Industri Daan Mogot, Rawa Buaya, Kalideres',
        status: 'Aktif',
        color: '#0ea5e9',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [106.785, -6.165],
          [106.765, -6.158],
          [106.745, -6.155],
          [106.725, -6.153],
          [106.705, -6.152],
        ],
      },
    },
    // 6. Pipa Transmisi Buaran - Pulogadung - Sunter - Kemayoran
    {
      type: 'Feature',
      id: 'pipe-buaran-sunter',
      properties: {
        id: 'pipe-buaran-sunter',
        name: 'Pipa Transmisi Buaran – Pulogadung – Sunter',
        type: 'transmisi',
        operator: 'PAM JAYA',
        diameter: 'Pipa Ø1400mm',
        coverage: 'Kawasan Pulogadung, Sunter Jaya, Danau Sunter, Kemayoran',
        status: 'Optimal',
        color: '#0284c7',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [106.915, -6.228],
          [106.918, -6.202],
          [106.898, -6.185],
          [106.885, -6.162],
          [106.872, -6.145],
          [106.852, -6.158],
        ],
      },
    },
    // 7. Pipa Distribusi Pulogadung - Kelapa Gading - Cilincing - Marunda
    {
      type: 'Feature',
      id: 'pipe-pulogadung-marunda',
      properties: {
        id: 'pipe-pulogadung-marunda',
        name: 'Pipa Distribusi Kelapa Gading – Cilincing – Marunda',
        type: 'distribusi',
        operator: 'PAM JAYA',
        diameter: 'Pipa Ø800mm',
        coverage: 'Perluasan Akses Air Bersih Pesisir Jakarta Utara & KBN Marunda',
        status: 'Aktif',
        color: '#0ea5e9',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [106.898, -6.185],
          [106.905, -6.155],
          [106.925, -6.135],
          [106.945, -6.12],
          [106.965, -6.115],
        ],
      },
    },
    // 8. Pipa Distribusi Cilandak - Fatmawati - Blok M
    {
      type: 'Feature',
      id: 'pipe-cilandak-blokm',
      properties: {
        id: 'pipe-cilandak-blokm',
        name: 'Pipa Distribusi Cilandak – Fatmawati – Blok M',
        type: 'distribusi',
        operator: 'PAM JAYA',
        diameter: 'Pipa Ø800mm',
        coverage: 'Jakarta Selatan (Lebak Bulus, Cilandak, Fatmawati, Kebayoran Baru)',
        status: 'Aktif',
        color: '#0ea5e9',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [106.802, -6.295],
          [106.798, -6.275],
          [106.797, -6.255],
          [106.8017, -6.2433],
        ],
      },
    },
    // 9. Pipa Distribusi Cilandak - Pasar Minggu - Tebet
    {
      type: 'Feature',
      id: 'pipe-cilandak-tebet',
      properties: {
        id: 'pipe-cilandak-tebet',
        name: 'Pipa Distribusi TB Simatupang – Pasar Minggu – Pancoran',
        type: 'distribusi',
        operator: 'PAM JAYA',
        diameter: 'Pipa Ø700mm',
        coverage: 'Koridor TB Simatupang, Ragunan, Pasar Minggu hingga Kalibata & Tebet',
        status: 'Aktif',
        color: '#0ea5e9',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [106.802, -6.295],
          [106.825, -6.292],
          [106.845, -6.282],
          [106.855, -6.255],
          [106.852, -6.23],
        ],
      },
    },
    // 10. SPAM Regional Jatiluhur I Pesisir (Hutan Kota Penjaringan - Muara Baru - Ancol)
    {
      type: 'Feature',
      id: 'pipe-pesisir-utara',
      properties: {
        id: 'pipe-pesisir-utara',
        name: 'Pipa Distribusi Pesisir Teluk Jakarta (Muara Baru – Ancol)',
        type: 'distribusi',
        operator: 'PAM JAYA',
        diameter: 'Pipa Ø600mm',
        coverage: 'Sentra Perikanan Muara Baru, Pelabuhan Sunda Kelapa, dan Ancol',
        status: 'Aktif',
        color: '#0ea5e9',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [106.785, -6.125],
          [106.805, -6.115],
          [106.825, -6.118],
          [106.845, -6.125],
        ],
      },
    },
  ] as WaterPipelineFeature[],
}

export const WATER_FACILITIES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'ipa-pejompongan',
      properties: {
        id: 'ipa-pejompongan',
        name: 'IPA Pejompongan I & II',
        type: 'IPA',
        capacity: '5.600 Liter/detik',
        wilayah: 'Jakarta Pusat',
        address: 'Jl. Penjernihan I No. 1, Tanah Abang',
        status: 'Operasional',
        color: '#0284c7',
      },
      geometry: {
        type: 'Point',
        coordinates: [106.808, -6.2085],
      },
    },
    {
      type: 'Feature',
      id: 'ipa-buaran',
      properties: {
        id: 'ipa-buaran',
        name: 'IPA Buaran I, II & III',
        type: 'IPA',
        capacity: '5.000 Liter/detik',
        wilayah: 'Jakarta Timur',
        address: 'Jl. Raya Kalimalang, Duren Sawit',
        status: 'Operasional',
        color: '#0284c7',
      },
      geometry: {
        type: 'Point',
        coordinates: [106.915, -6.228],
      },
    },
    {
      type: 'Feature',
      id: 'ipa-pulogadung',
      properties: {
        id: 'ipa-pulogadung',
        name: 'IPA Pulogadung',
        type: 'IPA',
        capacity: '4.000 Liter/detik',
        wilayah: 'Jakarta Timur',
        address: 'Kawasan Industri Pulogadung',
        status: 'Operasional',
        color: '#0284c7',
      },
      geometry: {
        type: 'Point',
        coordinates: [106.898, -6.185],
      },
    },
    {
      type: 'Feature',
      id: 'ipa-cilandak',
      properties: {
        id: 'ipa-cilandak',
        name: 'IPA Cilandak',
        type: 'IPA',
        capacity: '400 Liter/detik',
        wilayah: 'Jakarta Selatan',
        address: 'Jl. TB Simatupang, Cilandak',
        status: 'Operasional',
        color: '#0284c7',
      },
      geometry: {
        type: 'Point',
        coordinates: [106.802, -6.295],
      },
    },
    {
      type: 'Feature',
      id: 'ipa-penjaringan',
      properties: {
        id: 'ipa-penjaringan',
        name: 'IPA Hutan Kota Penjaringan',
        type: 'IPA',
        capacity: '500 Liter/detik',
        wilayah: 'Jakarta Utara',
        address: 'Hutan Kota Penjaringan, Pluit',
        status: 'Operasional',
        color: '#0284c7',
      },
      geometry: {
        type: 'Point',
        coordinates: [106.785, -6.125],
      },
    },
    {
      type: 'Feature',
      id: 'reservoir-daanmogot',
      properties: {
        id: 'reservoir-daanmogot',
        name: 'Reservoir & Pompa Booster Daan Mogot',
        type: 'Reservoir',
        capacity: 'Kapasitas 1.200 Liter/detik',
        wilayah: 'Jakarta Barat',
        address: 'Jl. Daan Mogot KM 11, Cengkareng',
        status: 'Operasional',
        color: '#0284c7',
      },
      geometry: {
        type: 'Point',
        coordinates: [106.745, -6.155],
      },
    },
    {
      type: 'Feature',
      id: 'reservoir-marunda',
      properties: {
        id: 'reservoir-marunda',
        name: 'Reservoir Komunal Marunda',
        type: 'Reservoir',
        capacity: 'Kapasitas 600 Liter/detik',
        wilayah: 'Jakarta Utara',
        address: 'Rusun Marunda & KBN',
        status: 'Operasional',
        color: '#0284c7',
      },
      geometry: {
        type: 'Point',
        coordinates: [106.965, -6.115],
      },
    },
  ] as WaterFacilityFeature[],
}

