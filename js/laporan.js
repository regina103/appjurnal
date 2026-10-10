/* =====================================================================
   laporan.js — Perhitungan laporan keuangan sederhana:
   - Laba Rugi (ringkasan pemasukan vs pengeluaran)
   - Neraca    (saldo kas, dibagi dana halal & non-halal)
   - Arus Kas  (ringkasan kas masuk/keluar per periode)
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
  function neraca() {
    const tx = DB.getTransaksi();
    const saldo = { halal: 0, nonhalal: 0 };

    tx.forEach((t) => {
      const arah = t.jenis === 'pemasukan' ? 1 : -1;
      const bucket = t.dana === 'nonhalal' ? 'nonhalal' : 'halal';
      saldo[bucket] += arah * t.jumlah;
    });

    const totalAset = saldo.halal + saldo.nonhalal;
    return {
      kasHalal: saldo.halal,
      kasNonHalal: saldo.nonhalal,
      totalAset,
      // Secara syariah, dana non-halal bukan hak milik -> dicatat sebagai kewajiban disalurkan
      kewajibanNonHalal: Math.max(0, saldo.nonhalal),
      kekayaanBersih: saldo.halal
    };
  }

  // ---- Arus Kas ----
  function arusKas(dari, sampai) {
    const tx = dalamRentang(DB.getTransaksi(), dari, sampai);
    const masuk = tx.filter((t) => t.jenis === 'pemasukan').reduce((s, t) => s + t.jumlah, 0);
    const keluar = tx.filter((t) => t.jenis === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0);
    return { masuk, keluar, arusBersih: masuk - keluar, jumlahTransaksi: tx.length };
  }

  // ---- Ringkasan sosial: zakat, infak, sedekah, wakaf ----
  function ringkasanSosial() {
    const tx = DB.getTransaksi();
    const kategori = ['zakat', 'infak', 'sedekah', 'wakaf'];
    const hasil = {};
    let total = 0;
    kategori.forEach((k) => {
      const jml = tx
        .filter((t) => t.akunId === k)
        .reduce((s, t) => s + t.jumlah, 0);
      hasil[k] = jml;
      total += jml;
    });
    hasil.total = total;
    return hasil;
  }

  return { labaRugi, neraca, arusKas, ringkasanSosial };
})();
