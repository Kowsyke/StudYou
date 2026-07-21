const CACHE_NAME = 'studyou-cache-v1'
const ASSETS = ['/', '/index.html', '/favicon.svg', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS)
    }),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        }),
      )
    }),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  // Skip cross-origin or API calls so they load live
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api')) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(event.request)
        .then((response) => {
          // Cache static JS/CSS assets dynamically
          if (
            response.status === 200 &&
            (url.pathname.includes('/assets/') ||
              url.pathname.endsWith('.js') ||
              url.pathname.endsWith('.css'))
          ) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Fallback to index.html for client SPA routes offline
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html')
          }
        })
    }),
  )
})
