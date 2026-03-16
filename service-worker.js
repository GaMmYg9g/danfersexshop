const CACHE_NAME = 'danfer-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/productos.js',
  '/manifest.json',
  '/img/logo.png',
  '/img/icon-192.png',
  '/img/icon-512.png',
  '/img/default-product.jpg'
];

// Instalación: guardar archivos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cacheando recursos estáticos');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // Activar inmediatamente
});

// Activación: limpiar cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Tomar control de todas las pestañas
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // 1. Imágenes de productos (ruta /imagen/) → cache-first
  if (requestUrl.pathname.startsWith('/imagen/')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then(networkResponse => {
          // Guardar en caché para futuras visitas
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        }).catch(() => {
          // Si falla la red, mostrar imagen por defecto
          return caches.match('/img/default-product.jpg');
        });
      })
    );
    return;
  }

  // 2. Otros recursos (HTML, CSS, JS, etc.) → cache-first
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
        // Guardar en caché solo respuestas válidas (no de APIs)
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Para navegación sin conexión, mostrar la página principal
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
