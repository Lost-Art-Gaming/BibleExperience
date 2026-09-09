const CACHE = 'bible-experience-production-v21';
const ASSETS = [
  './', './index.html', './styles.css?v=21', './production.css?v=21', './app.js?v=21', './manifest.webmanifest', './assets/logo.svg',
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
