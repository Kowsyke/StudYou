import type { Context, Next } from 'hono'
import { verifyToken } from '../lib/jwt'
import type { AppEnv } from '../types'

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  try {
    const payload = verifyToken(authHeader.slice('Bearer '.length))
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401)
  }
}
