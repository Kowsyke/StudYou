import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { countries } from './core'

export const roleEnum = pgEnum('role', ['student', 'admin'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: roleEnum('role').notNull().default('student'),
  originCountryId: uuid('origin_country_id').references(() => countries.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type DbUser = typeof users.$inferSelect
export type NewDbUser = typeof users.$inferInsert
