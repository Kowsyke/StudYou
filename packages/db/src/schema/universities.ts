import { boolean, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { countries } from './core'

// Country agnostic like every domain table: UK data ships first, other
// destinations become data entry. Region is the destination country's own
// regional naming (for GB, the twelve standard regions). Tuition figures
// are indicative annual GBP amounts; deep URLs are nullable because only
// liveness verified links ship.
export const universities = pgTable(
  'universities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    countryId: uuid('country_id')
      .notNull()
      .references(() => countries.id),
    rank: integer('rank').notNull(),
    name: text('name').notNull(),
    city: text('city').notNull(),
    region: text('region').notNull(),
    website: text('website').notNull(),
    internationalUrl: text('international_url').notNull(),
    ugAdmissionsUrl: text('ug_admissions_url').notNull(),
    russellGroup: boolean('russell_group').notNull().default(false),
    notes: text('notes').notNull(),
    tuitionIntlMinGbp: integer('tuition_intl_min_gbp'),
    tuitionIntlMaxGbp: integer('tuition_intl_max_gbp'),
    tuitionHomeGbp: integer('tuition_home_gbp'),
    scholarshipsUrl: text('scholarships_url'),
    accommodationUrl: text('accommodation_url'),
    lastUpdated: timestamp('last_updated').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [unique('universities_country_name').on(table.countryId, table.name)],
)

export type DbUniversity = typeof universities.$inferSelect
export type NewDbUniversity = typeof universities.$inferInsert

// Regional cost of living reference for students, one row per region of
// the destination country. Figures are indicative monthly GBP amounts.
export const regionCosts = pgTable(
  'region_costs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    countryId: uuid('country_id')
      .notNull()
      .references(() => countries.id),
    region: text('region').notNull(),
    monthlyRentMinGbp: integer('monthly_rent_min_gbp').notNull(),
    monthlyRentMaxGbp: integer('monthly_rent_max_gbp').notNull(),
    monthlyLivingGbp: integer('monthly_living_gbp').notNull(),
    transportPassGbp: integer('transport_pass_gbp').notNull(),
    mainCities: text('main_cities').notNull(),
    costLevel: text('cost_level').notNull(),
    lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  },
  (table) => [unique('region_costs_country_region').on(table.countryId, table.region)],
)

export type DbRegionCost = typeof regionCosts.$inferSelect
