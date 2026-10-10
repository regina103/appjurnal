# Jurnal Keuangan Syariah

Aplikasi pencatatan keuangan pribadi (mobile web app / PWA) sesuai prinsip syariah.
Dibuat dengan HTML, CSS, dan JavaScript murni — tanpa framework dan tanpa server backend.
Data disimpan lokal di perangkat menggunakan `localStorage`.

## Fitur
- Pencatatan transaksi pemasukan & pengeluaran
- Akun syariah: bagi hasil/mudharabah, murabahah, zakat, infak, sedekah, wakaf
- Pemisahan dana halal & non-halal
- Perhitungan zakat otomatis (2,5%) dengan kalkulator nisab & haul
- Laporan keuangan: laba rugi, neraca, arus kas
- Tema terang/gelap, ekspor data JSON
- PWA: bisa di-install ke layar utama HP dan dibuka offline

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
