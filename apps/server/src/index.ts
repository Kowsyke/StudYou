import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { env } from './lib/env'
import {
  adminRoutes,
  authRoutes,
  journeyRoutes,
  metaRoutes,
  reportRoutes,
  resourceRoutes,
  universityRoutes,
} from './routes'
import type { AppEnv } from './types'

const app = new Hono<AppEnv>()

// Origins allowed to call the API: the configured web client, plus the fixed
// origins a packaged Tauri desktop build loads from (tauri://localhost on
// macOS and Linux, https://tauri.localhost on Windows). Anything else is
// refused. Returning the request origin only when it is on the allowlist
// keeps credentialed CORS safe (never a reflected wildcard).
const allowedOrigins = new Set([env.clientUrl, 'tauri://localhost', 'https://tauri.localhost'])

app.use('*', logger())
app.use('*', secureHeaders())
app.use(
  '*',
  cors({
    origin: (origin) => (allowedOrigins.has(origin) ? origin : null),
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
)

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

const api = new Hono<AppEnv>()
api.route('/auth', authRoutes)
api.route('/journey', journeyRoutes)
api.route('/resources', resourceRoutes)
api.route('/universities', universityRoutes)
api.route('/reports', reportRoutes)
api.route('/admin', adminRoutes)
api.route('/meta', metaRoutes)

app.route('/api/v1', api)

app.notFound((c) => c.json({ success: false, error: 'Not found' }, 404))

// Central error handler. Full details go to the server log only; the
// client always receives the ApiResponse envelope with a safe message,
// never a stack trace, SQL fragment or file path.
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    console.error(`HTTP ${err.status} on ${c.req.method} ${c.req.path}: ${err.message}`)
    return c.json({ success: false, error: err.message || 'Request failed' }, err.status)
  }
  console.error(`Unhandled error on ${c.req.method} ${c.req.path}:`, err)
  return c.json({ success: false, error: 'Something went wrong on our side' }, 500)
})

export { app }

export default {
  port: env.port,
  fetch: app.fetch,
}
