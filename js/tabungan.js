/* =====================================================================
   tabungan.js — Logika tabungan (kantung) & budget harian untuk siswa.

   Fitur:
   - Beberapa "kantung" tabungan (tujuan menabung) milik user.
   - Setor ke kantung: manual, atau dialihkan dari SISA uang harian.
   - Budget harian & ringkasan pengeluaran hari ini.
   - "Sisa harian" = uang yang belum terpakai & belum dialihkan ke tabungan.
   ===================================================================== */

const Tabungan = (() => {
  // Total seluruh tabungan (semua kantung).
  function totalTabungan() {
    return DB.totalSemuaTabungan();
  }

  // Progres satu kantung menuju targetnya.
  function progresKantung(kantung) {
    const terkumpul = DB.totalSetoranKantung(kantung.id);
    const target = Number(kantung.target) || 0;
    const persen = target > 0 ? Math.min(100, Math.round((terkumpul / target) * 100)) : 0;
    const kurang = Math.max(0, target - terkumpul);
    return {
      ...kantung,
      terkumpul,
      target,
      persen,
      kurang,
      tercapai: target > 0 && terkumpul >= target
    };
  }

  // Semua kantung beserta progresnya.
  function semuaProgres() {
    return DB.getKantung().map(progresKantung);
  }

  // ---- Sisa uang harian yang bisa dialihkan ke tabungan ----
  // Sisa = total pemasukan - total pengeluaran (pengeluaran sudah termasuk
  // setoran tabungan). Jadi angka ini adalah "uang di tangan" yang belum
  // terpakai dan belum ditabung. Hanya nilai positif yang bisa dialihkan.
  function sisaBisaDitabung() {
    let masuk = 0;
    let keluar = 0;
    DB.getTransaksi().forEach((t) => {
      if (t.jenis === 'pemasukan') masuk += t.jumlah;
      else keluar += t.jumlah;
    });
    return Math.max(0, masuk - keluar);
  }

  // Pengeluaran pada tanggal tertentu (default: hari ini).
  function pengeluaranHari(tanggal) {
    const acuan = tanggal ? new Date(tanggal) : new Date();
    const y = acuan.getFullYear();
    const m = acuan.getMonth();
    const d = acuan.getDate();
    return DB.getTransaksi()
      .filter((t) => {
        if (t.jenis !== 'pengeluaran') return false;
        const td = new Date(t.tanggal);
        return td.getFullYear() === y && td.getMonth() === m && td.getDate() === d;
      })
      .reduce((s, t) => s + t.jumlah, 0);
  }

  // Status budget harian.
  function statusBudget(settings) {
    const s = settings || DB.getSettings();
    const budget = Number(s.budgetHarian) || 0;
    const terpakai = pengeluaranHari();
    const sisa = budget > 0 ? budget - terpakai : 0;
    const persen = budget > 0 ? Math.min(100, Math.round((terpakai / budget) * 100)) : 0;
    return {
      budget,
      terpakai,
      sisa,
      persen,
      lebih: budget > 0 && terpakai > budget
    };
  }

  return {
    totalTabungan,
    progresKantung,
    semuaProgres,
    sisaBisaDitabung,
    pengeluaranHari,
    statusBudget
  };
})();
