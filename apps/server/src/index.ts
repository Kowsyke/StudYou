import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './lib/env'
import { adminRoutes, authRoutes, journeyRoutes, metaRoutes, resourceRoutes } from './routes'
import type { AppEnv } from './types'

const app = new Hono<AppEnv>()

app.use('*', logger())
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
api.route('/admin', adminRoutes)
api.route('/meta', metaRoutes)

app.route('/api/v1', api)

app.notFound((c) => c.json({ success: false, error: 'Not found' }, 404))

app.onError((err, c) => {
  console.error(err)
  return c.json({ success: false, error: 'Internal server error' }, 500)
})

export default {
  port: env.port,
  fetch: app.fetch,
}
