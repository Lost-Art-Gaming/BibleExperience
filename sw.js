const CACHE = 'bible-experience-premium-v4';
const ASSETS = [
  './', './index.html', './styles.css', './premium.css', './app.js', './manifest.webmanifest', './assets/logo.svg',
  './assets/hero-origins.svg', './assets/map-exodus.svg', './assets/library-manuscript.svg',
  './assets/ep1-beginning.svg', './assets/ep2-eden.svg', './assets/ep3-serpent-seed.svg', './assets/ep4-east-eden.svg',
  './assets/ep5-adam-story.svg', './assets/ep6-noah.svg', './assets/ep7-deluge.svg', './assets/ep8-bow.svg',
  './assets/ep9-babel.svg', './assets/ep10-abraham.svg',
  './data/Genesis/index.json', './data/timeline.json',
  './data/Genesis/Episode1.json', './data/Genesis/Episode2.json', './data/Genesis/Episode3.json',
  './data/Genesis/Episode4.json', './data/Genesis/Episode5.json', './data/Genesis/Episode6.json',
  './data/Genesis/Episode7.json', './data/Genesis/Episode8.json', './data/Genesis/Episode9.json',
  './data/Genesis/Episode10.json'
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
