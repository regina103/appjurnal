/* =====================================================================
   auth.js — Autentikasi user (email + password) via Supabase Auth.

   Mengekspos window.Auth dengan fungsi:
   - daftar(email, password)   -> { ok, pesan, perluVerifikasi }
   - masuk(email, password)    -> { ok, pesan }
   - keluar()                  -> { ok }
   - userSekarang()            -> Promise<user|null>
   - pantauPerubahan(cb)       -> dipanggil tiap status login berubah
   - tersedia()                -> true bila Supabase terkonfigurasi

   Catatan keamanan:
   - Hanya memakai anon key (dari supabase-client.js).
   - Supabase Auth menangani hashing password & token di sisi server.
     Password TIDAK pernah disimpan di aplikasi ini.
   ===================================================================== */

const Auth = (() => {
  function sb() {
    return window.SB && window.SB.client ? window.SB.client : null;
  }

  function tersedia() {
    return !!sb();
  }

  // Terjemahkan pesan error teknis Supabase menjadi bahasa yang ramah.
  function terjemahkanError(err) {
    const m = (err && err.message ? err.message : String(err || '')).toLowerCase();
    if (m.includes('invalid login credentials')) return 'Email atau password salah.';
    if (m.includes('user already registered') || m.includes('already registered'))
      return 'Email ini sudah terdaftar. Silakan masuk.';
    if (m.includes('password should be at least'))
      return 'Password minimal 6 karakter.';
    if (m.includes('unable to validate email') || m.includes('invalid email'))
      return 'Format email tidak valid.';
    if (m.includes('email not confirmed'))
      return 'Email belum diverifikasi. Cek kotak masuk email Anda.';
    if (m.includes('rate limit') || m.includes('too many'))
      return 'Terlalu banyak percobaan. Coba lagi beberapa saat.';
    if (m.includes('failed to fetch') || m.includes('networkerror'))
      return 'Gagal terhubung ke server. Periksa koneksi internet.';
    return err && err.message ? err.message : 'Terjadi kesalahan. Coba lagi.';
  }

  function validasiInput(email, password) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return 'Masukkan email yang valid.';
    if (!password || password.length < 6)
      return 'Password minimal 6 karakter.';
    return null;
  }

  async function daftar(email, password) {
    if (!tersedia())
      return { ok: false, pesan: 'Backend belum dikonfigurasi.' };
    const salah = validasiInput(email, password);
    if (salah) return { ok: false, pesan: salah };

    try {
      const { data, error } = await sb().auth.signUp({
        email: email.trim(),
        password
      });
      if (error) return { ok: false, pesan: terjemahkanError(error) };

      // Bila konfirmasi email diaktifkan, session belum ada sampai user verifikasi.
      const perluVerifikasi = !data.session;
      return {
        ok: true,
        perluVerifikasi,
        pesan: perluVerifikasi
          ? 'Pendaftaran berhasil. Cek email Anda untuk verifikasi, lalu masuk.'
          : 'Pendaftaran berhasil.'
      };
    } catch (e) {
      return { ok: false, pesan: terjemahkanError(e) };
    }
  }

  async function masuk(email, password) {
    if (!tersedia())
      return { ok: false, pesan: 'Backend belum dikonfigurasi.' };
    const salah = validasiInput(email, password);
    if (salah) return { ok: false, pesan: salah };

    try {
      const { error } = await sb().auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) return { ok: false, pesan: terjemahkanError(error) };
      return { ok: true, pesan: 'Berhasil masuk.' };
    } catch (e) {
      return { ok: false, pesan: terjemahkanError(e) };
    }
  }

  async function keluar() {
    if (!tersedia()) return { ok: true };
    try {
      await sb().auth.signOut();
      return { ok: true };
    } catch (e) {
      return { ok: false, pesan: terjemahkanError(e) };
    }
  }

  async function userSekarang() {
    if (!tersedia()) return null;
    try {
      const { data } = await sb().auth.getUser();
      return data ? data.user : null;
    } catch (e) {
      return null;
    }
  }

  async function sesiSekarang() {
    if (!tersedia()) return null;
    try {
      const { data } = await sb().auth.getSession();
      return data ? data.session : null;
    } catch (e) {
      return null;
    }
  }

  function pantauPerubahan(cb) {
    if (!tersedia()) return;
    sb().auth.onAuthStateChange((_event, session) => {
      cb(session ? session.user : null, _event);
    });
  }

  return {
    tersedia,
    daftar,
    masuk,
    keluar,
    userSekarang,
    sesiSekarang,
    pantauPerubahan
  };
})();
