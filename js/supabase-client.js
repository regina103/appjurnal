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
  const configTerisi =
    url &&
    anon &&
    !url.includes('ISI_DENGAN') &&
    !anon.includes('ISI_DENGAN') &&
    /^https:\/\/.+\.supabase\.co/.test(url);

  const sdkAda =
    typeof window.supabase !== 'undefined' && !!window.supabase.createClient;

  let client = null;
  let alasan = ''; // '' = ok, 'config' = config kosong, 'sdk' = SDK gagal dimuat

  if (!configTerisi) {
    alasan = 'config';
    console.warn(
      '[Supabase] Konfigurasi belum lengkap. public_config.js belum berisi SUPABASE_URL & SUPABASE_ANON_KEY.'
    );
  } else if (!sdkAda) {
    alasan = 'sdk';
    console.error(
      '[Supabase] SDK gagal dimuat dari CDN (kemungkinan koneksi internet). Coba muat ulang halaman.'
    );
  } else {
    try {
      client = window.supabase.createClient(url, anon, {
        auth: {
          persistSession: true,       // simpan sesi login di localStorage
          autoRefreshToken: true,     // perbarui token otomatis
          detectSessionInUrl: true    // tangani link konfirmasi email
        }
      });
    } catch (e) {
      alasan = 'sdk';
      console.error('[Supabase] Gagal membuat client:', e);
    }
  }

  function siap() {
    return !!client;
  }

  return { client, siap, alasan, sdkAda, configTerisi };
})();
