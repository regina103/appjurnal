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
    // Tampilkan gate dulu sebagai keadaan awal agar tidak ada layar kosong
    // sebelum status login diketahui.
    AuthUI.tampilkanGate();

    // onAuthStateChange adalah SATU-SATUNYA pengatur gate. Di Supabase v2,
    // callback ini otomatis dipanggil sekali saat dipasang (INITIAL_SESSION),
    // jadi tidak perlu cek sesi terpisah (menghindari race condition).
    let sudahPernahLogin = false;
    Auth.pantauPerubahan((user) => {
      const logoutBtn = document.getElementById('logoutBtn');
      if (user) {
        AuthUI.sembunyikanGate();
        if (logoutBtn) logoutBtn.hidden = false;
        // Segarkan tampilan setelah masuk agar data terbaru tampil.
        UI.render(UI.currentPage);
        sudahPernahLogin = true;
      } else {
        if (logoutBtn) logoutBtn.hidden = true;
        // Bersihkan cache profil agar user berikutnya tidak melihat data lama.
        UI.resetProfilCache();
        // Hanya saat benar-benar logout (bukan keadaan awal), kembali ke beranda.
        if (sudahPernahLogin) {
          UI.navigate('beranda');
        }
        AuthUI.tampilkanGate();
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
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#2a241f');
      btn.textContent = '☀️';
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#c67e92');
      btn.textContent = '🌙';
    }
  }
})();
