/* =====================================================================
   pencapaian.js — Tingkatan menabung siswa (6 level).

   Level ditentukan terutama dari TOTAL nominal tabungan (semua kantung).
   Sebagian level punya syarat pendukung (jumlah tujuan aktif, pernah
   sedekah) yang ikut diperhitungkan bila datanya tersedia.
   ===================================================================== */

const Pencapaian = (() => {
  // Diurutkan dari tertinggi ke terendah (agar pencarian "level saat ini" mudah).
  const TINGKAT = [
    {
      id: 'mutawakkil',
      min: 1000000,
      nama: 'Al-Mutawakkil',
      arti: 'Pembuktian',
      logo: '🕋',
      warna: 'mutawakkil',
      target: 'Rp 1.000.000 pertama',
      realistis:
        'Milestone terbesar! Bisa beli seragam baru, daftar lomba, atau ikut tabungan qurban patungan.',
      pesan: 'MasyaAllah, pencapaian terbesar! Kamu bukti bahwa menabung konsisten itu nyata. 🕋'
    },
    {
      id: 'hakim',
      min: 500000,
      nama: 'Al-Hakim',
      arti: 'Si Perencana',
      logo: '🧭',
      warna: 'hakim',
      target: 'Rp 500.000 + punya 2 tujuan tabungan aktif',
      realistis:
        'Punya tabungan "Darurat" (kalau buku hilang) dan "Impian" (sepatu baru / HP second).',
      pesan: 'Keren! Kamu sudah bisa merencanakan beberapa tujuan sekaligus. Menuju Rp 1 juta! 🧭'
    },
    {
      id: 'munfiq',
      min: 250000,
      nama: 'Al-Munfiq',
      arti: 'Dermawan Cilik',
      logo: '🤲',
      warna: 'munfiq',
      target: 'Rp 250.000 + pernah sedekah Rp 10.000 dari tabungan',
      realistis: 'Belajar prinsip menyisihkan 10% untuk sedekah Jumat.',
      pesan: 'Hebat, kamu belajar berbagi! Sisihkan sedikit untuk sedekah, rezeki makin berkah. 🤲'
    },
    {
      id: 'muhtasib',
      min: 150000,
      nama: 'Al-Muhtasib',
      arti: 'Pengatur Saku',
      logo: '📊',
      warna: 'muhtasib',
      target: 'Tabungan Rp 150.000',
      realistis: 'Bisa bayar uang kas, fotokopi, atau paket data sendiri selama sebulan.',
      pesan: 'Mantap! Kamu makin pandai mengatur uang saku sendiri. Lanjut terus! 📊'
    },
    {
      id: 'mujtahid',
      min: 50000,
      nama: 'Al-Mujtahid',
      arti: 'Pejuang Rajin',
      logo: '✏️',
      warna: 'mujtahid',
      target: 'Tabungan Rp 50.000',
      realistis: 'Bisa beli alat tulis / buku sendiri tanpa minta orang tua.',
      pesan: 'Semangat juangmu bagus! Terus rajin menabung ya, sedikit demi sedikit jadi bukit. ✏️'
    },
    {
      id: 'muhafiz',
      min: 0,
      nama: 'Al-Muhafiz',
      arti: 'Penjaga Jajan',
      logo: '🌱',
      warna: 'muhafiz',
      target: 'Kumpulkan Rp 20.000 pertama dari sisa uang saku',
      realistis: 'Coba tahan jajan beberapa hari dan tabung sisanya.',
      pesan: 'Setiap benih besar berawal dari langkah kecil. Yuk, mulai sisihkan sisa uang sakumu! 🌱'
    }
  ];

  function totalTabungan() {
    return DB.totalSemuaTabungan();
  }

  function jumlahKantung() {
    return DB.getKantung().length;
  }

  // Tentukan tingkat saat ini + info menuju tingkat berikutnya.
  function tingkatSekarang() {
    const total = totalTabungan();
    const tingkat = TINGKAT.find((t) => total >= t.min) || TINGKAT[TINGKAT.length - 1];

    const lebihTinggi = TINGKAT.filter((t) => t.min > total).sort((a, b) => a.min - b.min);
    const berikutnya = lebihTinggi.length ? lebihTinggi[0] : null;

    return {
      ...tingkat,
      total,
      jumlahKantung: jumlahKantung(),
      berikutnya,
      sisaMenujuBerikutnya: berikutnya ? berikutnya.min - total : 0
    };
  }

  return { totalTabungan, jumlahKantung, tingkatSekarang, TINGKAT };
})();
