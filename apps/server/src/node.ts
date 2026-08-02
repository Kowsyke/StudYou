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

// Serve any real file in the built client from its root: the hashed assets
// under /assets, but also the files Vite copies from public to the root,
// namely sw.js, manifest.json, the PWA icons and favicon. serveStatic passes
// through to the next handler when the requested file does not exist, so SPA
// routes fall through to the index.html handler below. Without this, requests
// like /sw.js or /manifest.json would hit the SPA fallback and receive HTML,
// silently breaking the service worker and the install manifest in production.
app.use('*', serveStatic({ root: './client-dist' }))

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
