const CACHE_NAME = 'mb-expense-cache-v3';
const ASSETS = [
  '/', '/index.html', '/styles.css', '/app.js',
  '/assets/owner.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // HTML: network-first
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // Others: cache-first
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
      return res;
    }))
  );
});
