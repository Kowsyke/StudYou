import { boolean, numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const countries = pgTable('countries', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 2 }).notNull().unique(),
  name: text('name').notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull(),
  isDestination: boolean('is_destination').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
})

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  label: text('label').notNull(),
})

export const exchangeRates = pgTable('exchange_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull().unique(),
  ratePerGbp: numeric('rate_per_gbp', { precision: 12, scale: 4 }).notNull(),
  source: text('source').notNull(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
})

export type DbCountry = typeof countries.$inferSelect
export type DbCategory = typeof categories.$inferSelect
export type DbExchangeRate = typeof exchangeRates.$inferSelect

export const globalSettings = pgTable('global_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
})

export type DbGlobalSetting = typeof globalSettings.$inferSelect
