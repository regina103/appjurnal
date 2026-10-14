/* =====================================================================
   supabase-client.js — Inisialisasi koneksi ke Supabase.

   Membaca konfigurasi dari window.PUBLIC_CONFIG (public_config.js).
   Hanya memakai URL + ANON key (keduanya publik & aman di browser
   selama Row Level Security aktif di database).

   Mengekspos:
   - window.SB.client  : instance supabase client (atau null bila belum dikonfigurasi)
   - window.SB.siap()  : true bila konfigurasi valid
   ===================================================================== */

window.SB = (() => {
  const cfg = window.PUBLIC_CONFIG || {};
  const url = (cfg.SUPABASE_URL || '').trim();
  const anon = (cfg.SUPABASE_ANON_KEY || '').trim();

  // Validasi dasar: pastikan nilai sudah diisi dan bukan placeholder.
  const terisi =
    url &&
    anon &&
    !url.includes('ISI_DENGAN') &&
    !anon.includes('ISI_DENGAN') &&
    /^https:\/\/.+\.supabase\.co/.test(url);

  let client = null;

  if (terisi) {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.error(
        '[Supabase] SDK belum termuat. Pastikan tag <script> supabase-js dimuat sebelum file ini.'
      );
    } else {
      client = window.supabase.createClient(url, anon, {
        auth: {
          persistSession: true,       // simpan sesi login di localStorage
          autoRefreshToken: true,     // perbarui token otomatis
          detectSessionInUrl: true    // tangani link konfirmasi email
        }
      });
    }
  } else {
    console.warn(
      '[Supabase] Konfigurasi belum lengkap. Isi SUPABASE_URL & SUPABASE_ANON_KEY di public_config.js'
    );
  }

  function siap() {
    return !!client;
  }

  return { client, siap };
})();
