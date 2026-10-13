/* =====================================================================
   laporan.js — Perhitungan laporan keuangan sederhana untuk siswa:
   - Laba Rugi (ringkasan uang masuk vs uang keluar per kategori)
   - Neraca    (sisa uang saku saat ini)
   - Arus Kas  (ringkasan uang masuk/keluar per periode)
   ===================================================================== */

const Laporan = (() => {
  function dalamRentang(tx, dari, sampai) {
    return tx.filter((t) => {
      const d = new Date(t.tanggal);
      if (dari && d < dari) return false;
      if (sampai && d > sampai) return false;
      return true;
    });
  }

  // ---- Laba Rugi ----
  function labaRugi(dari, sampai) {
    const tx = dalamRentang(DB.getTransaksi(), dari, sampai);
    let pemasukan = 0;
    let pengeluaran = 0;
    const perAkun = {};

    tx.forEach((t) => {
      if (t.jenis === 'pemasukan') pemasukan += t.jumlah;
      else pengeluaran += t.jumlah;

      perAkun[t.akunId] = perAkun[t.akunId] || { masuk: 0, keluar: 0 };
      if (t.jenis === 'pemasukan') perAkun[t.akunId].masuk += t.jumlah;
      else perAkun[t.akunId].keluar += t.jumlah;
    });

    return { pemasukan, pengeluaran, selisih: pemasukan - pengeluaran, perAkun };
  }

  // ---- Neraca (posisi saldo saat ini) ----
  // Sisa uang = total pemasukan - total pengeluaran.
  function neraca() {
    const tx = DB.getTransaksi();
    let saldo = 0;

    tx.forEach((t) => {
      const arah = t.jenis === 'pemasukan' ? 1 : -1;
      saldo += arah * t.jumlah;
    });

    return {
      totalAset: saldo,
      kekayaanBersih: saldo // sisa uang saku
    };
  }

  // ---- Arus Kas ----
  function arusKas(dari, sampai) {
    const tx = dalamRentang(DB.getTransaksi(), dari, sampai);
    const masuk = tx.filter((t) => t.jenis === 'pemasukan').reduce((s, t) => s + t.jumlah, 0);
    const keluar = tx.filter((t) => t.jenis === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0);
    return { masuk, keluar, arusBersih: masuk - keluar, jumlahTransaksi: tx.length };
  }

  return { labaRugi, neraca, arusKas };
})();
