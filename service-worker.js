const CACHE_NAME = 'ew-cache-v2';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './dataset-loader.js',
  './dataset.json',
  './static/styles.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js@3.9.1',
  'https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@1.2.0/dist/chartjs-chart-matrix.min.js',
  'https://cdn.jsdelivr.net/npm/wordcloud@1.1.0/src/wordcloud2.js'
];

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
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
