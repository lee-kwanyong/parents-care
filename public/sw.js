self.addEventListener('install', function installServiceWorker(event) {
  self.skipWaiting()
})

self.addEventListener('activate', function activateServiceWorker(event) {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', function notificationClick(event) {
  event.notification.close()

  const targetUrl =
    event.notification && event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : '/child/daily-care'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
