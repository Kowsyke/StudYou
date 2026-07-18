import { boolean, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { countries } from './core'

export const roleEnum = pgEnum('role', ['student', 'admin'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: roleEnum('role').notNull().default('student'),
  originCountryId: uuid('origin_country_id').references(() => countries.id),
  // Suspended accounts cannot sign in and existing tokens are rejected.
  suspended: boolean('suspended').notNull().default(false),
  // Updated by the auth middleware (throttled) so the admin panel can
  // report genuinely active users, not a fabricated count.
  lastSeenAt: timestamp('last_seen_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const reportStatusEnum = pgEnum('report_status', ['open', 'in_progress', 'resolved'])
export const reportCategoryEnum = pgEnum('report_category', [
  'bug',
  'data',
  'idea',
  'account',
  'other',
])

// Student submitted bug reports and feedback, triaged from the admin panel.
export const bugReports = pgTable('bug_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  category: reportCategoryEnum('category').notNull().default('bug'),
  message: text('message').notNull(),
  pagePath: text('page_path'),
  status: reportStatusEnum('status').notNull().default('open'),
  adminNote: text('admin_note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type DbBugReport = typeof bugReports.$inferSelect

export type DbUser = typeof users.$inferSelect
export type NewDbUser = typeof users.$inferInsert

export const adminNotes = pgTable('admin_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  priority: text('priority').notNull().default('medium'),
  category: text('category').notNull().default('general'),
  author: text('author').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type DbAdminNote = typeof adminNotes.$inferSelect
export type NewDbAdminNote = typeof adminNotes.$inferInsert
