import type { Context, Next } from 'hono'
import Redis from 'ioredis'
import { env } from '../lib/env'
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

/**
 * Fixed window limiter backed by Redis so the count is shared across every
 * server instance, which is what makes the limit real once the app runs on
 * more than one process behind a load balancer. INCR is atomic; the window is
 * set on the first hit with PEXPIRE. If Redis is unreachable the store fails
 * over to an in-memory limiter so the app stays up and still limits per
 * instance, rather than erroring the request.
 */
export class RedisRateLimitStore implements RateLimitStore {
  private redis: Redis
  private fallback = new MemoryRateLimitStore()
  private warned = false

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 2000)),
    })
    // ioredis emits error events that crash the process if unhandled.
    this.redis.on('error', (err) => {
      if (!this.warned) {
        console.error('Rate limit Redis unavailable, falling back to in-memory:', err.message)
        this.warned = true
      }
    })
  }

  async increment(key: string, windowMs: number): Promise<Bucket> {
    const now = Date.now()
    const rkey = `rl:${key}`
    try {
      const count = await this.redis.incr(rkey)
      if (count === 1) {
        await this.redis.pexpire(rkey, windowMs)
        return { count, resetAt: now + windowMs }
      }
      const pttl = await this.redis.pttl(rkey)
      return { count, resetAt: now + (pttl > 0 ? pttl : windowMs) }
    } catch {
      return this.fallback.increment(key, windowMs)
    }
  }
}

export interface RateLimitOptions {
  windowMs: number
  max: number
  store?: RateLimitStore
}

// One shared store for every limiter in the process. Keys are namespaced by
// request path, so the login and register windows never collide. Redis is used
// when REDIS_URL is configured, otherwise the per-process in-memory store.
let defaultStore: RateLimitStore | undefined
function getDefaultStore(): RateLimitStore {
  if (!defaultStore) {
    defaultStore = env.redisUrl ? new RedisRateLimitStore(env.redisUrl) : new MemoryRateLimitStore()
  }
  return defaultStore
}

export function rateLimit(options: RateLimitOptions) {
  const store = options.store ?? getDefaultStore()

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
