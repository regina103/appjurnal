/* =====================================================================
   db.js — Lapisan penyimpanan data (localStorage)
   Mengelola: akun syariah, transaksi, dan pengaturan.
   Data disimpan lokal di perangkat, tidak dikirim ke mana pun.
   ===================================================================== */

const DB = (() => {
  const KEYS = {
    tx: 'js_transaksi',
    accounts: 'js_akun',
    settings: 'js_pengaturan',
    seeded: 'js_seeded'
  };

  // ---- Akun bawaan sesuai prinsip syariah ----
  // jenis: 'pemasukan' | 'pengeluaran' | 'dana'
  // dana : 'halal' | 'nonhalal'  (pemisahan dana)
  const DEFAULT_ACCOUNTS = [
    { id: 'gaji',       nama: 'Pemasukan Halal (uang saku/kerja)', jenis: 'pemasukan',   dana: 'halal',    ikon: '💵' },
    { id: 'bagihasil',  nama: 'Bagi Hasil / Mudharabah',           jenis: 'pemasukan',   dana: 'halal',    ikon: '🤝' },
    { id: 'murabahah',  nama: 'Keuntungan Murabahah',              jenis: 'pemasukan',   dana: 'halal',    ikon: '📈' },
    { id: 'hadiah',     nama: 'Hadiah / Pemberian',                jenis: 'pemasukan',   dana: 'halal',    ikon: '🎁' },
    { id: 'nonhalal',   nama: 'Dana Non-Halal (bunga, dll)',       jenis: 'pemasukan',   dana: 'nonhalal', ikon: '⚠️' },

    { id: 'kebutuhan',  nama: 'Kebutuhan Pokok',                   jenis: 'pengeluaran', dana: 'halal',    ikon: '🛒' },
    { id: 'pendidikan', nama: 'Pendidikan / Sekolah',              jenis: 'pengeluaran', dana: 'halal',    ikon: '📚' },
    { id: 'transport',  nama: 'Transportasi',                      jenis: 'pengeluaran', dana: 'halal',    ikon: '🚌' },
    { id: 'zakat',      nama: 'Zakat',                             jenis: 'pengeluaran', dana: 'halal',    ikon: '🕌' },
    { id: 'infak',      nama: 'Infak',                             jenis: 'pengeluaran', dana: 'halal',    ikon: '🤲' },
    { id: 'sedekah',    nama: 'Sedekah',                           jenis: 'pengeluaran', dana: 'halal',    ikon: '❤️' },
    { id: 'wakaf',      nama: 'Wakaf',                             jenis: 'pengeluaran', dana: 'halal',    ikon: '🏛️' },
    { id: 'lainnya',    nama: 'Pengeluaran Lainnya',               jenis: 'pengeluaran', dana: 'halal',    ikon: '📦' }
  ];

  const DEFAULT_SETTINGS = {
    hargaEmasPerGram: 1300000,  // Rp per gram (bisa diubah user)
    nisabGram: 85,              // nisab zakat maal = 85 gram emas
    nilaiZakat: 0.025,          // 2.5%
    mataUang: 'Rp',
    tema: 'terang'
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('Gagal membaca', key, e);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Gagal menyimpan', key, e);
      return false;
    }
  }

  // ---- Inisialisasi data bawaan sekali saja ----
  function seed() {
    if (!read(KEYS.seeded, false)) {
      write(KEYS.accounts, DEFAULT_ACCOUNTS);
      write(KEYS.settings, DEFAULT_SETTINGS);
      write(KEYS.tx, []);
      write(KEYS.seeded, true);
    }
    // Pastikan setiap pengaturan ada (migrasi ringan)
    const s = { ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) };
    write(KEYS.settings, s);
  }

  // ---- API Akun ----
  function getAccounts() {
    return read(KEYS.accounts, DEFAULT_ACCOUNTS);
  }
  function getAccount(id) {
    return getAccounts().find((a) => a.id === id) || null;
  }

  // ---- API Transaksi ----
  // tx: { id, tanggal(ISO), jenis, akunId, dana, jumlah, catatan }
  function getTransaksi() {
    const list = read(KEYS.tx, []);
    return list.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }

  function tambahTransaksi(data) {
    const list = read(KEYS.tx, []);
    const akun = getAccount(data.akunId);
    const tx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      tanggal: data.tanggal || new Date().toISOString(),
      jenis: data.jenis,                       // 'pemasukan' | 'pengeluaran'
      akunId: data.akunId,
      dana: akun ? akun.dana : (data.dana || 'halal'),
      jumlah: Math.abs(Number(data.jumlah) || 0),
      catatan: (data.catatan || '').trim()
    };
    list.push(tx);
    write(KEYS.tx, list);
    return tx;
  }

  function hapusTransaksi(id) {
    const list = read(KEYS.tx, []).filter((t) => t.id !== id);
    return write(KEYS.tx, list);
  }

  // ---- API Pengaturan ----
  function getSettings() {
    return { ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) };
  }
  function setSettings(partial) {
    const next = { ...getSettings(), ...partial };
    write(KEYS.settings, next);
    return next;
  }

  // ---- Reset / ekspor ----
  function resetSemua() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    seed();
  }

  function exportJSON() {
    return JSON.stringify(
      {
        transaksi: getTransaksi(),
        akun: getAccounts(),
        pengaturan: getSettings(),
        diekspor: new Date().toISOString()
      },
      null,
      2
    );
  }

  return {
    seed,
    getAccounts,
    getAccount,
    getTransaksi,
    tambahTransaksi,
    hapusTransaksi,
    getSettings,
    setSettings,
    resetSemua,
    exportJSON
  };
})();
