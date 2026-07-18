import { date, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { categories, countries } from './core'
import { users } from './users'

export const costTypeEnum = pgEnum('cost_type', ['mandatory', 'optional', 'none'])
export const taskStatusEnum = pgEnum('task_status', ['pending', 'done'])

export const stages = pgTable(
  'stages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    countryId: uuid('country_id')
      .notNull()
      .references(() => countries.id),
    key: text('key').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    orderIndex: integer('order_index').notNull(),
  },
  (t) => [unique('stages_country_key').on(t.countryId, t.key)],
)

export const taskTemplates = pgTable('task_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  countryId: uuid('country_id')
    .notNull()
    .references(() => countries.id),
  stageId: uuid('stage_id')
    .notNull()
    .references(() => stages.id),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  costPence: integer('cost_pence'),
  costType: costTypeEnum('cost_type').notNull().default('none'),
  daysBeforeIntake: integer('days_before_intake').notNull().default(0),
  sourceUrl: text('source_url'),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  orderIndex: integer('order_index').notNull().default(0),
})

export const journeys = pgTable('journeys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  countryId: uuid('country_id')
    .notNull()
    .references(() => countries.id),
  intakeDate: date('intake_date').notNull(),
  courseLevel: text('course_level').notNull(),
  budgetPence: integer('budget_pence').notNull().default(0),
  major: text('major'),
  regions: text('regions'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const journeyTasks = pgTable(
  'journey_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    journeyId: uuid('journey_id')
      .notNull()
      .references(() => journeys.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id')
      .notNull()
      .references(() => taskTemplates.id),
    status: taskStatusEnum('status').notNull().default('pending'),
    targetDate: date('target_date').notNull(),
    completedAt: timestamp('completed_at'),
  },
  (t) => [unique('journey_tasks_journey_template').on(t.journeyId, t.templateId)],
)

export type DbStage = typeof stages.$inferSelect
export type DbTaskTemplate = typeof taskTemplates.$inferSelect
export type DbJourney = typeof journeys.$inferSelect
export type DbJourneyTask = typeof journeyTasks.$inferSelect
