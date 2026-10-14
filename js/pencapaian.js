/* =====================================================================
   pencapaian.js — Tingkatan pencapaian menabung user.

   Dihitung dari JUMLAH setoran ke tabungan (kategori 'tabungan'),
   bukan dari nominalnya, supaya menghargai kebiasaan rutin menabung.

   Tiga tingkat:
     🌱 al-Muhafiz  (0–2 setoran)   — "Si Penjaga": baru mulai.
     🤲 al-Munfiq   (3–9 setoran)   — "Si Dermawan": sudah lumayan rutin.
     👑 al-Warits   (10+ setoran)   — "Sang Pewaris": sangat rajin.
   ===================================================================== */

const Pencapaian = (() => {
  const TINGKAT = [
    {
      id: 'warits',
      min: 10,
      nama: 'al-Warits',
      arti: 'Sang Pewaris',
      logo: '👑',
      warna: 'warits',
      pesan:
        'Luar biasa! Kebiasaan menabungmu sudah sangat kuat. Pertahankan, hartamu tumbuh untuk masa depan.'
    },
    {
      id: 'munfiq',
      min: 3,
      nama: 'al-Munfiq',
      arti: 'Si Dermawan',
      logo: '🤲',
      warna: 'munfiq',
      pesan:
        'Hebat, kamu makin rajin menabung! Sedikit lagi menuju al-Warits. Terus semangat sisihkan uangmu ya!'
    },
    {
      id: 'muhafiz',
      min: 0,
      nama: 'al-Muhafiz',
      arti: 'Si Penjaga',
      logo: '🌱',
      warna: 'muhafiz',
      pesan:
        'Setiap benih besar berawal dari langkah kecil. Yuk, mulai rutin menabung agar naik ke tingkat berikutnya!'
    }
  ];

  // Hitung berapa kali user menyetor ke tabungan.
  function jumlahSetoran() {
    return DB.getTransaksi().filter((t) => t.akunId === 'tabungan').length;
  }

  // Tentukan tingkat saat ini + info menuju tingkat berikutnya.
  function tingkatSekarang() {
    const n = jumlahSetoran();
    const tingkat = TINGKAT.find((t) => n >= t.min) || TINGKAT[TINGKAT.length - 1];

    // Cari tingkat berikutnya (yang min-nya lebih tinggi, terdekat).
    const lebihTinggi = TINGKAT
      .filter((t) => t.min > n)
      .sort((a, b) => a.min - b.min);
    const berikutnya = lebihTinggi.length ? lebihTinggi[0] : null;

    return {
      ...tingkat,
      jumlahSetoran: n,
      berikutnya,
      sisaMenujuBerikutnya: berikutnya ? berikutnya.min - n : 0
    };
  }

  return { jumlahSetoran, tingkatSekarang, TINGKAT };
})();
