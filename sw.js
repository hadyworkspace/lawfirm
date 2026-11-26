const CACHE = 'lawfirm-v3';
const ASSETS = ['./index.html','./styles.css','./core.js','./home.js','./companies.js','./cases.js','./agenda-accounts.js','./manifest.webmanifest','./logo.png',
  './fonts/tajawal-400.woff2','./fonts/tajawal-500.woff2','./fonts/tajawal-700.woff2','./fonts/tajawal-800.woff2',
  './fonts/ruqaa-400.woff2','./fonts/ruqaa-700.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k!==CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
  }).catch(() => caches.match('./index.html'))));
});
