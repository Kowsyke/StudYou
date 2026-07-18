import { users } from '@studyou/db'
import { eq } from 'drizzle-orm'
import type { Context, Next } from 'hono'
import { db } from '../lib/db'
import { verifyToken } from '../lib/jwt'
import type { AppEnv } from '../types'

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  let payload: ReturnType<typeof verifyToken>
  try {
    payload = verifyToken(authHeader.slice('Bearer '.length))
  } catch {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401)
  }

  // Suspension applies to existing sessions immediately: a suspended
  // account's valid token is rejected on every request.
  const [row] = await db
    .select({ suspended: users.suspended, lastSeenAt: users.lastSeenAt })
    .from(users)
    .where(eq(users.id, payload.sub))
  if (!row) {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401)
  }
  if (row.suspended) {
    return c.json({ success: false, error: 'This account is suspended' }, 403)
  }

  // Record activity at most once a minute so a burst of requests is one
  // write, keeping the active user metric honest without write churn.
  const now = Date.now()
  const stale = !row.lastSeenAt || now - row.lastSeenAt.getTime() > 60_000
  if (stale) {
    await db
      .update(users)
      .set({ lastSeenAt: new Date(now) })
      .where(eq(users.id, payload.sub))
  }

  c.set('user', payload)
  await next()
}
