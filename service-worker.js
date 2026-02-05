const CACHE_NAME = 'ew-cache-v5';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './dataset-loader.js',
  './datasets/registry.json',
  './datasets/jigsaw.json',
  './datasets/openai.json',
  './static/styles.css',
  './static/vis.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Note: beavertails.json (~51MB), saferlhf.json, and aegis.json (~13MB) are NOT pre-cached.
// They are cached on first access via the fetch handler's cache-on-fetch strategy.

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      const requests = URLS_TO_CACHE.map(u => new Request(u));
      return cache.addAll(requests);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(resp => {
      if (resp) return resp;
      return fetch(event.request).then(function(networkResp) {
        // Cache dataset files on first load
        if (networkResp.ok && event.request.url.includes('/datasets/')) {
          var respClone = networkResp.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, respClone);
          });
        }
        return networkResp;
      });
    })
  );
});
