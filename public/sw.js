// Service Worker for Todo Trinity PWA
const CACHE_NAME = 'todo-trinity-v1'
const NETWORK_ONLY = 'network-only'
const CACHE_ONLY = 'cache-only'

// Resources to cache
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico',
  '/_next/static/css/',
  '/_next/static/js/',
  '/api/tasks',
  '/api/lists',
  '/api/labels',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            if (response) {
              return response
            }
            // Return a basic offline response for API calls
            return new Response(JSON.stringify({ error: 'Offline mode - data may be stale' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          })
        })
    )
    return
  }

  // Handle static assets with cache-first strategy
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response
        }
        return fetch(request)
      })
    )
    return
  }

  // Handle other requests
  event.respondWith(fetch(request))
})

// Background sync for failed operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncPendingTasks())
  }
})

async function syncPendingTasks() {
  const pendingTasks = await getAllPendingTasks()
  for (const task of pendingTasks) {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          status: task.status || 'todo',
          priority: task.priority || 'normal',
          dueDate: task.dueDate,
          offlineId: task.offlineId
        })
      })
      await markTaskSynced(task.offlineId)
    } catch (error) {
      console.error('Failed to sync task:', task.offlineId, error)
    }
  }
}

async function getAllPendingTasks() {
  // Get pending tasks from IndexedDB or localStorage
  const stored = localStorage.getItem('pending-tasks')
  return stored ? JSON.parse(stored) : []
}

async function markTaskSynced(offlineId) {
  const pending = await getAllPendingTasks()
  const updated = pending.filter(t => t.offlineId !== offlineId)
  localStorage.setItem('pending-tasks', JSON.stringify(updated))
}

// Push notifications handling
self.addEventListener('push', (event) => {
  const data = event.data.json()

  const options = {
    body: data.body || data.message,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge.png',
    tag: data.tag,
    data: {
      url: data.url || '/',
      type: data.type
    },
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Todo Trinity', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  const { notification } = event
  const { data } = notification

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Close the notification
      notification.close()

      // Focus existing window or open new one
      if (data && data.url) {
        return clients.openWindow(data.url)
      } else if (clientList.length > 0) {
        return clientList[0].focus()
      } else {
        return clients.openWindow('/')
      }
    })
  )
})

// Periodic background sync for reminders
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkReminders())
  }
})

async function checkReminders() {
  // Check for upcoming task deadlines and send reminders
  const now = new Date()
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

  // This would normally check against database
  // For now, just log that the sync ran
  console.log('Checking for reminders...')
}

// Cache-busting for version updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})