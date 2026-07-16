import { describe, expect, test } from 'bun:test'
import type { Context } from 'hono'
import type { AppEnv } from '../types'
import { rateLimit } from './rateLimit'

interface FakeResult {
  status: number | undefined
  headers: Record<string, string>
}

function makeContext(ip: string, path: string, result: FakeResult) {
  return {
    req: {
      path,
      header: (name: string) => (name === 'x-forwarded-for' ? ip : undefined),
    },
    header: (name: string, value: string) => {
      result.headers[name] = value
    },
    json: (_body: unknown, status?: number) => {
      result.status = status
      return new Response(null, { status })
    },
  } as unknown as Context<AppEnv>
}

async function fire(middleware: ReturnType<typeof rateLimit>, ip: string, path: string) {
  const result: FakeResult = { status: undefined, headers: {} }
  let passed = false
  await middleware(makeContext(ip, path, result), async () => {
    passed = true
  })
  return { passed, result }
}

describe('rateLimit', () => {
  test('allows requests up to the limit', async () => {
    const middleware = rateLimit({ windowMs: 60_000, max: 3 })
    for (let i = 0; i < 3; i++) {
      const { passed } = await fire(middleware, '1.1.1.1', '/login')
      expect(passed).toBe(true)
    }
  })

  test('blocks the request after the limit with 429 and Retry-After', async () => {
    const middleware = rateLimit({ windowMs: 60_000, max: 2 })
    await fire(middleware, '2.2.2.2', '/login')
    await fire(middleware, '2.2.2.2', '/login')
    const { passed, result } = await fire(middleware, '2.2.2.2', '/login')
    expect(passed).toBe(false)
    expect(result.status).toBe(429)
    expect(Number(result.headers['Retry-After'])).toBeGreaterThan(0)
  })

  test('tracks each client IP separately', async () => {
    const middleware = rateLimit({ windowMs: 60_000, max: 1 })
    await fire(middleware, '3.3.3.3', '/login')
    const blocked = await fire(middleware, '3.3.3.3', '/login')
    const other = await fire(middleware, '4.4.4.4', '/login')
    expect(blocked.passed).toBe(false)
    expect(other.passed).toBe(true)
  })

  test('tracks each path separately for the same IP', async () => {
    const middleware = rateLimit({ windowMs: 60_000, max: 1 })
    await fire(middleware, '5.5.5.5', '/login')
    const otherPath = await fire(middleware, '5.5.5.5', '/register')
    expect(otherPath.passed).toBe(true)
  })

  test('resets the window after it expires', async () => {
    const middleware = rateLimit({ windowMs: 20, max: 1 })
    await fire(middleware, '6.6.6.6', '/login')
    const blocked = await fire(middleware, '6.6.6.6', '/login')
    expect(blocked.passed).toBe(false)
    await new Promise((resolve) => setTimeout(resolve, 30))
    const afterReset = await fire(middleware, '6.6.6.6', '/login')
    expect(afterReset.passed).toBe(true)
  })
})
