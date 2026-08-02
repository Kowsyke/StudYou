import type { Context, Next } from 'hono'
import type { AppEnv } from '../types'

export interface Bucket {
  count: number
  resetAt: number
}

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<Bucket> | Bucket
}

const MAX_TRACKED_KEYS = 10_000

export class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, Bucket>()
  private maxTrackedKeys: number

  constructor(maxTrackedKeys = MAX_TRACKED_KEYS) {
    this.maxTrackedKeys = maxTrackedKeys
  }

  increment(key: string, windowMs: number): Bucket {
    const now = Date.now()
    if (this.buckets.size > this.maxTrackedKeys) {
      for (const [k, bucket] of this.buckets) {
        if (bucket.resetAt <= now) this.buckets.delete(k)
      }
    }

    const bucket = this.buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      const newBucket = { count: 1, resetAt: now + windowMs }
      this.buckets.set(key, newBucket)
      return newBucket
    }

    bucket.count += 1
    return bucket
  }
}

export interface RateLimitOptions {
  windowMs: number
  max: number
  store?: RateLimitStore
}

export function rateLimit(options: RateLimitOptions) {
  const store = options.store ?? new MemoryRateLimitStore()

  return async (c: Context<AppEnv>, next: Next) => {
    const now = Date.now()
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('x-real-ip') ??
      'unknown'
    const key = `${ip}:${c.req.path}`

    const bucket = await store.increment(key, options.windowMs)

    if (bucket.count > options.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
      c.header('Retry-After', String(retryAfterSeconds))
      return c.json({ success: false, error: 'Too many attempts. Please try again shortly.' }, 429)
    }

    return next()
  }
}
