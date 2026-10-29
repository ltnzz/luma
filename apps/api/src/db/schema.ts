import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  doublePrecision,
  numeric,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sektor Pendidikan (Sekolah)
export const schools = pgTable('schools', {
  id: uuid('id').defaultRandom().primaryKey(),
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
  id: uuid('id').defaultRandom().primaryKey(),
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
  id: uuid('id').defaultRandom().primaryKey(),
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
  id: uuid('id').defaultRandom().primaryKey(),
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
  id: uuid('id').defaultRandom().primaryKey(),
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
  id: uuid('id').defaultRandom().primaryKey(),
  namaFaskes: text('nama_faskes').notNull(),
  jenisFaskes: varchar('jenis_faskes', { length: 50 }),
  wilayah: varchar('wilayah', { length: 100 }),
  kecamatan: varchar('kecamatan', { length: 100 }),
  kelurahan: varchar('kelurahan', { length: 100 }),
  alamat: text('alamat'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Indikator 6 Sektor Wilayah (Dashboard Kota Terbaca)
export const regionalIndicators = pgTable('regional_indicators', {
  id: uuid('id').defaultRandom().primaryKey(),
  wilayahCode: varchar('wilayah_code', { length: 50 }).notNull().unique(),
  label: varchar('label', { length: 100 }).notNull(),
  rthPct: varchar('rth_pct', { length: 50 }),
  rthTarget: text('rth_target'),
  aqiVal: varchar('aqi_val', { length: 50 }),
  aqiStatus: varchar('aqi_status', { length: 100 }),
  sekolahTotal: varchar('sekolah_total', { length: 50 }),
  sekolahSub: text('sekolah_sub'),
  faskesTotal: varchar('faskes_total', { length: 50 }),
  faskesSub: text('faskes_sub'),
  fasumTotal: varchar('fasum_total', { length: 50 }),
  fasumSub: text('fasum_sub'),
  transumTotal: varchar('transum_total', { length: 50 }),
  transumSub: text('transum_sub'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Direktori Fasilitas Utama (Peta & Detail Drawer)
export const facilities = pgTable('facilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 100 }).unique(),
  name: text('name').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  subCategory: varchar('sub_category', { length: 100 }).notNull(),
  wilayah: varchar('wilayah', { length: 100 }).notNull(),
  kecamatan: varchar('kecamatan', { length: 100 }),
  address: text('address'),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transparansi Anggaran & Kontraktor Fasilitas
export const facilityBudgets = pgTable('facility_budgets', {
  id: uuid('id').defaultRandom().primaryKey(),
  facilityId: uuid('facility_id')
    .notNull()
    .references(() => facilities.id, { onDelete: 'cascade' }),
  total: text('total'),
  source: text('source'),
  year: varchar('year', { length: 100 }),
  contractor: text('contractor'),
  status: varchar('status', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Metrik Lingkungan & Walkability Fasilitas
export const facilityMetrics = pgTable('facility_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  facilityId: uuid('facility_id')
    .notNull()
    .references(() => facilities.id, { onDelete: 'cascade' }),
  aqi: integer('aqi'),
  aqiStatus: varchar('aqi_status', { length: 100 }),
  pm25: varchar('pm25', { length: 100 }),
  walkability: varchar('walkability', { length: 50 }),
  transitAccess: text('transit_access'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Dokumen Publik & Regulasi Fasilitas
export const facilityDocuments = pgTable('facility_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  facilityId: uuid('facility_id')
    .notNull()
    .references(() => facilities.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  size: varchar('size', { length: 50 }),
  dept: varchar('dept', { length: 100 }),
  fileUrl: text('file_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Spesifikasi Teknis Fasilitas
export const facilitySpecs = pgTable('facility_specs', {
  id: uuid('id').defaultRandom().primaryKey(),
  facilityId: uuid('facility_id')
    .notNull()
    .references(() => facilities.id, { onDelete: 'cascade' }),
  specKey: varchar('spec_key', { length: 100 }).notNull(),
  specValue: text('spec_value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relasi Drizzle ORM
export const facilitiesRelations = relations(facilities, ({ one, many }) => ({
  budget: one(facilityBudgets, {
    fields: [facilities.id],
    references: [facilityBudgets.facilityId],
  }),
  metrics: one(facilityMetrics, {
    fields: [facilities.id],
    references: [facilityMetrics.facilityId],
  }),
  documents: many(facilityDocuments),
  specs: many(facilitySpecs),
}));

export const facilityBudgetsRelations = relations(facilityBudgets, ({ one }) => ({
  facility: one(facilities, {
    fields: [facilityBudgets.facilityId],
    references: [facilities.id],
  }),
}));

export const facilityMetricsRelations = relations(facilityMetrics, ({ one }) => ({
  facility: one(facilities, {
    fields: [facilityMetrics.facilityId],
    references: [facilities.id],
  }),
}));

export const facilityDocumentsRelations = relations(facilityDocuments, ({ one }) => ({
  facility: one(facilities, {
    fields: [facilityDocuments.facilityId],
    references: [facilities.id],
  }),
}));

export const facilitySpecsRelations = relations(facilitySpecs, ({ one }) => ({
  facility: one(facilities, {
    fields: [facilitySpecs.facilityId],
    references: [facilities.id],
  }),
}));
