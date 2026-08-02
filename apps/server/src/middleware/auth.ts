import { users } from '@studyou/db'
import { eq } from 'drizzle-orm'
import type { Context, Next } from 'hono'
import { db } from '../lib/db'
import { verifyToken } from '../lib/jwt'
import type { AppEnv } from '../types'

function getCookieToken(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined
  const match = cookieHeader.match(/(?:^|;\s*)studyou_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : undefined
}

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const cookieToken = getCookieToken(c.req.header('cookie'))
  const authHeader = c.req.header('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : undefined

  const token = cookieToken ?? bearerToken
  if (!token) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  let payload: ReturnType<typeof verifyToken>
  try {
    payload = verifyToken(token)
  } catch {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401)
  }

  // Suspension applies to existing sessions immediately: a suspended
  // account's valid token is rejected on every request. Role is read fresh
  // from the same row too, so a role change (revocation or promotion in the
  // database) takes effect on the next request rather than only when the
  // token expires; authorization never trusts the role baked into the token.
  const [row] = await db
    .select({ role: users.role, suspended: users.suspended, lastSeenAt: users.lastSeenAt })
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

  c.set('user', { ...payload, role: row.role })
  await next()
}
