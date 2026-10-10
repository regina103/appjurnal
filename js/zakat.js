/* =====================================================================
   zakat.js — Logika zakat maal: nisab, haul, dan perhitungan otomatis.

   Aturan dasar (zakat maal / harta):
   - Nisab   : batas minimal harta wajib zakat = setara 85 gram emas.
   - Haul    : harta telah dimiliki selama 1 tahun hijriah (± 354 hari).
   - Kadar   : 2,5% dari total harta bersih yang mencapai nisab & haul.
   ===================================================================== */

const Zakat = (() => {
  const HARI_HAUL = 354; // 1 tahun hijriah (perkiraan)

  // Nilai nisab dalam rupiah = nisabGram × harga emas per gram
  function nilaiNisab(settings) {
    const s = settings || DB.getSettings();
    return s.nisabGram * s.hargaEmasPerGram;
  }

  // Hitung zakat dari jumlah harta
  function hitung(hartaBersih, settings) {
    const s = settings || DB.getSettings();
    const nisab = nilaiNisab(s);
    const wajib = hartaBersih >= nisab;
    const jumlahZakat = wajib ? Math.round(hartaBersih * s.nilaiZakat) : 0;
    return {
      hartaBersih,
      nisab,
      wajib,
      persen: s.nilaiZakat * 100,
      jumlahZakat,
      kurang: wajib ? 0 : Math.max(0, nisab - hartaBersih)
    };
  }

  // Perkiraan harta saat ini dari saldo dana halal (pemasukan - pengeluaran halal)
  function hartaHalalSaatIni() {
    const tx = DB.getTransaksi().filter((t) => t.dana === 'halal');
    let masuk = 0;
    let keluar = 0;
    tx.forEach((t) => {
      if (t.jenis === 'pemasukan') masuk += t.jumlah;
      else keluar += t.jumlah;
    });
    return Math.max(0, masuk - keluar);
  }

  // Status haul berdasarkan tanggal mulai (disimpan di pengaturan)
  function statusHaul(tanggalMulaiISO) {
    if (!tanggalMulaiISO) {
      return { aktif: false, hariBerjalan: 0, hariSisa: HARI_HAUL, selesai: false };
    }
    const mulai = new Date(tanggalMulaiISO);
    const sekarang = new Date();
    const hariBerjalan = Math.floor((sekarang - mulai) / 86400000);
    const hariSisa = Math.max(0, HARI_HAUL - hariBerjalan);
    return {
      aktif: true,
      mulai,
      hariBerjalan,
      hariSisa,
      selesai: hariBerjalan >= HARI_HAUL,
      persen: Math.min(100, Math.round((hariBerjalan / HARI_HAUL) * 100))
    };
  }

  return { HARI_HAUL, nilaiNisab, hitung, hartaHalalSaatIni, statusHaul };
})();
