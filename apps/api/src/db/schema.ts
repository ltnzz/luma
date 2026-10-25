import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  doublePrecision,
  numeric,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sektor Pendidikan (Sekolah)
export const schools = pgTable('schools', {
  id: serial('id').primaryKey(),
  periode: varchar('periode', { length: 10 }),
  wilayah: varchar('wilayah', { length: 100 }),
  kecamatan: varchar('kecamatan', { length: 100 }),
  kelurahan: varchar('kelurahan', { length: 100 }),
  jenjang: varchar('jenjang', { length: 20 }),
  namaSekolah: text('nama_sekolah').notNull(),
  npsn: varchar('npsn', { length: 20 }),
  status: varchar('status', { length: 20 }),
  jumlahSiswa: integer('jumlah_siswa').default(0),
  jumlahGuru: integer('jumlah_guru').default(0),
  ruangKelas: integer('ruang_kelas').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sektor Ruang Terbuka Hijau (RTH)
export const greenSpaces = pgTable('green_spaces', {
  id: serial('id').primaryKey(),
  periode: varchar('periode', { length: 10 }),
  wilayah: varchar('wilayah', { length: 100 }),
  kecamatan: varchar('kecamatan', { length: 100 }),
  kelurahan: varchar('kelurahan', { length: 100 }),
  namaRth: text('nama_rth').notNull(),
  alamat: text('alamat'),
  jenisRth: varchar('jenis_rth', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sektor Kualitas Air Sungai
export const waterQualitySamples = pgTable('water_quality_samples', {
  id: serial('id').primaryKey(),
  periode: varchar('periode', { length: 10 }),
  periodePemantauan: varchar('periode_pemantauan', { length: 50 }),
  bulan: varchar('bulan', { length: 10 }),
  titikSampel: varchar('titik_sampel', { length: 100 }),
  namaSungai: varchar('nama_sungai', { length: 100 }).notNull(),
  alamat: text('alamat'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  jenisParameter: varchar('jenis_parameter', { length: 50 }),
  parameter: varchar('parameter', { length: 100 }).notNull(),
  bakuMutu: numeric('baku_mutu'),
  hasilPengukuran: numeric('hasil_pengukuran'),
  melebihiBakuMutu: boolean('melebihi_baku_mutu').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sektor Transportasi Umum (Transjakarta)
export const transitStops = pgTable('transit_stops', {
  id: serial('id').primaryKey(),
  periode: varchar('periode', { length: 10 }),
  koridor: varchar('koridor', { length: 50 }),
  rute: text('rute'),
  namaHalte: varchar('nama_halte', { length: 150 }).notNull(),
  lokasi: text('lokasi'),
  tahunDibangun: varchar('tahun_dibangun', { length: 50 }),
  tipeAkses: varchar('tipe_akses', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sektor Kualitas Udara (SPKU)
export const airQualityMetrics = pgTable('air_quality_metrics', {
  id: serial('id').primaryKey(),
  stasiun: varchar('stasiun', { length: 100 }),
  wilayah: varchar('wilayah', { length: 100 }),
  pm25: integer('pm25'),
  pm10: integer('pm10'),
  so2: integer('so2'),
  co: integer('co'),
  o3: integer('o3'),
  no2: integer('no2'),
  kategori: varchar('kategori', { length: 50 }),
  tanggal: varchar('tanggal', { length: 30 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sektor Fasilitas Kesehatan
export const healthFacilities = pgTable('health_facilities', {
  id: serial('id').primaryKey(),
  namaFaskes: text('nama_faskes').notNull(),
  jenisFaskes: varchar('jenis_faskes', { length: 50 }),
  wilayah: varchar('wilayah', { length: 100 }),
  kecamatan: varchar('kecamatan', { length: 100 }),
  kelurahan: varchar('kelurahan', { length: 100 }),
  alamat: text('alamat'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

