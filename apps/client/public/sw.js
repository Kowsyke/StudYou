// Cache name bump forces old caches to be dropped in `activate` below.
// Bump this string whenever the caching *strategy* changes; app code
// updates ship fine without a bump because navigation is network-first.
const CACHE_NAME = 'studyou-cache-v2'
const ASSETS = ['/', '/index.html', '/favicon.svg', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      // Activate this worker as soon as it finishes installing, instead of
      // waiting for every open tab to close first.
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  // Skip cross-origin or API calls so they load live
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api')) {
    return
  }

  // Navigation (the SPA shell) and index.html must always be network-first.
  // Vite gives every JS/CSS bundle a content hash in its filename, so
  // index.html is the only place a *new* deploy is discoverable; serving a
  // cached copy of it would keep pointing every phone at the old bundle
  // forever. Only fall back to the cached shell when there is no network.
  const isAppShell = event.request.mode === 'navigate' || url.pathname === '/index.html'
  if (isAppShell) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
          return response
        })
        .catch(() => caches.match('/index.html')),
    )
    return
  }

  // Hashed static assets are safe to serve cache-first: a new deploy ships
  // a new filename, so a stale cache entry simply goes unused rather than
  // masking the update.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(event.request).then((response) => {
        if (
          response.status === 200 &&
          (url.pathname.includes('/assets/') ||
            url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.css'))
        ) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
        }
        return response
      })
    }),
  )
})
