/* =====================================================================
   tabungan.js — Logika tabungan & target menabung untuk siswa.

   Menggantikan modul zakat. Fokus pada hal yang relevan untuk pelajar:
   - Total yang sudah ditabung (kategori "Setor Tabungan").
   - Progres menuju target tabungan yang ditentukan sendiri.
   - Ringkasan pengeluaran hari ini vs budget harian.
   ===================================================================== */

const Tabungan = (() => {
  // Total uang yang sudah disetorkan ke tabungan (kategori 'tabungan')
  function totalTabungan() {
    return DB.getTransaksi()
      .filter((t) => t.akunId === 'tabungan')
      .reduce((s, t) => s + t.jumlah, 0);
  }

  // Progres menuju target
  function progres(settings) {
    const s = settings || DB.getSettings();
    const terkumpul = totalTabungan();
    const target = Number(s.targetTabungan) || 0;
    const persen = target > 0 ? Math.min(100, Math.round((terkumpul / target) * 100)) : 0;
    const kurang = Math.max(0, target - terkumpul);
    return {
      target,
      namaTarget: s.namaTarget || '',
      terkumpul,
      kurang,
      persen,
      tercapai: target > 0 && terkumpul >= target
    };
  }

  // Pengeluaran pada tanggal tertentu (default: hari ini)
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

  // Status budget harian
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

  return { totalTabungan, progres, pengeluaranHari, statusBudget };
})();
