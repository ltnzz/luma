DROP TABLE IF EXISTS "facility_specs" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "facility_documents" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "facility_metrics" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "facility_budgets" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "facilities" CASCADE;--> statement-breakpoint

CREATE TABLE "facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100),
	"name" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"sub_category" varchar(100) NOT NULL,
	"wilayah" varchar(100) NOT NULL,
	"kecamatan" varchar(100),
	"address" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "facilities_slug_unique" UNIQUE("slug")
);--> statement-breakpoint

CREATE TABLE "facility_budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"facility_id" uuid NOT NULL,
	"total" text,
	"source" text,
	"year" varchar(100),
	"contractor" text,
	"status" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "facility_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"facility_id" uuid NOT NULL,
	"title" text NOT NULL,
	"size" varchar(50),
	"dept" varchar(100),
	"file_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "facility_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"facility_id" uuid NOT NULL,
	"aqi" integer,
	"aqi_status" varchar(100),
	"pm25" varchar(100),
	"walkability" varchar(50),
	"transit_access" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "facility_specs" (
	"id" serial PRIMARY KEY NOT NULL,
	"facility_id" uuid NOT NULL,
	"spec_key" varchar(100) NOT NULL,
	"spec_value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "facility_budgets" ADD CONSTRAINT "facility_budgets_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_documents" ADD CONSTRAINT "facility_documents_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_metrics" ADD CONSTRAINT "facility_metrics_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_specs" ADD CONSTRAINT "facility_specs_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;
