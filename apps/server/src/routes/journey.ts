import { countries, journeyTasks, journeys, taskTemplates, users } from '@studyou/db'
import { planDeadlines } from '@studyou/engine'
import type { ApiResponse, JourneyOverview } from '@studyou/types'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../lib/db'
import { buildOverview } from '../lib/overview'
import { validate } from '../lib/validate'
import { authMiddleware } from '../middleware/auth'
import type { AppEnv } from '../types'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD date format')

const createJourneySchema = z.object({
  intakeDate: isoDate,
  courseLevel: z.string().min(1).max(60),
  budgetPence: z.number().int().min(0).max(100_000_000),
  destinationCountryCode: z.string().length(2).default('GB'),
  major: z.string().min(1).max(100).optional().nullable(),
  regions: z.array(z.string()).optional().nullable(),
})

const updateTaskSchema = z.object({
  status: z.enum(['pending', 'done']),
})

const taskParamSchema = z.object({
  taskId: z.string().uuid('Invalid task id'),
})

const settingsSchema = z
  .object({
    intakeDate: isoDate.optional(),
    budgetPence: z.number().int().min(0).max(100_000_000).optional(),
    originCountryCode: z.string().length(2).nullable().optional(),
  })
  .refine(
    (value) =>
      value.intakeDate !== undefined ||
      value.budgetPence !== undefined ||
      value.originCountryCode !== undefined,
    { message: 'Provide at least one setting to change' },
  )

export const journeyRoutes = new Hono<AppEnv>()

journeyRoutes.use('*', authMiddleware)

journeyRoutes.get('/', async (c) => {
  const overview = await buildOverview(c.get('user').sub)
  if (!overview) {
    return c.json({ success: false, error: 'No journey yet. Complete onboarding first.' }, 404)
  }
  const response: ApiResponse<JourneyOverview> = { success: true, data: overview }
  return c.json(response)
})

journeyRoutes.post('/', validate('json', createJourneySchema), async (c) => {
  const body = c.req.valid('json')
  const userId = c.get('user').sub

  const [existing] = await db
    .select({ id: journeys.id })
    .from(journeys)
    .where(eq(journeys.userId, userId))
  if (existing) {
    return c.json({ success: false, error: 'You already have a journey' }, 409)
  }

  const [destination] = await db
    .select()
    .from(countries)
    .where(
      and(
        eq(countries.code, body.destinationCountryCode.toUpperCase()),
        eq(countries.isDestination, true),
      ),
    )
  if (!destination) {
    return c.json({ success: false, error: 'Destination country is not supported yet' }, 400)
  }

  const templates = await db
    .select({ id: taskTemplates.id, daysBeforeIntake: taskTemplates.daysBeforeIntake })
    .from(taskTemplates)
    .where(eq(taskTemplates.countryId, destination.id))
  if (templates.length === 0) {
    return c.json({ success: false, error: 'No roadmap data for this country yet' }, 400)
  }

  const [journey] = await db
    .insert(journeys)
    .values({
      userId,
      countryId: destination.id,
      intakeDate: body.intakeDate,
      courseLevel: body.courseLevel,
      budgetPence: body.budgetPence,
      major: body.major ?? null,
      regions: body.regions ? body.regions.join(',') : null,
    })
    .returning()

  const plan = planDeadlines(body.intakeDate, templates)
  await db.insert(journeyTasks).values(
    templates.map((template) => ({
      journeyId: journey.id,
      templateId: template.id,
      targetDate: plan.get(template.id) ?? body.intakeDate,
    })),
  )

  const overview = await buildOverview(userId)
  const response: ApiResponse<JourneyOverview> = { success: true, data: overview ?? undefined }
  return c.json(response, 201)
})

// Settings changes are ownership scoped through the userId on the journey
// row itself. An intake date change rewrites every task target date through
// the deadline engine inside one transaction, so a crash midway can never
// leave a half replanned roadmap.
journeyRoutes.patch('/settings', validate('json', settingsSchema), async (c) => {
  const body = c.req.valid('json')
  const userId = c.get('user').sub

  const [journey] = await db.select().from(journeys).where(eq(journeys.userId, userId)).limit(1)
  if (!journey) {
    return c.json({ success: false, error: 'No journey yet. Complete onboarding first.' }, 404)
  }

  let originCountryId: string | null | undefined
  if (body.originCountryCode !== undefined) {
    if (body.originCountryCode === null) {
      originCountryId = null
    } else {
      const [country] = await db
        .select({ id: countries.id })
        .from(countries)
        .where(eq(countries.code, body.originCountryCode.toUpperCase()))
      if (!country) {
        return c.json({ success: false, error: 'Unknown origin country' }, 400)
      }
      originCountryId = country.id
    }
  }

  await db.transaction(async (tx) => {
    if (originCountryId !== undefined) {
      await tx.update(users).set({ originCountryId }).where(eq(users.id, userId))
    }

    const journeyChanges: Partial<{ intakeDate: string; budgetPence: number }> = {}
    if (body.intakeDate !== undefined) journeyChanges.intakeDate = body.intakeDate
    if (body.budgetPence !== undefined) journeyChanges.budgetPence = body.budgetPence
    if (Object.keys(journeyChanges).length > 0) {
      await tx.update(journeys).set(journeyChanges).where(eq(journeys.id, journey.id))
    }

    if (body.intakeDate !== undefined && body.intakeDate !== journey.intakeDate) {
      const rows = await tx
        .select({
          id: journeyTasks.id,
          daysBeforeIntake: taskTemplates.daysBeforeIntake,
        })
        .from(journeyTasks)
        .innerJoin(taskTemplates, eq(journeyTasks.templateId, taskTemplates.id))
        .where(eq(journeyTasks.journeyId, journey.id))

      const plan = planDeadlines(body.intakeDate, rows)
      for (const row of rows) {
        const targetDate = plan.get(row.id)
        if (targetDate) {
          await tx.update(journeyTasks).set({ targetDate }).where(eq(journeyTasks.id, row.id))
        }
      }
    }
  })

  const overview = await buildOverview(userId)
  const response: ApiResponse<JourneyOverview> = { success: true, data: overview ?? undefined }
  return c.json(response)
})

journeyRoutes.patch(
  '/tasks/:taskId',
  validate('param', taskParamSchema),
  validate('json', updateTaskSchema),
  async (c) => {
    const { status } = c.req.valid('json')
    const { taskId } = c.req.valid('param')
    const userId = c.get('user').sub

    const [owned] = await db
      .select({ id: journeyTasks.id })
      .from(journeyTasks)
      .innerJoin(journeys, eq(journeyTasks.journeyId, journeys.id))
      .where(and(eq(journeyTasks.id, taskId), eq(journeys.userId, userId)))
    if (!owned) {
      return c.json({ success: false, error: 'Task not found' }, 404)
    }

    await db
      .update(journeyTasks)
      .set({ status, completedAt: status === 'done' ? new Date() : null })
      .where(eq(journeyTasks.id, taskId))

    const overview = await buildOverview(userId)
    const response: ApiResponse<JourneyOverview> = { success: true, data: overview ?? undefined }
    return c.json(response)
  },
)
