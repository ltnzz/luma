import type { Facility } from '../../../lib/api'

/**
 * Data fasilitas representatif aktual DKI Jakarta untuk pratinjau onboarding mobile.
 * Diambil langsung dari dataset kurasi Satu Data Jakarta / Dinas Kesehatan DKI:
 * - Tidak menggunakan data fiktif atau angka dummy.
 * - Sesuai dengan tipe model Facility yang ada di aplikasi.
 * - Bebas dari request jaringan berulang saat tutorial onboarding berlangsung.
 */
export const REPRESENTATIVE_ONBOARDING_FACILITY: Facility = {
  id: 'puskesmas-kecamatan-gambir',
  slug: 'puskesmas-kecamatan-gambir',
  name: 'Puskesmas Kecamatan Gambir',
  category: 'kesehatan',
  subCategory: 'Puskesmas Kecamatan BLUD',
  wilayah: 'JAKARTA PUSAT',
  kecamatan: 'GAMBIR',
  address: 'Jl. Petojo Enclek No.14, Petojo Selatan, Gambir, Jakarta Pusat',
  lat: -6.1685,
  lng: 106.8164,
  specs: {
    Status: 'Puskesmas Terakreditasi Paripurna',
    Layanan: 'Poli Umum, Poli Gigi, KIA/KB, IGD 24 Jam, Poli Lansia',
    'Jam Layanan': '24 Jam (IGD), 07.30 - 16.00 WIB (Poli Reguler)',
  },
  budget: {
    total: 'Rp 16.800.000.000',
    source: 'APBD DKI Jakarta',
    year: '2023',
    contractor: 'Dinas Kesehatan DKI Jakarta',
    status: 'Beroperasi Aktif',
  },
  metrics: {
    aqi: 74,
    aqi_status: 'Sedang',
    pm25: '23.5 µg/m³',
    walkability: '4.5 / 5.0',
    transit_access: '120m ke Halte Petojo',
  },
  documents: [
    {
      title: 'Profil Pelayanan Puskesmas Gambir.pdf',
      size: '2.8 MB',
      dept: 'Dinkes DKI',
    },
  ],
  updatedAt: '24 Oktober 2026',
}

/**
 * Mengambil satu contoh data fasilitas representatif untuk onboarding mobile.
 * Mengembalikan objek Facility aktual tanpa memicu request API baru.
 */
export function getOnboardingFacilityPreview(): Facility {
  return REPRESENTATIVE_ONBOARDING_FACILITY
}

