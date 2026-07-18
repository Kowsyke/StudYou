import { bugReports } from '@studyou/db'
import type { ApiResponse } from '@studyou/types'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../lib/db'
import { validate } from '../lib/validate'
import { authMiddleware } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'
import type { AppEnv } from '../types'

const createReportSchema = z.object({
  category: z.enum(['bug', 'data', 'idea', 'account', 'other']).default('bug'),
  message: z.string().min(10, 'Tell us a little more, at least 10 characters').max(2000),
  pagePath: z.string().max(300).optional(),
})

// Generous limit that still stops an angry loop from flooding the table.
const reportLimiter = rateLimit({ windowMs: 300_000, max: 10 })

export const reportRoutes = new Hono<AppEnv>()

reportRoutes.use('*', authMiddleware)

reportRoutes.post('/', reportLimiter, validate('json', createReportSchema), async (c) => {
  const body = c.req.valid('json')
  const userId = c.get('user').sub

  await db.insert(bugReports).values({
    userId,
    category: body.category,
    message: body.message,
    pagePath: body.pagePath ?? null,
  })

  const response: ApiResponse<{ received: true }> = { success: true, data: { received: true } }
  return c.json(response, 201)
})
