/* =====================================================================
   db.js — Lapisan penyimpanan data (localStorage)
   Mengelola: kategori akun, transaksi, dan pengaturan.
   Data disimpan lokal di perangkat, tidak dikirim ke mana pun.
   ===================================================================== */

const DB = (() => {
  const KEYS = {
    tx: 'js_transaksi',
    accounts: 'js_akun',
    settings: 'js_pengaturan',
    seeded: 'js_seeded'
  };

  // ---- Akun bawaan untuk pengelolaan keuangan siswa ----
  // jenis : 'pemasukan' | 'pengeluaran'
  // Kategori disusun agar sesuai keseharian pelajar: uang saku, jajan,
  // kebutuhan sekolah, menabung, dan sedekah.
  const DEFAULT_ACCOUNTS = [
    // Pemasukan (uang masuk) — relevan untuk pelajar
    { id: 'uangsaku',   nama: 'Uang Saku',                 jenis: 'pemasukan',   dana: 'halal', ikon: '💵' },
    { id: 'hadiah',     nama: 'Hadiah / Pemberian',        jenis: 'pemasukan',   dana: 'halal', ikon: '🎁' },
    { id: 'sisatabung', nama: 'Tabungan / Sisa',           jenis: 'pemasukan',   dana: 'halal', ikon: '👛' },
    { id: 'masuklain',  nama: 'Pemasukan Lainnya',         jenis: 'pemasukan',   dana: 'halal', ikon: '➕' },

    // Pengeluaran (uang keluar) — relevan untuk pelajar
    { id: 'jajan',      nama: 'Jajan / Makan',             jenis: 'pengeluaran', dana: 'halal', ikon: '🍔' },
    { id: 'alattulis',  nama: 'Alat Tulis & Buku',         jenis: 'pengeluaran', dana: 'halal', ikon: '✏️' },
    { id: 'sekolah',    nama: 'Keperluan Sekolah',         jenis: 'pengeluaran', dana: 'halal', ikon: '🏫' },
    { id: 'transport',  nama: 'Transport / Ongkos',        jenis: 'pengeluaran', dana: 'halal', ikon: '🚌' },
    { id: 'pulsa',      nama: 'Pulsa / Kuota',             jenis: 'pengeluaran', dana: 'halal', ikon: '📱' },
    { id: 'sedekah',    nama: 'Sedekah / Infak',           jenis: 'pengeluaran', dana: 'halal', ikon: '🤲' },
    { id: 'tabungan',   nama: 'Setor Tabungan',            jenis: 'pengeluaran', dana: 'halal', ikon: '👛' },
    { id: 'lainnya',    nama: 'Pengeluaran Lainnya',       jenis: 'pengeluaran', dana: 'halal', ikon: '📦' }
  ];

  const DEFAULT_SETTINGS = {
    mataUang: 'Rp',
    tema: 'terang',
    budgetHarian: 0,            // batas pengeluaran harian yang disarankan (Rp)
    // Kantung tabungan: daftar tujuan menabung milik user.
    // Tiap kantung: { id, nama, target, ikon }
    kantung: [],
    // Riwayat setoran per kantung: { id, kantungId, jumlah, tanggal, sumber, catatan }
    //   sumber: 'manual' | 'sisa' (dialihkan dari sisa uang harian)
    setoran: []
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

  // ---- API Kantung Tabungan ----
  function getKantung() {
    return getSettings().kantung || [];
  }

  function tambahKantung(data) {
    const list = getKantung();
    const kantung = {
      id: 'k_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      nama: (data.nama || 'Tabungan').trim().slice(0, 40),
      target: Math.max(0, Number(data.target) || 0),
      ikon: data.ikon || '🎯'
    };
    list.push(kantung);
    setSettings({ kantung: list });
    return kantung;
  }

  function ubahKantung(id, data) {
    const list = getKantung().map((k) =>
      k.id === id
        ? {
            ...k,
            nama: data.nama !== undefined ? String(data.nama).trim().slice(0, 40) : k.nama,
            target: data.target !== undefined ? Math.max(0, Number(data.target) || 0) : k.target,
            ikon: data.ikon !== undefined ? data.ikon : k.ikon
          }
        : k
    );
    setSettings({ kantung: list });
  }

  function hapusKantung(id) {
    const kantung = getKantung().filter((k) => k.id !== id);
    const setoran = getSetoran().filter((s) => s.kantungId !== id);
    setSettings({ kantung, setoran });
  }

  // ---- API Setoran kantung ----
  function getSetoran() {
    return getSettings().setoran || [];
  }

  // sumber: 'manual' | 'sisa'
  function tambahSetoran(kantungId, jumlah, sumber, catatan) {
    const list = getSetoran();
    const setoran = {
      id: 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      kantungId,
      jumlah: Math.max(0, Number(jumlah) || 0),
      tanggal: new Date().toISOString(),
      sumber: sumber || 'manual',
      catatan: (catatan || '').trim()
    };
    if (setoran.jumlah <= 0) return null;
    list.push(setoran);
    setSettings({ setoran: list });

    // Catat juga sebagai transaksi "Setor Tabungan" agar tampil di jurnal
    // dan ikut mengurangi saldo uang harian.
    tambahTransaksi({
      jenis: 'pengeluaran',
      akunId: 'tabungan',
      jumlah: setoran.jumlah,
      catatan:
        (sumber === 'sisa' ? '[dari sisa harian] ' : '') +
        (catatan || '')
    });
    return setoran;
  }

  function totalSetoranKantung(kantungId) {
    return getSetoran()
      .filter((s) => s.kantungId === kantungId)
      .reduce((sum, s) => sum + s.jumlah, 0);
  }

  function totalSemuaTabungan() {
    return getSetoran().reduce((sum, s) => sum + s.jumlah, 0);
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
    getKantung,
    tambahKantung,
    ubahKantung,
    hapusKantung,
    getSetoran,
    tambahSetoran,
    totalSetoranKantung,
    totalSemuaTabungan,
    resetSemua,
    exportJSON
  };
})();
