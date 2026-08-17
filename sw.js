const CACHE_NAME = 'gridmap-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/grid10.html',
  '/logic_grid10.js',
  '/wordlist.json'
];

// Při instalaci aplikace se soubory uloží do paměti telefonu
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Při každém spuštění se aplikace pokusí načíst data z paměti
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Pokud je soubor v paměti, vrať ho, jinak ho stáhni z internetu
        return response || fetch(event.request);
      })
  );
});