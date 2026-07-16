import { zValidator } from '@hono/zod-validator'
import { countries, journeyTasks, journeys, taskTemplates } from '@studyou/db'
import { planDeadlines } from '@studyou/engine'
import type { ApiResponse, JourneyOverview } from '@studyou/types'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../lib/db'
import { buildOverview } from '../lib/overview'
import { authMiddleware } from '../middleware/auth'
import type { AppEnv } from '../types'

const createJourneySchema = z.object({
  intakeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  courseLevel: z.string().min(1).max(60),
  budgetPence: z.number().int().min(0),
  destinationCountryCode: z.string().length(2).default('GB'),
})

const updateTaskSchema = z.object({
  status: z.enum(['pending', 'done']),
})

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

journeyRoutes.post('/', zValidator('json', createJourneySchema), async (c) => {
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

journeyRoutes.patch('/tasks/:taskId', zValidator('json', updateTaskSchema), async (c) => {
  const { status } = c.req.valid('json')
  const taskId = c.req.param('taskId')
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
})
