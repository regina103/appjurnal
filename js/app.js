/* =====================================================================
   app.js — Inisialisasi aplikasi + gerbang autentikasi Supabase.
   ===================================================================== */

(function init() {
  // 1) Siapkan data bawaan (localStorage) & tema
  DB.seed();
  const tema = DB.getSettings().tema || 'terang';
  applyTheme(tema);

  // 2) Navigasi bawah
  document.getElementById('bottomNav').addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (btn) UI.navigate(btn.dataset.page);
  });

  // 3) Tombol tambah (FAB)
  document.getElementById('fabAdd').addEventListener('click', () => UI.formTransaksi());

  // 4) Toggle tema
  document.getElementById('themeToggle').addEventListener('click', () => {
    const next = (DB.getSettings().tema === 'gelap') ? 'terang' : 'gelap';
    DB.setSettings({ tema: next });
    applyTheme(next);
  });

  // 5) Render halaman awal (konten di belakang gate)
  UI.navigate('beranda');

  // 6) Tombol keluar (logout) di header
  AuthUI.pasangTombolKeluar();

  // 7) Gerbang autentikasi
  if (!Auth.tersedia()) {
    // Supabase belum dikonfigurasi: tampilkan gate dengan pesan agar user tahu.
    AuthUI.tampilkanGate();
    const banner = document.getElementById('authPesan');
    if (banner) {
      banner.textContent =
        'Backend belum dikonfigurasi. Isi public_config.js dengan SUPABASE_URL & SUPABASE_ANON_KEY.';
      banner.className = 'auth-pesan error';
      banner.hidden = false;
    }
  } else {
    // Tentukan tampilan awal berdasarkan sesi tersimpan.
    Auth.sesiSekarang().then((sesi) => {
      if (sesi) {
        AuthUI.sembunyikanGate();
      } else {
        AuthUI.tampilkanGate();
      }
    });

    // Pantau perubahan status login secara real-time.
    Auth.pantauPerubahan((user) => {
      const logoutBtn = document.getElementById('logoutBtn');
      if (user) {
        AuthUI.sembunyikanGate();
        if (logoutBtn) logoutBtn.hidden = false;
      } else {
        AuthUI.tampilkanGate();
        if (logoutBtn) logoutBtn.hidden = true;
      }
    });
  }

  // 8) Service worker (PWA / offline)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
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
