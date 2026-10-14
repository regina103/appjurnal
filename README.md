# I'mNote

Aplikasi pencatatan keuangan untuk pelajar (mobile web app / PWA).
Membantu siswa mencatat uang saku, mengatur pengeluaran, menetapkan budget harian, dan menabung untuk target.
Dibuat dengan HTML, CSS, dan JavaScript murni — tanpa framework dan tanpa server backend.
Data disimpan lokal di perangkat menggunakan `localStorage`.

## Fitur
- Pencatatan uang masuk (uang saku, kiriman bulanan, hadiah, beasiswa) & uang keluar (jajan, alat tulis, transport, pulsa, hiburan, dll)
- Tabungan: total yang sudah disetor + progres menuju target menabung yang bisa ditentukan sendiri
- Budget harian: pantau pengeluaran hari ini vs batas yang ditetapkan
- Laporan keuangan: ringkasan pemasukan/pengeluaran per kategori dan sisa uang saku
- Tema terang/gelap, ekspor data JSON
- PWA: bisa di-install ke layar utama HP dan dibuka offline

## Menu
- **Beranda** — sisa uang saku, status budget harian, progres target tabungan, dan transaksi terbaru
- **Transaksi** — daftar & filter semua catatan uang masuk/keluar
- **Tabungan** — total tabungan, target menabung, dan pengaturan budget harian
- **Laporan** — rincian per kategori dan ringkasan saldo

## Menjalankan secara lokal

Aplikasi ini statis. Pilih salah satu:

**A. Buka langsung** — klik dua kali `index.html` (fitur PWA/offline nonaktif).

**B. Server lokal Windows (tanpa instalasi)** — jalankan:

```powershell
powershell -ExecutionPolicy Bypass -File server.ps1
```

Lalu buka http://localhost:8000

## Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Di [vercel.com](https://vercel.com), **Add New → Project → Import** repo ini.
3. Biarkan pengaturan default (Framework Preset: Other, tanpa build command).
4. Klik **Deploy**.

Setiap push ke branch `main` akan otomatis ter-deploy ulang.
