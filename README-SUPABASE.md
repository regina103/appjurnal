# Integrasi Supabase — Panduan Setup Aman

Dokumen ini menjelaskan cara menghubungkan aplikasi ke Supabase untuk fitur
login & daftar (email + password), dengan keamanan yang benar meski aplikasi
di-deploy di Vercel lewat repository GitHub publik.

---

## Ringkasan Keamanan (baca dulu)

| Kunci | Sifat | Dipakai di frontend? | Boleh ter-commit? |
|-------|-------|----------------------|-------------------|
| `SUPABASE_URL` | Publik | Ya | Tidak perlu (di-ignore), tapi tidak berbahaya |
| `SUPABASE_ANON_KEY` | Publik (untuk klien) | Ya | Tidak perlu (di-ignore); aman asal RLS aktif |
| `SUPABASE_SERVICE_ROLE_KEY` | **RAHASIA** | **TIDAK PERNAH** | **TIDAK PERNAH** |

- `anon key` memang didesain untuk tampil di browser. Ia **aman** selama
  **Row Level Security (RLS)** diaktifkan (file `supabase/schema.sql`).
- `service_role key` **melewati semua keamanan**. Jangan pernah menaruhnya di
  file frontend atau meng-commit-nya. Di aplikasi statis ini, kunci tersebut
  **tidak dipakai sama sekali** — hanya disimpan di `.env.local` untuk keperluan
  admin/CLI dari komputer Anda bila suatu saat diperlukan.

File yang berisi rahasia (`.env.local`, `public_config.js`) sudah otomatis
di-ignore git (lihat `.gitignore`), jadi tidak akan ikut ter-push ke GitHub.

---

## LANGKAH 2 — Mengambil kunci dari dashboard Supabase

1. Buka <https://supabase.com> dan masuk ke akun Anda.
2. Pilih project Anda (atau buat baru: **New project**).
3. Di sidebar kiri, klik ikon **Settings** (gerigi) → **API**.
4. Di halaman **Project API** Anda akan menemukan:
   - **Project URL** → ini nilai untuk `SUPABASE_URL`
     (contoh: `https://abcdefgh.supabase.co`).
   - Di bagian **Project API keys**:
     - **`anon` `public`** → ini nilai untuk `SUPABASE_ANON_KEY`.
     - **`service_role` `secret`** → ini nilai untuk `SUPABASE_SERVICE_ROLE_KEY`.
       Klik "Reveal" untuk melihatnya. **Perlakukan seperti password.**

> Catatan: Supabase versi baru mungkin menamai menu ini sedikit berbeda
> (mis. **Project Settings → API Keys**), tapi ketiga nilai di atas tetap ada
> di area pengaturan API project.

### Aktifkan email/password & siapkan database
5. Sidebar → **Authentication** → **Providers** → pastikan **Email** aktif.
   - Untuk uji coba cepat, Anda boleh menonaktifkan "Confirm email" (sidebar
     Authentication → Providers → Email → matikan "Confirm email") agar bisa
     langsung login tanpa verifikasi. Untuk produksi, sebaiknya biarkan aktif.
6. Sidebar → **SQL Editor** → **New query** → tempel seluruh isi
   `supabase/schema.sql` → **Run**. Ini membuat tabel data dan **mengaktifkan
   RLS** (pengaman utama).

---

## LANGKAH 3 — Menempelkan kunci di komputer Anda

Ada **dua file** tujuan. Perhatikan baik-baik kunci mana ke file mana.

### A. `public_config.js` (dibaca oleh frontend / browser)
Isi **HANYA** dua nilai publik:

```js
window.PUBLIC_CONFIG = {
  SUPABASE_URL: 'https://abcdefgh.supabase.co',   // <- Project URL
  SUPABASE_ANON_KEY: 'eyJhbGciOi...'              // <- anon public key
};
```

- JANGAN menaruh `service_role` key di sini.
- File ini sudah di-ignore git.

### B. `.env.local` (penyimpanan referensi/CLI di komputer Anda)
Isi **ketiga** nilai:

```
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # RAHASIA — jangan pindah ke frontend
```

- File ini sudah di-ignore git (tidak akan ter-push).
- `service_role` disimpan di sini saja, untuk keperluan admin dari komputer Anda.

**Ringkas:**
- `SUPABASE_URL` → `public_config.js` **dan** `.env.local`
- `SUPABASE_ANON_KEY` → `public_config.js` **dan** `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` → **HANYA** `.env.local`

---

## Soal Deploy di Vercel

Karena aplikasi ini statis dan `public_config.js` di-ignore git, file itu
**tidak ikut** ke GitHub maupun Vercel. Dua pilihan agar versi online tetap
jalan (pilih salah satu):

**Pilihan 1 — paling sederhana (disarankan untuk app statis):**
Karena `SUPABASE_URL` dan `ANON_KEY` memang publik dan aman, Anda boleh
mengecualikannya dari ignore khusus untuk build online. Namun agar tetap rapi
dan sesuai permintaan Anda, gunakan Pilihan 2.

**Pilihan 2 — pakai Environment Variables di Vercel (tanpa commit kunci):**
1. Vercel Dashboard → project Anda → **Settings** → **Environment Variables**.
2. Tambahkan:
   - `SUPABASE_URL` = (Project URL)
   - `SUPABASE_ANON_KEY` = (anon key)
   - (JANGAN tambahkan service_role di sini untuk app statis.)
3. Tambahkan langkah build yang menghasilkan `public_config.js` dari env.
   File `scripts/generate-config.js` sudah disediakan untuk ini — detail ada
   di bagian berikut.

---

## Membuat `public_config.js` otomatis saat build Vercel (opsional, aman)

Agar versi online punya `public_config.js` tanpa Anda commit kuncinya, Vercel
bisa membuat file itu saat build dari Environment Variables.

1. Pastikan `SUPABASE_URL` & `SUPABASE_ANON_KEY` sudah diisi di Vercel
   (Settings → Environment Variables).
2. Di Vercel project → **Settings** → **Build & Development Settings**:
   - **Build Command:** `node scripts/generate-config.js`
   - **Output Directory:** `.` (atau biarkan default untuk static)
3. Deploy. Vercel akan menjalankan script tersebut dan menuliskan
   `public_config.js` berisi nilai dari env — kunci tidak pernah masuk GitHub.

> Jika Anda tidak ingin repot, Pilihan paling mudah: set hanya
> `SUPABASE_URL` + `SUPABASE_ANON_KEY` di Vercel env dan pakai build command di
> atas. `service_role` tetap tidak pernah menyentuh frontend/Vercel.
