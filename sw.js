const CACHE = 'bible-experience-production-v15';
const ASSETS = [
  './', './index.html', './styles.css?v=15', './production.css?v=15', './app.js?v=15', './manifest.webmanifest', './assets/logo.svg',
  './assets/hero-origins-generated.webp?v=15', './assets/hero-origins-production.webp?v=15', './assets/map-exodus.webp?v=15', './assets/library-manuscript.webp?v=15',
  './assets/ep1-beginning.webp?v=15', './assets/ep2-eden.webp?v=15', './assets/ep3-serpent-seed.webp?v=15', './assets/ep4-east-eden.webp?v=15',
  './assets/ep5-adam-story.webp?v=15', './assets/ep6-noah.webp?v=15', './assets/ep7-deluge.webp?v=15', './assets/ep8-bow.webp?v=15',
  './assets/ep9-babel.webp?v=15', './assets/ep10-abraham.webp?v=15',
  './data/Genesis/index.json', './data/timeline.json',
  './data/Genesis/Episode1.json', './data/Genesis/Episode2.json', './data/Genesis/Episode3.json',
  './data/Genesis/Episode4.json', './data/Genesis/Episode5.json', './data/Genesis/Episode6.json',
  './data/Genesis/Episode7.json', './data/Genesis/Episode8.json', './data/Genesis/Episode9.json', './data/Genesis/Episode10.json'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const isNavigation = event.request.mode === 'navigate';
  event.respondWith((isNavigation ? fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put('./index.html', copy));
    return response;
  }).catch(() => caches.match('./index.html')) : caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  })).catch(() => caches.match(event.request))));
});
