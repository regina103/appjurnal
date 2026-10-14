// Service Worker sederhana: cache aset agar aplikasi bisa dibuka offline.
const CACHE = 'imnote-v10';
const ASSETS = [
  'index.html',
  'manifest.json',
  'css/style.css',
  'js/supabase-client.js',
  'js/auth.js',
  'js/profil.js',
  'js/auth-ui.js',
  'js/db.js',
  'js/tabungan.js',
  'js/pencapaian.js',
  'js/laporan.js',
  'js/ui.js',
  'js/app.js',
  'icons/icon.svg'
];

// Jangan cache file ini (selalu ambil versi terbaru dari jaringan):
// - public_config.js : agar perubahan konfigurasi langsung terbaca.
// - SDK Supabase dari CDN : biar tidak menyimpan skrip pihak ketiga.
const JANGAN_CACHE = ['public_config.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Hanya tangani permintaan same-origin. Request ke CDN Supabase & API
  // Supabase (lintas origin) dibiarkan langsung ke jaringan, tidak di-cache.
  if (url.origin !== self.location.origin) return;

  // public_config.js: selalu ambil dari jaringan agar konfigurasi selalu baru.
  if (JANGAN_CACHE.some((p) => url.pathname.endsWith(p))) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      return (
        cached ||
        fetch(e.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
            return res;
          })
          .catch(() => cached)
      );
    })
  );
});
