import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { app } from './index'

/*
  Azure App Service entry: Node runtime serving the API and the built
  client from one process. The client bundle is copied to ./client-dist
  by the azure build script. Any non API route falls back to index.html
  so the SPA router owns the path.
*/
const clientDir = join(process.cwd(), 'client-dist')

app.use('/assets/*', serveStatic({ root: './client-dist' }))
app.use('/favicon.svg', serveStatic({ root: './client-dist' }))

let indexHtml = ''
try {
  indexHtml = readFileSync(join(clientDir, 'index.html'), 'utf8')
} catch {
  console.error('client-dist/index.html missing, API only mode')
}

app.get('*', (c) => {
  if (c.req.path.startsWith('/api/') || !indexHtml) {
    return c.json({ success: false, error: 'Not found' }, 404)
  }
  return c.html(indexHtml)
})

const port = Number(process.env.PORT) || 8080
serve({ fetch: app.fetch, port }, () => {
  console.log(`StudYou server listening on ${port}`)
})
