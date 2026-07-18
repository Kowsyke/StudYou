import { categories, countries, globalSettings, regionCosts, stages } from '@studyou/db'
import type {
  ApiResponse,
  Category,
  CategoryKey,
  Country,
  RegionCost,
  Stage,
  StageKey,
} from '@studyou/types'
import { asc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../lib/db'
import { validate } from '../lib/validate'
import { authMiddleware } from '../middleware/auth'
import type { AppEnv } from '../types'

const stagesQuerySchema = z.object({
  country: z
    .string()
    .regex(/^[A-Za-z]{2}$/, 'Country must be a two letter code')
    .default('GB'),
})

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

metaRoutes.get('/stages', validate('query', stagesQuerySchema), async (c) => {
  const code = c.req.valid('query').country.toUpperCase()
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

metaRoutes.get('/region-costs', validate('query', stagesQuerySchema), async (c) => {
  const code = c.req.valid('query').country.toUpperCase()
  const rows = await db
    .select({
      region: regionCosts.region,
      monthlyRentMinGbp: regionCosts.monthlyRentMinGbp,
      monthlyRentMaxGbp: regionCosts.monthlyRentMaxGbp,
      monthlyLivingGbp: regionCosts.monthlyLivingGbp,
      transportPassGbp: regionCosts.transportPassGbp,
      mainCities: regionCosts.mainCities,
      costLevel: regionCosts.costLevel,
    })
    .from(regionCosts)
    .innerJoin(countries, eq(regionCosts.countryId, countries.id))
    .where(eq(countries.code, code))
    .orderBy(asc(regionCosts.region))
  const response: ApiResponse<RegionCost[]> = { success: true, data: rows }
  return c.json(response)
})

const themeSettingsSchema = z.object({
  theme: z.enum(['light', 'dark']),
  accentPreset: z.string().min(1).max(30),
})

metaRoutes.get('/theme', async (c) => {
  const rows = await db.select().from(globalSettings)
  const themeRow = rows.find((r) => r.key === 'theme')
  const accentRow = rows.find((r) => r.key === 'accentPreset')

  return c.json({
    success: true,
    data: {
      theme: themeRow?.value || 'dark',
      accentPreset: accentRow?.value || 'blue',
    },
  })
})

metaRoutes.post('/theme', authMiddleware, validate('json', themeSettingsSchema), async (c) => {
  const user = c.get('user')
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Forbidden' }, 403)
  }

  const { theme, accentPreset } = c.req.valid('json')

  await db
    .insert(globalSettings)
    .values({ key: 'theme', value: theme })
    .onConflictDoUpdate({
      target: globalSettings.key,
      set: { value: theme },
    })

  await db
    .insert(globalSettings)
    .values({ key: 'accentPreset', value: accentPreset })
    .onConflictDoUpdate({
      target: globalSettings.key,
      set: { value: accentPreset },
    })

  return c.json({
    success: true,
    data: { theme, accentPreset },
  })
})
