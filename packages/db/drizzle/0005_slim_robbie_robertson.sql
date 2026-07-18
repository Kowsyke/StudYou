CREATE TABLE "global_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "global_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "journeys" ADD COLUMN "major" text;--> statement-breakpoint
ALTER TABLE "journeys" ADD COLUMN "regions" text;