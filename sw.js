const CACHE_NAME = 'gridmap-cache-v6'; // Posunuto na v6

// POZOR: Používáme relativní cesty (s tečkou na začátku)!
// Zároveň jsme smazali starý wordlist.json a dali sem nové slovníky
const urlsToCache = [
  './',
  './index.html',
  './grid39.html',
  './js/logic_grid39.js?v=1.5',
  './bip39/bip39_en.js?v=1.5',
  './bip39/bip39_cs.js?v=1.5',
  './assets/favicon.ico',
  './assets/icon-192.png'
];

// 1. Instalace - uložení do paměti
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Vynutí okamžitou aktualizaci u uživatelů
});

// 2. MAGICKÝ KROK: Při aktivaci nové verze SMAŽE starou cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Ihned převezme kontrolu
});

// 3. Načítání z paměti nebo z internetu
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});