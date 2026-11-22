// Service worker: menyimpan seluruh aplikasi di perangkat supaya bisa dibuka tanpa internet.
// Naikkan angka versi di bawah setiap kali file aplikasi diubah, supaya iPhone mengambil yang baru.
// Angkanya harus sama dengan APP_VERSION di index.html. Halaman juga membaca angka ini untuk tahu versi terbaru di server.
const VERSION = '2.4';
const CACHE = 'invoice-' + VERSION;
const ASSETS = [
  './',
  'index.html',
  'defaults.js',
  'manifest.webmanifest',
  'vendor/html2canvas.min.js',
  'vendor/jspdf.umd.min.js',
  'fonts/lexend-latin.woff2',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  // cache:'reload' memastikan yang disimpan adalah file terbaru dari server, bukan salinan lama di browser.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Tampilkan dari penyimpanan dulu (cepat, bisa offline), lalu perbarui diam-diam di belakang.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.searchParams.has('nocache')) return;   // permintaan cek versi/koneksi: selalu langsung ke jaringan
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached || caches.match('index.html'));
      return cached || network;
    })
  );
});
