/* =====================================================================
   app.js — Inisialisasi aplikasi.
   ===================================================================== */

(function init() {
  // 1) Siapkan data bawaan
  DB.seed();

  // 2) Terapkan tema tersimpan
  const tema = DB.getSettings().tema || 'terang';
  applyTheme(tema);

  // 3) Navigasi bawah
  document.getElementById('bottomNav').addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (btn) UI.navigate(btn.dataset.page);
  });

  // 4) Tombol tambah (FAB)
  document.getElementById('fabAdd').addEventListener('click', () => UI.formTransaksi());

  // 5) Toggle tema
  document.getElementById('themeToggle').addEventListener('click', () => {
    const next = (DB.getSettings().tema === 'gelap') ? 'terang' : 'gelap';
    DB.setSettings({ tema: next });
    applyTheme(next);
  });

  // 6) Render halaman awal
  UI.navigate('beranda');

  // 7) Daftarkan service worker (PWA / offline) — hanya jika didukung
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {
        /* diabaikan: tetap jalan tanpa offline */
      });
    });
  }

  function applyTheme(mode) {
    const btn = document.getElementById('themeToggle');
    if (mode === 'gelap') {
      document.documentElement.setAttribute('data-theme', 'gelap');
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#0f1715');
      btn.textContent = '☀️';
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#0e7c66');
      btn.textContent = '🌙';
    }
  }
})();
