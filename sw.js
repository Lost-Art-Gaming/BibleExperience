const CACHE = 'bible-experience-premium-v8';
const ASSETS = [
  './', './index.html', './styles.css?v=8', './premium.css?v=8', './art.css?v=8', './app.js?v=8', './manifest.webmanifest', './assets/logo.svg',
  './assets/hero-origins.webp?v=8', './assets/map-exodus.webp?v=8', './assets/library-manuscript.webp?v=8',
  './assets/ep1-beginning.webp?v=8', './assets/ep2-eden.webp?v=8', './assets/ep3-serpent-seed.webp?v=8', './assets/ep4-east-eden.webp?v=8',
  './assets/ep5-adam-story.webp?v=8', './assets/ep6-noah.webp?v=8', './assets/ep7-deluge.webp?v=8', './assets/ep8-bow.webp?v=8',
  './assets/ep9-babel.webp?v=8', './assets/ep10-abraham.webp?v=8',
  './data/Genesis/index.json', './data/timeline.json',
  './data/Genesis/Episode1.json', './data/Genesis/Episode2.json', './data/Genesis/Episode3.json',
  './data/Genesis/Episode4.json', './data/Genesis/Episode5.json', './data/Genesis/Episode6.json',
  './data/Genesis/Episode7.json', './data/Genesis/Episode8.json', './data/Genesis/Episode9.json', './data/Genesis/Episode10.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => cached))
  );
});
