import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { categories, countries } from './core'

export const resources = pgTable('resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  countryId: uuid('country_id')
    .notNull()
    .references(() => countries.id),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  costPence: integer('cost_pence'),
  deadlineDaysBeforeIntake: integer('deadline_days_before_intake'),
  sourceUrl: text('source_url').notNull(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type DbResource = typeof resources.$inferSelect
export type NewDbResource = typeof resources.$inferInsert
