const CACHE = 'chorechart-v1'
const STATIC = ['/', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('supabase') || e.request.url.includes('anthropic') || e.request.url.includes('stripe')) return

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok && e.request.url.startsWith(self.location.origin)) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()))
        }
        return res
      })
      return cached ?? network
    })
  )
})

self.addEventListener('push', e => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'ChoreChart', {
      body: data.body ?? '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.url ?? '/',
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data))
})
