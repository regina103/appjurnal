/* =====================================================================
   public_config.js — KONFIGURASI FRONTEND (di-ignore git, tidak ter-push)

   Dibaca oleh browser. HANYA berisi nilai PUBLIK: URL + publishable/anon key.
   Keduanya aman tampil di browser selama Row Level Security (RLS) aktif.

   ⚠️ JANGAN PERNAH menaruh service_role / secret key di file ini.
      Service role melewati semua keamanan dan bisa membocorkan seluruh data.
   ===================================================================== */

window.PUBLIC_CONFIG = {
  // Project URL Supabase
  SUPABASE_URL: "https://fodbhfrorkdniaaockbo.supabase.co",

  // Publishable / anon key (publik, untuk frontend)
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZGJoZnJvcmtkbmlhYW9ja2JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MDQyMTcsImV4cCI6MjEwNzQ4MDIxN30.35etB71e1MRkDDrQ1UdzQTF43HMxJ0wGg_i5alcsG8k"
};
