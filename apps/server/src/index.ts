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
  resourceRoutes,
  universityRoutes,
} from './routes'
import type { AppEnv } from './types'

const app = new Hono<AppEnv>()

app.use('*', logger())
app.use('*', secureHeaders())
app.use(
  '*',
  cors({
    origin: env.clientUrl,
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

export default {
  port: env.port,
  fetch: app.fetch,
}
