import { categories, countries, stages } from '@studyou/db'
import type { ApiResponse, Category, CategoryKey, Country, Stage, StageKey } from '@studyou/types'
import { asc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../lib/db'
import type { AppEnv } from '../types'

export const metaRoutes = new Hono<AppEnv>()

metaRoutes.get('/countries', async (c) => {
  const rows = await db
    .select()
    .from(countries)
    .where(eq(countries.isActive, true))
    .orderBy(asc(countries.name))
  const data: Country[] = rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    currencyCode: r.currencyCode,
    isDestination: r.isDestination,
  }))
  const response: ApiResponse<Country[]> = { success: true, data }
  return c.json(response)
})

metaRoutes.get('/categories', async (c) => {
  const rows = await db.select().from(categories).orderBy(asc(categories.label))
  const data: Category[] = rows.map((r) => ({
    id: r.id,
    key: r.key as CategoryKey,
    label: r.label,
  }))
  const response: ApiResponse<Category[]> = { success: true, data }
  return c.json(response)
})

metaRoutes.get('/stages', async (c) => {
  const code = (c.req.query('country') ?? 'GB').toUpperCase()
  const rows = await db
    .select({
      id: stages.id,
      countryId: stages.countryId,
      key: stages.key,
      title: stages.title,
      description: stages.description,
      orderIndex: stages.orderIndex,
    })
    .from(stages)
    .innerJoin(countries, eq(stages.countryId, countries.id))
    .where(eq(countries.code, code))
    .orderBy(asc(stages.orderIndex))
  const data: Stage[] = rows.map((r) => ({ ...r, key: r.key as StageKey }))
  const response: ApiResponse<Stage[]> = { success: true, data }
  return c.json(response)
})
