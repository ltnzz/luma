ALTER TABLE "air_quality_metrics" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "air_quality_metrics" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "air_quality_metrics" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint

ALTER TABLE "facility_budgets" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "facility_budgets" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "facility_budgets" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint

ALTER TABLE "facility_documents" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "facility_documents" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "facility_documents" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint

ALTER TABLE "facility_metrics" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "facility_metrics" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "facility_metrics" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint

ALTER TABLE "facility_specs" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "facility_specs" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "facility_specs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint

ALTER TABLE "green_spaces" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "green_spaces" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "green_spaces" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint

ALTER TABLE "health_facilities" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "health_facilities" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "health_facilities" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint

ALTER TABLE "regional_indicators" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "regional_indicators" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "regional_indicators" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint

ALTER TABLE "schools" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "schools" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "schools" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint

ALTER TABLE "transit_stops" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "transit_stops" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "transit_stops" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint

ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint

ALTER TABLE "water_quality_samples" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "water_quality_samples" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "water_quality_samples" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
