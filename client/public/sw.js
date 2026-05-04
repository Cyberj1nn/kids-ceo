const CACHE_NAME = 'kids-ceo-v4';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
];

// Install — кешируем статические ресурсы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — удаляем старые кеши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Не кешируем API-запросы и WebSocket
  if (request.url.includes('/api/') || request.url.includes('/socket.io/')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Кешируем успешные GET-запросы к статике
        if (request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  );
});

// Push — показываем нотификацию по приходу payload от сервера
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Уведомление', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Kids CEO';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: { link: data.link || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Клик по нотификации — фокус существующего окна PWA или открытие нового
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Пытаемся сфокусировать уже открытое окно того же origin
      for (const client of allClients) {
        try {
          const url = new URL(client.url);
          if (url.origin === self.location.origin && 'focus' in client) {
            await client.focus();
            // Перейдём по ссылке внутри SPA
            client.postMessage({ type: 'navigate', link });
            return;
          }
        } catch {
          // ignore
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(link);
      }
    })()
  );
});

// Перевыпуск подписки (срок жизни истёк, ключ ротировался и т.п.)
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      // Просим открытых клиентов переподписаться (они отправят новую подписку с авторизацией)
      for (const client of allClients) {
        client.postMessage({ type: 'push:resubscribe' });
      }
    })()
  );
});
