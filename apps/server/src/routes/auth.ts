import { countries, users } from '@studyou/db'
import type { ApiResponse, AuthPayload, User } from '@studyou/types'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../lib/db'
import { signToken } from '../lib/jwt'
import { passwordSchema } from '../lib/password'
import { validate } from '../lib/validate'
import { authMiddleware } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'
import type { AppEnv } from '../types'

const registerSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: passwordSchema,
  fullName: z.string().min(1).max(120),
  originCountryCode: z.string().length(2).optional(),
})

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

// Fixed windows sized to stay invisible to a real person and the e2e
// suite while making credential stuffing impractical.
const loginLimiter = rateLimit({ windowMs: 60_000, max: 20 })
const registerLimiter = rateLimit({ windowMs: 300_000, max: 10 })

function toUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    originCountryId: row.originCountryId,
    createdAt: row.createdAt.toISOString(),
  }
}

export const authRoutes = new Hono<AppEnv>()

authRoutes.post('/register', registerLimiter, validate('json', registerSchema), async (c) => {
  const body = c.req.valid('json')
  const email = body.email.toLowerCase()

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existing) {
    return c.json({ success: false, error: 'An account with this email already exists' }, 409)
  }

  let originCountryId: string | null = null
  if (body.originCountryCode) {
    const [country] = await db
      .select({ id: countries.id })
      .from(countries)
      .where(eq(countries.code, body.originCountryCode.toUpperCase()))
    originCountryId = country?.id ?? null
  }

  const [created] = await db
    .insert(users)
    .values({
      email,
      passwordHash: bcrypt.hashSync(body.password, 10),
      fullName: body.fullName,
      role: 'student',
      originCountryId,
    })
    .returning()

  const user = toUser(created)
  const token = signToken({ sub: user.id, email: user.email, role: user.role })
  const response: ApiResponse<AuthPayload> = { success: true, data: { user, token } }
  return c.json(response, 201)
})

authRoutes.post('/login', loginLimiter, validate('json', loginSchema), async (c) => {
  const body = c.req.valid('json')
  const [row] = await db.select().from(users).where(eq(users.email, body.email.toLowerCase()))

  if (!row || !bcrypt.compareSync(body.password, row.passwordHash)) {
    return c.json({ success: false, error: 'Invalid email or password' }, 401)
  }

  if (row.suspended) {
    return c.json(
      {
        success: false,
        error: 'This account is suspended. Contact support if you think this is a mistake.',
      },
      403,
    )
  }

  const user = toUser(row)
  const token = signToken({ sub: user.id, email: user.email, role: user.role })
  const response: ApiResponse<AuthPayload> = { success: true, data: { user, token } }
  return c.json(response)
})

authRoutes.get('/me', authMiddleware, async (c) => {
  const payload = c.get('user')
  const [row] = await db.select().from(users).where(eq(users.id, payload.sub))
  if (!row) return c.json({ success: false, error: 'User not found' }, 404)
  const response: ApiResponse<User> = { success: true, data: toUser(row) }
  return c.json(response)
})
