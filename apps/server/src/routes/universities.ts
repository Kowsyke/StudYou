import { countries, universities } from '@studyou/db'
import { type ApiResponse, UK_REGIONS, type University } from '@studyou/types'
import { type SQL, and, asc, eq, ilike, inArray, or } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../lib/db'
import { validate } from '../lib/validate'
import { authMiddleware } from '../middleware/auth'
import type { AppEnv } from '../types'

const listQuerySchema = z.object({
  search: z.string().max(200).optional(),
  // Comma separated region names, validated against the known region set.
  regions: z
    .string()
    .max(400)
    .optional()
    .transform((value) => (value ? value.split(',').map((r) => r.trim()) : undefined))
    .refine(
      (list) => !list || list.every((r) => (UK_REGIONS as readonly string[]).includes(r)),
      'Unknown region',
    ),
  russellGroup: z.enum(['true', 'false']).optional(),
  sort: z.enum(['rank', 'name']).default('rank'),
  country: z.string().length(2).default('GB'),
})

function toUniversity(row: typeof universities.$inferSelect): University {
  return {
    id: row.id,
    countryId: row.countryId,
    rank: row.rank,
    name: row.name,
    city: row.city,
    region: row.region,
    website: row.website,
    internationalUrl: row.internationalUrl,
    ugAdmissionsUrl: row.ugAdmissionsUrl,
    russellGroup: row.russellGroup,
    notes: row.notes,
    lastUpdated: row.lastUpdated.toISOString(),
  }
}

export const universityRoutes = new Hono<AppEnv>()

universityRoutes.use('*', authMiddleware)

universityRoutes.get('/', validate('query', listQuerySchema), async (c) => {
  const query = c.req.valid('query')

  const conditions: SQL[] = [eq(countries.code, query.country.toUpperCase())]
  if (query.regions && query.regions.length > 0) {
    conditions.push(inArray(universities.region, query.regions))
  }
  if (query.russellGroup) {
    conditions.push(eq(universities.russellGroup, query.russellGroup === 'true'))
  }
  if (query.search) {
    const term = `%${query.search}%`
    const searchCondition = or(ilike(universities.name, term), ilike(universities.city, term))
    if (searchCondition) conditions.push(searchCondition)
  }

  const rows = await db
    .select({
      id: universities.id,
      countryId: universities.countryId,
      rank: universities.rank,
      name: universities.name,
      city: universities.city,
      region: universities.region,
      website: universities.website,
      internationalUrl: universities.internationalUrl,
      ugAdmissionsUrl: universities.ugAdmissionsUrl,
      russellGroup: universities.russellGroup,
      notes: universities.notes,
      lastUpdated: universities.lastUpdated,
    })
    .from(universities)
    .innerJoin(countries, eq(universities.countryId, countries.id))
    .where(and(...conditions))
    .orderBy(query.sort === 'rank' ? asc(universities.rank) : asc(universities.name))

  const response: ApiResponse<University[]> = { success: true, data: rows.map(toUniversity) }
  return c.json(response)
})
