import type { Context, Next } from 'hono'
import type { AppEnv } from '../types'

interface Bucket {
  count: number
  resetAt: number
}

export interface RateLimitOptions {
  windowMs: number
  max: number
}

const MAX_TRACKED_KEYS = 10_000

/**
 * Fixed window in memory rate limiter keyed by client IP and route path.
 * Suited to a single Bun process: no external store, no new dependency,
 * and auth brute force only needs to be slowed per instance to be useless.
 * State resets on restart, which is acceptable for this threat model.
 */
export function rateLimit(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>()

  return async (c: Context<AppEnv>, next: Next) => {
    const now = Date.now()

    if (buckets.size > MAX_TRACKED_KEYS) {
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key)
      }
    }

    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('x-real-ip') ??
      'unknown'
    const key = `${ip}:${c.req.path}`

    const bucket = buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs })
      return next()
    }

    bucket.count += 1
    if (bucket.count > options.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
      c.header('Retry-After', String(retryAfterSeconds))
      return c.json({ success: false, error: 'Too many attempts. Please try again shortly.' }, 429)
    }

    return next()
  }
}
