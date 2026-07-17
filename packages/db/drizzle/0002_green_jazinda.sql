ALTER TABLE "universities" ADD COLUMN "tuition_intl_min_gbp" integer;--> statement-breakpoint
ALTER TABLE "universities" ADD COLUMN "tuition_intl_max_gbp" integer;--> statement-breakpoint
ALTER TABLE "universities" ADD COLUMN "tuition_home_gbp" integer;--> statement-breakpoint
ALTER TABLE "universities" ADD COLUMN "scholarships_url" text;--> statement-breakpoint
ALTER TABLE "universities" ADD COLUMN "accommodation_url" text;--> statement-breakpoint
ALTER TABLE "universities" ADD CONSTRAINT "universities_country_name" UNIQUE("country_id","name");