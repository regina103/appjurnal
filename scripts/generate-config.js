/* =====================================================================
   generate-config.js — Membuat public_config.js saat build (mis. di Vercel)
   dari Environment Variables, tanpa menaruh kunci di dalam repository.

   Dipakai sebagai Build Command di Vercel:
       node scripts/generate-config.js

   Membaca:
     - SUPABASE_URL
     - SUPABASE_ANON_KEY
   (service_role TIDAK dibaca dan TIDAK boleh dipakai di frontend.)

   Jika env tidak tersedia (mis. build lokal tanpa env), script tidak
   menimpa public_config.js yang mungkin sudah Anda isi manual.
   ===================================================================== */

const fs = require('fs');
const path = require('path');

const url = (process.env.SUPABASE_URL || '').trim();
const anon = (process.env.SUPABASE_ANON_KEY || '').trim();

const target = path.join(__dirname, '..', 'public_config.js');

if (!url || !anon) {
  console.warn(
    '[generate-config] SUPABASE_URL / SUPABASE_ANON_KEY tidak ditemukan di env. ' +
      'Melewati pembuatan public_config.js.'
  );
  // Jangan menimpa file manual yang mungkin sudah ada.
  process.exit(0);
}

// Keamanan: pastikan nilai yang masuk memang format yang diharapkan,
// dan tidak sengaja berisi service_role.
if (!/^https:\/\/.+\.supabase\.co\/?$/.test(url)) {
  console.error('[generate-config] SUPABASE_URL tidak valid:', url);
  process.exit(1);
}

// Escape agar aman ditaruh di dalam string JS.
function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const isi = `/* File ini DIBUAT OTOMATIS saat build dari Environment Variables.
   Jangan diedit manual; perubahan akan tertimpa.
   Berisi nilai PUBLIK (URL + anon key) yang aman untuk browser. */
window.PUBLIC_CONFIG = {
  SUPABASE_URL: '${esc(url)}',
  SUPABASE_ANON_KEY: '${esc(anon)}'
};
`;

fs.writeFileSync(target, isi, 'utf8');
console.log('[generate-config] public_config.js berhasil dibuat dari env.');
