const CACHE = 'lawfirm-v13';
const ASSETS = ['./index.html','./styles.css','./firebase-config.js','./sync.js','./core.js','./auth.js','./home.js','./companies.js','./cases.js','./agenda-accounts.js','./calendar.js','./manifest.webmanifest','./logo.png',
  './fonts/tajawal-400.woff2','./fonts/tajawal-500.woff2','./fonts/tajawal-700.woff2','./fonts/tajawal-800.woff2',
  './fonts/ruqaa-400.woff2','./fonts/ruqaa-700.woff2'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache:'reload'})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k!==CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  /* الطلبات الخارجية (Firebase وغيرها) تذهب للشبكة مباشرة دون اعتراض */
  if(new URL(e.request.url).origin !== self.location.origin) return;
  if(e.request.method !== 'GET') return;
  /* الصفحات: الشبكة أولاً حتى تصل التحديثات فوراً، مع الرجوع للكاش دون اتصال */
  if(e.request.mode === 'navigate'){
    e.respondWith(fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  /* الأصول: الكاش أولاً مع تحديث من الشبكة عند توفره */
  e.respondWith(caches.match(e.request, {ignoreSearch:true}).then(hit => hit || fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
  }).catch(() => caches.match('./index.html'))));
});
