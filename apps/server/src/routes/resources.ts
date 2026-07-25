import { categories, countries, resources } from '@studyou/db'
import type { ApiResponse, CategoryKey, Resource } from '@studyou/types'
import { type SQL, and, eq, ilike, or, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../lib/db'
import { validate } from '../lib/validate'
import { authMiddleware } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import type { AppEnv } from '../types'

// Hard ceiling on rows returned in one call. Well above the current data set
// so nothing is truncated today, but it stops an unbounded response as the
// country-agnostic data set grows. Proper paging is a later sprint.
const MAX_PAGE_SIZE = 500

// z.string().url() accepts any scheme the WHATWG URL parser accepts, including
// javascript: and data:, which then execute if rendered as an href. Resource
// links are only ever official web pages, so restrict to http and https.
const webUrl = z
  .string()
  .url()
  .refine((value) => {
    try {
      const { protocol } = new URL(value)
      return protocol === 'http:' || protocol === 'https:'
    } catch {
      return false
    }
  }, 'Source URL must be an http or https link')

const listQuerySchema = z.object({
  search: z.string().max(200).optional(),
  category: z.enum(['visa', 'health', 'finance', 'housing', 'documents', 'arrival']).optional(),
  sort: z.enum(['cost', 'deadline', 'updated', 'title']).default('title'),
  order: z.enum(['asc', 'desc']).default('asc'),
  country: z.string().length(2).default('GB'),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(MAX_PAGE_SIZE),
})

const resourceBodySchema = z.object({
  categoryKey: z.enum(['visa', 'health', 'finance', 'housing', 'documents', 'arrival']),
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(2000),
  costPence: z.number().int().min(0).max(100_000_000).nullable(),
  deadlineDaysBeforeIntake: z.number().int().min(-365).max(1095).nullable(),
  sourceUrl: webUrl,
  country: z.string().length(2).default('GB'),
})

const idParamSchema = z.object({
  id: z.string().uuid('Invalid resource id'),
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

resourceRoutes.get('/', validate('query', listQuerySchema), async (c) => {
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
    .limit(query.limit)

  const response: ApiResponse<Resource[]> = { success: true, data: rows.map(toResource) }
  return c.json(response)
})

resourceRoutes.post(
  '/',
  authMiddleware,
  requireRole('admin'),
  validate('json', resourceBodySchema),
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

    const resource = toResource({ ...created, categoryKey: body.categoryKey })
    const response: ApiResponse<Resource> = { success: true, data: resource }
    return c.json(response, 201)
  },
)

resourceRoutes.put(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  validate('param', idParamSchema),
  validate('json', resourceBodySchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
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

    const resource = toResource({ ...updated, categoryKey: body.categoryKey })
    const response: ApiResponse<Resource> = { success: true, data: resource }
    return c.json(response)
  },
)

resourceRoutes.delete(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  validate('param', idParamSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const [deleted] = await db
      .delete(resources)
      .where(eq(resources.id, id))
      .returning({ id: resources.id })
    if (!deleted) return c.json({ success: false, error: 'Resource not found' }, 404)
    return c.json({ success: true, data: { id: deleted.id } })
  },
)

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
