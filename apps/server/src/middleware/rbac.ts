import type { Role } from '@studyou/types'
import type { Context, Next } from 'hono'
import type { AppEnv } from '../types'

export function requireRole(role: Role) {
  return async (c: Context<AppEnv>, next: Next) => {
    const user = c.get('user')
    if (!user || user.role !== role) {
      return c.json({ success: false, error: 'Forbidden' }, 403)
    }
    await next()
  }
}
