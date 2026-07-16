import { zValidator } from '@hono/zod-validator'
import { categories, countries, resources } from '@studyou/db'
import type { ApiResponse, CategoryKey, Resource } from '@studyou/types'
import { type SQL, and, eq, ilike, or, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import type { AppEnv } from '../types'

const listQuerySchema = z.object({
  search: z.string().max(200).optional(),
  category: z.enum(['visa', 'health', 'finance', 'housing', 'documents', 'arrival']).optional(),
  sort: z.enum(['cost', 'deadline', 'updated', 'title']).default('title'),
  order: z.enum(['asc', 'desc']).default('asc'),
  country: z.string().length(2).default('GB'),
})

const resourceBodySchema = z.object({
  categoryKey: z.enum(['visa', 'health', 'finance', 'housing', 'documents', 'arrival']),
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(2000),
  costPence: z.number().int().min(0).nullable(),
  deadlineDaysBeforeIntake: z.number().int().nullable(),
  sourceUrl: z.string().url(),
  country: z.string().length(2).default('GB'),
})

const sortColumns = {
  cost: resources.costPence,
  deadline: resources.deadlineDaysBeforeIntake,
  updated: resources.lastUpdated,
  title: resources.title,
} as const

function toResource(row: typeof resources.$inferSelect & { categoryKey: string }): Resource {
  return {
    id: row.id,
    countryId: row.countryId,
    categoryId: row.categoryId,
    categoryKey: row.categoryKey as CategoryKey,
    title: row.title,
    summary: row.summary,
    costPence: row.costPence,
    deadlineDaysBeforeIntake: row.deadlineDaysBeforeIntake,
    sourceUrl: row.sourceUrl,
    lastUpdated: row.lastUpdated.toISOString(),
  }
}

export const resourceRoutes = new Hono<AppEnv>()

resourceRoutes.use('*', authMiddleware)

resourceRoutes.get('/', zValidator('query', listQuerySchema), async (c) => {
  const query = c.req.valid('query')

  const conditions: SQL[] = [eq(countries.code, query.country.toUpperCase())]
  if (query.category) conditions.push(eq(categories.key, query.category))
  if (query.search) {
    const term = `%${query.search}%`
    const searchCondition = or(ilike(resources.title, term), ilike(resources.summary, term))
    if (searchCondition) conditions.push(searchCondition)
  }

  const sortColumn = sortColumns[query.sort]
  const rows = await db
    .select({
      id: resources.id,
      countryId: resources.countryId,
      categoryId: resources.categoryId,
      categoryKey: categories.key,
      title: resources.title,
      summary: resources.summary,
      costPence: resources.costPence,
      deadlineDaysBeforeIntake: resources.deadlineDaysBeforeIntake,
      sourceUrl: resources.sourceUrl,
      lastUpdated: resources.lastUpdated,
      createdAt: resources.createdAt,
    })
    .from(resources)
    .innerJoin(categories, eq(resources.categoryId, categories.id))
    .innerJoin(countries, eq(resources.countryId, countries.id))
    .where(and(...conditions))
    .orderBy(
      query.order === 'asc'
        ? sql`${sortColumn} asc nulls last`
        : sql`${sortColumn} desc nulls last`,
    )

  const response: ApiResponse<Resource[]> = { success: true, data: rows.map(toResource) }
  return c.json(response)
})

resourceRoutes.post(
  '/',
  requireRole('admin'),
  zValidator('json', resourceBodySchema),
  async (c) => {
    const body = c.req.valid('json')
    const refs = await lookupRefs(body.country, body.categoryKey)
    if (!refs) return c.json({ success: false, error: 'Unknown country or category' }, 400)

    const [created] = await db
      .insert(resources)
      .values({
        countryId: refs.countryId,
        categoryId: refs.categoryId,
        title: body.title,
        summary: body.summary,
        costPence: body.costPence,
        deadlineDaysBeforeIntake: body.deadlineDaysBeforeIntake,
        sourceUrl: body.sourceUrl,
        lastUpdated: new Date(),
      })
      .returning()

    const response: ApiResponse<Resource> = {
      success: true,
      data: toResource({ ...created, categoryKey: body.categoryKey }),
    }
    return c.json(response, 201)
  },
)

resourceRoutes.put(
  '/:id',
  requireRole('admin'),
  zValidator('json', resourceBodySchema),
  async (c) => {
    const body = c.req.valid('json')
    const id = c.req.param('id')
    const refs = await lookupRefs(body.country, body.categoryKey)
    if (!refs) return c.json({ success: false, error: 'Unknown country or category' }, 400)

    const [updated] = await db
      .update(resources)
      .set({
        countryId: refs.countryId,
        categoryId: refs.categoryId,
        title: body.title,
        summary: body.summary,
        costPence: body.costPence,
        deadlineDaysBeforeIntake: body.deadlineDaysBeforeIntake,
        sourceUrl: body.sourceUrl,
        lastUpdated: new Date(),
      })
      .where(eq(resources.id, id))
      .returning()

    if (!updated) return c.json({ success: false, error: 'Resource not found' }, 404)
    const response: ApiResponse<Resource> = {
      success: true,
      data: toResource({ ...updated, categoryKey: body.categoryKey }),
    }
    return c.json(response)
  },
)

resourceRoutes.delete('/:id', requireRole('admin'), async (c) => {
  const [deleted] = await db
    .delete(resources)
    .where(eq(resources.id, c.req.param('id')))
    .returning({ id: resources.id })
  if (!deleted) return c.json({ success: false, error: 'Resource not found' }, 404)
  return c.json({ success: true, message: 'Resource deleted' })
})

async function lookupRefs(countryCode: string, categoryKey: string) {
  const [country] = await db
    .select({ id: countries.id })
    .from(countries)
    .where(eq(countries.code, countryCode.toUpperCase()))
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.key, categoryKey))
  if (!country || !category) return null
  return { countryId: country.id, categoryId: category.id }
}
