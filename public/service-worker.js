//REF: https://codelabs.developers.google.com/codelabs/your-first-pwapp/#4

// CODELAB: Update cache names any time any of the cached files change.
const CACHE_NAME = 'static-cache-v1';

// CODELAB: Add list of files to cache here.
const FILES_TO_CACHE = [
	"/offline.html",
    "/images/leaderboard.png",
    "/images/stats.png",
    "/images/settings.png",
    "/images/vision_on.png",
    "/images/vision_off.png",
    "/images/target.png",
    "/images/history.png",
    "/images/send.png",
    "/images/clock.png",
    "/js/jquery-3.1.1.min.js",
];

self.addEventListener('install', (evt) => {
    console.log('[ServiceWorker] Install');
    // CODELAB: Precache static resources here.
    evt.waitUntil(caches.open(CACHE_NAME).then((cache) => {
        console.log('[ServiceWorker] Pre-caching files for faster load');
        return cache.addAll(FILES_TO_CACHE);
    }));

    self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
    console.log('[ServiceWorker] Activate');
    // CODELAB: Remove previous cached data from disk.
    evt.waitUntil(caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('[ServiceWorker] Removing old cache', key);
              return caches.delete(key);
            }
        }));
    }));   

    self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
    // console.log('[ServiceWorker] Fetch', evt.request.url);
    // CODELAB: Add fetch event handler here.
    if (evt.request.mode !== 'navigate') {
        // Not a page navigation, bail.
        return;
    }
    evt.respondWith(
        fetch(evt.request)
            .catch(() => {
                return caches.open(CACHE_NAME)
                    .then((cache) => {
                        return cache.match('offline.html');
                    });
            })
    );
});