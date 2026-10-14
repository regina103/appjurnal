/* =====================================================================
   auth-ui.js — Tampilan gerbang login / daftar.

   - Menampilkan layar login/daftar bila user belum masuk.
   - Menyembunyikan aplikasi utama sampai user terautentikasi.
   - Menyediakan tombol keluar (logout) di header.

   Bergantung pada: Auth (auth.js), window.SB (supabase-client.js).
   ===================================================================== */

const AuthUI = (() => {
  const gate = document.getElementById('authGate');
  const app = document.getElementById('app');

  let mode = 'masuk'; // 'masuk' | 'daftar'

  function tampilBanner(pesan, tipe) {
    const el = document.getElementById('authPesan');
    if (!el) return;
    el.textContent = pesan || '';
    el.className = 'auth-pesan' + (tipe ? ' ' + tipe : '');
    el.hidden = !pesan;
  }

  function render() {
    const judul = mode === 'masuk' ? 'Masuk' : 'Daftar Akun';
    const sub =
      mode === 'masuk'
        ? 'Masuk untuk mengelola keuangan kamu.'
        : 'Buat akun baru dengan email & password.';
    const tombol = mode === 'masuk' ? 'Masuk' : 'Daftar';
    const alt =
      mode === 'masuk'
        ? 'Belum punya akun? <a href="#" id="toDaftar">Daftar</a>'
        : 'Sudah punya akun? <a href="#" id="toMasuk">Masuk</a>';

    gate.innerHTML = `
      <div class="auth-box">
        <div class="auth-logo">💰</div>
        <div class="auth-brand">I'MNote</div>
        <h1 class="auth-judul">${judul}</h1>
        <p class="auth-sub">${sub}</p>

        <div class="auth-pesan" id="authPesan" hidden></div>

        <form id="authForm" novalidate>
          ${
            mode === 'daftar'
              ? `<label class="field"><span>Nama</span>
                   <input type="text" id="authNama" autocomplete="name"
                          placeholder="Nama kamu" maxlength="60" required />
                 </label>`
              : ''
          }

          <label class="field"><span>Email</span>
            <input type="email" id="authEmail" autocomplete="email"
                   inputmode="email" placeholder="nama@email.com" required />
          </label>

          <label class="field"><span>Password</span>
            <input type="password" id="authPassword" autocomplete="${
              mode === 'masuk' ? 'current-password' : 'new-password'
            }" placeholder="minimal 6 karakter" required />
          </label>

          <button class="btn" id="authSubmit" type="submit">${tombol}</button>
        </form>

        <p class="auth-alt">${alt}</p>
      </div>
    `;

    pasangEvent();
    setTimeout(() => {
      const f = document.getElementById('authEmail');
      if (f) f.focus();
    }, 120);
  }

  function pasangEvent() {
    const form = document.getElementById('authForm');
    const toDaftar = document.getElementById('toDaftar');
    const toMasuk = document.getElementById('toMasuk');

    if (toDaftar)
      toDaftar.addEventListener('click', (e) => {
        e.preventDefault();
        mode = 'daftar';
        render();
      });
    if (toMasuk)
      toMasuk.addEventListener('click', (e) => {
        e.preventDefault();
        mode = 'masuk';
        render();
      });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value;
      const password = document.getElementById('authPassword').value;
      const namaEl = document.getElementById('authNama');
      const nama = namaEl ? namaEl.value : '';
      const btn = document.getElementById('authSubmit');

      if (mode === 'daftar' && !nama.trim()) {
        tampilBanner('Isi nama kamu dulu ya.', 'error');
        return;
      }

      btn.disabled = true;
      const labelAsli = btn.textContent;
      btn.textContent = 'Memproses...';
      tampilBanner('', '');

      const hasil =
        mode === 'masuk'
          ? await Auth.masuk(email, password)
          : await Auth.daftar(email, password, nama);

      // Elemen bisa sudah lepas dari DOM bila gate ditutup saat login sukses.
      if (btn.isConnected) {
        btn.disabled = false;
        btn.textContent = labelAsli;
      }

      if (!hasil.ok) {
        tampilBanner(hasil.pesan, 'error');
        return;
      }

      if (mode === 'daftar' && hasil.perluVerifikasi) {
        // Pendaftaran butuh verifikasi email: arahkan user untuk masuk nanti.
        mode = 'masuk';
        render();
        tampilBanner(hasil.pesan, 'sukses');
        return;
      }
      // Bila berhasil & ada sesi, onAuthStateChange akan menutup gate otomatis.
    });
  }

  function tampilkanGate() {
    if (app) app.hidden = true;
    gate.hidden = false;
    render();
  }

  function sembunyikanGate() {
    gate.hidden = true;
    if (app) app.hidden = false;
  }

  // Pasang tombol keluar bila ada
  function pasangTombolKeluar() {
    const btn = document.getElementById('logoutBtn');
    if (btn) {
      btn.addEventListener('click', async () => {
        await Auth.keluar();
        // onAuthStateChange akan menampilkan gate kembali.
      });
    }
  }

  return { tampilkanGate, sembunyikanGate, pasangTombolKeluar };
})();
