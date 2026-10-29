CREATE TABLE "air_quality_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"stasiun" varchar(100),
	"wilayah" varchar(100),
	"pm25" integer,
	"pm10" integer,
	"so2" integer,
	"co" integer,
	"o3" integer,
	"no2" integer,
	"kategori" varchar(50),
	"tanggal" varchar(30),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"sub_category" varchar(100) NOT NULL,
	"wilayah" varchar(100) NOT NULL,
	"kecamatan" varchar(100),
	"address" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facility_budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"facility_id" varchar(100) NOT NULL,
	"total" text,
	"source" text,
	"year" varchar(100),
	"contractor" text,
	"status" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facility_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"facility_id" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"size" varchar(50),
	"dept" varchar(100),
	"file_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facility_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"facility_id" varchar(100) NOT NULL,
	"aqi" integer,
	"aqi_status" varchar(100),
	"pm25" varchar(100),
	"walkability" varchar(50),
	"transit_access" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facility_specs" (
	"id" serial PRIMARY KEY NOT NULL,
	"facility_id" varchar(100) NOT NULL,
	"spec_key" varchar(100) NOT NULL,
	"spec_value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "green_spaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"periode" varchar(10),
	"wilayah" varchar(100),
	"kecamatan" varchar(100),
	"kelurahan" varchar(100),
	"nama_rth" text NOT NULL,
	"alamat" text,
	"jenis_rth" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_facilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_faskes" text NOT NULL,
	"jenis_faskes" varchar(50),
	"wilayah" varchar(100),
	"kecamatan" varchar(100),
	"kelurahan" varchar(100),
	"alamat" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regional_indicators" (
	"id" serial PRIMARY KEY NOT NULL,
	"wilayah_code" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"rth_pct" varchar(50),
	"rth_target" text,
	"aqi_val" varchar(50),
	"aqi_status" varchar(100),
	"sekolah_total" varchar(50),
	"sekolah_sub" text,
	"faskes_total" varchar(50),
	"faskes_sub" text,
	"fasum_total" varchar(50),
	"fasum_sub" text,
	"transum_total" varchar(50),
	"transum_sub" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "regional_indicators_wilayah_code_unique" UNIQUE("wilayah_code")
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"periode" varchar(10),
	"wilayah" varchar(100),
	"kecamatan" varchar(100),
	"kelurahan" varchar(100),
	"jenjang" varchar(20),
	"nama_sekolah" text NOT NULL,
	"npsn" varchar(20),
	"status" varchar(20),
	"jumlah_siswa" integer DEFAULT 0,
	"jumlah_guru" integer DEFAULT 0,
	"ruang_kelas" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transit_stops" (
	"id" serial PRIMARY KEY NOT NULL,
	"periode" varchar(10),
	"koridor" varchar(50),
	"rute" text,
	"nama_halte" varchar(150) NOT NULL,
	"lokasi" text,
	"tahun_dibangun" varchar(50),
	"tipe_akses" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "water_quality_samples" (
	"id" serial PRIMARY KEY NOT NULL,
	"periode" varchar(10),
	"periode_pemantauan" varchar(50),
	"bulan" varchar(10),
	"titik_sampel" varchar(100),
	"nama_sungai" varchar(100) NOT NULL,
	"alamat" text,
	"lat" double precision,
	"lng" double precision,
	"jenis_parameter" varchar(50),
	"parameter" varchar(100) NOT NULL,
	"baku_mutu" numeric,
	"hasil_pengukuran" numeric,
	"melebihi_baku_mutu" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "facility_budgets" ADD CONSTRAINT "facility_budgets_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_documents" ADD CONSTRAINT "facility_documents_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_metrics" ADD CONSTRAINT "facility_metrics_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_specs" ADD CONSTRAINT "facility_specs_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;