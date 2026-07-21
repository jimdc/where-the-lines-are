// CACHE_NAME is auto-derived by `python3 scripts/preprocess.py sw` (and by every
// other preprocess.py command) as a content hash of the URLS_TO_CACHE files below.
// Don't hand-edit it; tests/data/sw-cache.test.js fails if it goes stale.
const CACHE_NAME = 'ew-cache-437fc16a96cc';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './dataset-loader.js',
  './datasets/registry.json',
  './datasets/xref.json',
  './datasets/xref-fuzzy.json',
  './datasets/xref-semantic.json',
  './datasets/jigsaw.json',
  './datasets/openai.json',
  './datasets/airbench.json',
  './datasets/ailuminate.json',
  './datasets/harmbench.json',
  './datasets/jigsaw-coherence.json',
  './datasets/jigsaw-outliers.json',
  './datasets/openai-coherence.json',
  './datasets/openai-outliers.json',
  './datasets/beavertails-coherence.json',
  './datasets/beavertails-outliers.json',
  './datasets/saferlhf-coherence.json',
  './datasets/saferlhf-outliers.json',
  './datasets/aegis-coherence.json',
  './datasets/aegis-outliers.json',
  './datasets/airbench-coherence.json',
  './datasets/airbench-outliers.json',
  './datasets/ailuminate-coherence.json',
  './datasets/ailuminate-outliers.json',
  './datasets/harmbench-coherence.json',
  './datasets/harmbench-outliers.json',
  './static/styles.css',
  './static/vis.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Note: beavertails.json (~51MB), saferlhf.json (~26MB), and aegis.json (~14MB) are NOT pre-cached.
// They are cached on first access via the fetch handler's cache-on-fetch strategy.
// AIR-Bench (~5MB), AILuminate (~0.3MB), and HarmBench (~0.1MB) ARE pre-cached —
// they are the small, frontier-taxonomy datasets and benefit from offline-first parity.
// The per-dataset <id>-coherence.json / <id>-outliers.json clustering artifacts ARE
// pre-cached for every dataset, including beavertails/saferlhf/aegis: they are always
// bounded to tens of KB (a fixed per-concept table and a fixed top-200 row list)
// regardless of the source dataset's size.

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
