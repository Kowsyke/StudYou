CREATE TABLE "region_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_id" uuid NOT NULL,
	"region" text NOT NULL,
	"monthly_rent_min_gbp" integer NOT NULL,
	"monthly_rent_max_gbp" integer NOT NULL,
	"monthly_living_gbp" integer NOT NULL,
	"transport_pass_gbp" integer NOT NULL,
	"main_cities" text NOT NULL,
	"cost_level" text NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "region_costs_country_region" UNIQUE("country_id","region")
);
--> statement-breakpoint
ALTER TABLE "region_costs" ADD CONSTRAINT "region_costs_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;