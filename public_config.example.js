/* =====================================================================
   public_config.example.js — TEMPLATE (aman di-commit, tanpa nilai asli)

   Cara pakai:
   1. Salin file ini menjadi "public_config.js"
   2. Isi SUPABASE_URL dan SUPABASE_ANON_KEY dengan nilai dari dashboard Supabase.
   3. "public_config.js" sudah di-ignore git sehingga tidak akan ter-push.

   PENTING — KEAMANAN:
   - HANYA letakkan URL dan ANON key di sini.
   - JANGAN PERNAH menaruh service_role key di file ini atau di file frontend
     mana pun. service_role key melewati semua keamanan database (RLS) dan
     bila bocor, seluruh data semua user bisa diakses/dihapus siapa saja.
   - ANON key memang dirancang untuk tampil di browser dan AMAN selama
     Row Level Security (RLS) diaktifkan di Supabase (sudah disiapkan di
     file supabase/schema.sql).
   ===================================================================== */

window.PUBLIC_CONFIG = {
  SUPABASE_URL: 'ISI_DENGAN_URL_SUPABASE_ANDA',
  SUPABASE_ANON_KEY: 'ISI_DENGAN_ANON_KEY_SUPABASE_ANDA'
};
