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
    // Backend belum siap. Bedakan penyebabnya agar mudah diperbaiki.
    AuthUI.tampilkanGate();

    const alasan = window.SB ? window.SB.alasan : 'config';

    if (alasan === 'sdk') {
      // SDK Supabase gagal dimuat dari CDN (sering terjadi di koneksi HP yang
      // lambat/putus). Coba muat ulang SDK beberapa kali, lalu bangun ulang.
      tampilkanPesanGate(
        'Menyambungkan ke server... pastikan internet aktif.',
        'error'
      );
      cobaMuatUlangSDK(0);
    } else {
      tampilkanPesanGate(
        'Konfigurasi backend belum tersedia pada versi ini. Hubungi admin aplikasi.',
        'error'
      );
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

  // Tampilkan pesan pada banner di gerbang login (menunggu DOM gate siap).
  function tampilkanPesanGate(pesan, tipe) {
    const set = () => {
      const banner = document.getElementById('authPesan');
      if (banner) {
        banner.textContent = pesan;
        banner.className = 'auth-pesan ' + (tipe || '');
        banner.hidden = false;
        return true;
      }
      return false;
    };
    if (!set()) setTimeout(set, 150);
  }

  // Jika SDK Supabase gagal dimuat (umum di koneksi HP), muat ulang dari CDN
  // dan bangun ulang client. Dicoba beberapa kali dengan jeda bertambah.
  function cobaMuatUlangSDK(percobaan) {
    const MAKS = 4;
    if (percobaan >= MAKS) {
      tampilkanPesanGate(
        'Gagal menyambung ke server. Periksa koneksi internet lalu muat ulang halaman.',
        'error'
      );
      return;
    }

    // Bila SDK ternyata sudah ada (mis. baru selesai dimuat), langsung bangun.
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      return bangunUlangDanLanjut();
    }

    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = bangunUlangDanLanjut;
    s.onerror = () => setTimeout(() => cobaMuatUlangSDK(percobaan + 1), 1200 * (percobaan + 1));
    document.head.appendChild(s);
  }

  // Bangun ulang client Supabase memakai config yang sudah ada, lalu aktifkan
  // alur autentikasi normal.
  function bangunUlangDanLanjut() {
    const cfg = window.PUBLIC_CONFIG || {};
    const url = (cfg.SUPABASE_URL || '').trim();
    const anon = (cfg.SUPABASE_ANON_KEY || '').trim();
    if (!url || !anon || typeof window.supabase === 'undefined') return;

    try {
      window.SB.client = window.supabase.createClient(url, anon, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    } catch (e) {
      return;
    }
    if (!window.SB.client) return;

    tampilkanPesanGate('', '');
    AuthUI.pasangTombolKeluar();

    Auth.pantauPerubahan((user) => {
      const logoutBtn = document.getElementById('logoutBtn');
      if (user) {
        AuthUI.sembunyikanGate();
        if (logoutBtn) logoutBtn.hidden = false;
        UI.render(UI.currentPage);
      } else {
        if (logoutBtn) logoutBtn.hidden = true;
        UI.resetProfilCache();
        AuthUI.tampilkanGate();
      }
    });
  }
})();
