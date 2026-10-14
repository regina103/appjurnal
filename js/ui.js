/* =====================================================================
   ui.js — Render antarmuka & interaksi.
   Semua halaman (beranda, transaksi, tabungan, laporan) dirender di sini.
   ===================================================================== */

const UI = (() => {
  const view = document.getElementById('view');
  const pageTitle = document.getElementById('pageTitle');
  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('modal');
  const toastEl = document.getElementById('toast');

  let currentPage = 'beranda';

  // ---------- Util ----------
  const s = () => DB.getSettings();

  function rupiah(n) {
    const neg = n < 0;
    const val = Math.abs(Math.round(n)).toLocaleString('id-ID');
    return (neg ? '-' : '') + s().mataUang + ' ' + val;
  }

  function tanggalPendek(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function esc(str) {
    return String(str || '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (toastEl.hidden = true), 2200);
  }

  // ---------- Modal ----------
  function openModal(html) {
    modal.innerHTML = html;
    overlay.hidden = false;
  }
  function closeModal() {
    overlay.hidden = true;
    modal.innerHTML = '';
  }
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // ================================================================
  //  HALAMAN: BERANDA
  // ================================================================
  function renderBeranda() {
    const n = Laporan.neraca();
    const arus = Laporan.arusKas();
    const prog = Tabungan.progres();
    const budget = Tabungan.statusBudget();
    const txs = DB.getTransaksi().slice(0, 5);

    const listHtml = txs.length
      ? txs.map(txRow).join('')
      : emptyState('📝', 'Belum ada catatan', 'Tekan tombol + untuk mencatat uang masuk/keluar.');

    view.innerHTML = `
      <div class="balance-card">
        <div class="label">Sisa Uang Saku</div>
        <div class="amount">${rupiah(n.kekayaanBersih)}</div>
        <div class="balance-sub">
          <div class="pill"><small>Uang Masuk</small><b>${rupiah(arus.masuk)}</b></div>
          <div class="pill"><small>Uang Keluar</small><b>${rupiah(arus.keluar)}</b></div>
        </div>
      </div>

      ${
        budget.budget > 0
          ? `<div class="note ${budget.lebih ? 'warn' : ''}">
              ${budget.lebih
                ? `⚠️ Pengeluaran hari ini <b>${rupiah(budget.terpakai)}</b> sudah melebihi budget harian <b>${rupiah(budget.budget)}</b>.`
                : `💡 Pengeluaran hari ini <b>${rupiah(budget.terpakai)}</b> dari budget <b>${rupiah(budget.budget)}</b>. Sisa <b>${rupiah(budget.sisa)}</b>.`}
             </div>`
          : ''
      }

      <div class="summary-grid">
        <div class="stat">
          <div class="ico">🐷</div>
          <div class="val">${rupiah(prog.terkumpul)}</div>
          <div class="cap">Total Tabungan</div>
        </div>
        <div class="stat">
          <div class="ico">📅</div>
          <div class="val">${arus.jumlahTransaksi}</div>
          <div class="cap">Total transaksi</div>
        </div>
      </div>

      ${
        prog.target > 0
          ? `<div class="section-head"><h2>🎯 Target Menabung</h2><a href="#" data-goto="tabungan">Atur</a></div>
             <div class="card card-pad">
               <div class="row"><span class="lbl">${esc(prog.namaTarget || 'Target tabungan')}</span><span class="amt">${rupiah(prog.terkumpul)} / ${rupiah(prog.target)}</span></div>
               <div class="progress"><span style="width:${prog.persen}%"></span></div>
               <div class="row"><span class="lbl">${prog.tercapai ? '🎉 Target tercapai!' : 'Kurang ' + rupiah(prog.kurang) + ' lagi'}</span><span class="amt">${prog.persen}%</span></div>
             </div>`
          : ''
      }

      <div class="section-head">
        <h2>Transaksi Terbaru</h2>
        <a href="#" data-goto="transaksi">Lihat semua</a>
      </div>
      <div class="card">${listHtml}</div>
    `;
  }

  // ================================================================
  //  HALAMAN: TRANSAKSI
  // ================================================================
  let filterJenis = 'semua';

  function renderTransaksi() {
    let txs = DB.getTransaksi();
    if (filterJenis !== 'semua') txs = txs.filter((t) => t.jenis === filterJenis);

    const chips = `
      <div class="chips">
        ${['semua', 'pemasukan', 'pengeluaran']
          .map(
            (f) =>
              `<button class="chip ${filterJenis === f ? 'on' : ''}" data-filter="${f}">${
                f === 'semua' ? 'Semua' : f === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'
              }</button>`
          )
          .join('')}
      </div>`;

    const list = txs.length
      ? `<div class="card">${txs.map(txRow).join('')}</div>`
      : emptyState('📒', 'Belum ada transaksi', 'Catat pemasukan atau pengeluaranmu.');

    view.innerHTML = chips + list;
  }

  function txRow(t) {
    const akun = DB.getAccount(t.akunId);
    const masuk = t.jenis === 'pemasukan';
    return `
      <div class="tx-item">
        <div class="tx-ico">${akun ? akun.ikon : '📦'}</div>
        <div class="tx-body">
          <div class="tx-title">${esc(akun ? akun.nama : 'Lainnya')}</div>
          <div class="tx-meta">${tanggalPendek(t.tanggal)}${
      t.catatan ? ' • ' + esc(t.catatan) : ''
    }</div>
        </div>
        <div class="tx-amt ${masuk ? 'in' : 'out'}">${masuk ? '+' : '-'}${rupiah(t.jumlah).replace('-', '')}</div>
        <button class="tx-del" data-del="${t.id}" title="Hapus">🗑️</button>
      </div>`;
  }

  // ================================================================
  //  HALAMAN: TABUNGAN & TARGET
  // ================================================================
  function renderTabungan() {
    const set = s();
    const prog = Tabungan.progres(set);
    const budget = Tabungan.statusBudget(set);

    view.innerHTML = `
      <div class="card card-pad">
        <h2 style="margin-bottom:4px">🐷 Tabunganku</h2>
        <p style="color:var(--muted);font-size:.84rem">Total uang yang sudah kamu setor ke tabungan, dihitung otomatis dari kategori "Setor Tabungan".</p>

        <div class="divider"></div>

        <div class="row total"><span class="lbl">Total Tabungan</span><span class="amt pos">${rupiah(prog.terkumpul)}</span></div>

        ${
          prog.target > 0
            ? `
          <div class="row"><span class="lbl">Target<small>${esc(prog.namaTarget || 'Tanpa nama')}</small></span><span class="amt">${rupiah(prog.target)}</span></div>
          <div class="progress"><span style="width:${prog.persen}%"></span></div>
          <div class="row"><span class="lbl">${prog.tercapai ? '🎉 Target tercapai!' : 'Kurang ' + rupiah(prog.kurang) + ' lagi'}</span><span class="amt">${prog.persen}%</span></div>
        `
            : `<div class="note">Belum ada target menabung. Tentukan targetmu di bawah agar lebih semangat menabung!</div>`
        }

        <button class="btn gold" style="margin-top:14px" id="setorTabungan">Setor ke Tabungan</button>
      </div>

      <div class="card card-pad" style="margin-top:12px">
        <h2 style="margin-bottom:8px">🎯 Target Menabung</h2>
        <label class="field"><span>Nama target</span>
          <input type="text" id="setNamaTarget" value="${esc(set.namaTarget)}" placeholder="mis. Beli sepatu baru" />
        </label>
        <label class="field"><span>Jumlah target (${set.mataUang})</span>
          <input type="number" id="setTargetTabungan" value="${set.targetTabungan || ''}" min="0" placeholder="0" />
        </label>
        <button class="btn" id="simpanTarget">Simpan Target</button>
      </div>

      <div class="card card-pad" style="margin-top:12px">
        <h2 style="margin-bottom:8px">💡 Budget Harian</h2>
        <p style="color:var(--muted);font-size:.84rem;margin-bottom:10px">Tetapkan batas pengeluaran per hari agar uang saku cukup sampai akhir.</p>
        ${
          budget.budget > 0
            ? `
          <div class="row"><span class="lbl">Terpakai hari ini</span><span class="amt ${budget.lebih ? 'neg' : ''}">${rupiah(budget.terpakai)}</span></div>
          <div class="progress"><span style="width:${budget.persen}%"></span></div>
          <div class="row"><span class="lbl">${budget.lebih ? '⚠️ Melebihi budget' : 'Sisa budget hari ini'}</span><span class="amt ${budget.lebih ? 'neg' : 'pos'}">${rupiah(budget.sisa)}</span></div>
        `
            : ''
        }
        <label class="field" style="margin-top:10px"><span>Budget per hari (${set.mataUang})</span>
          <input type="number" id="setBudgetHarian" value="${set.budgetHarian || ''}" min="0" placeholder="0" />
        </label>
        <button class="btn" id="simpanBudget">Simpan Budget</button>
      </div>
    `;
  }

  // ================================================================
  //  HALAMAN: LAPORAN
  // ================================================================
  function renderLaporan() {
    const lr = Laporan.labaRugi();
    const nr = Laporan.neraca();
    const ak = Laporan.arusKas();
    const akun = DB.getAccounts();

    const barisAkun = (jenis) =>
      akun
        .filter((a) => a.jenis === jenis && lr.perAkun[a.id])
        .map((a) => {
          const v = jenis === 'pemasukan' ? lr.perAkun[a.id].masuk : lr.perAkun[a.id].keluar;
          return `<div class="row"><span class="lbl">${a.ikon} ${esc(a.nama)}</span><span class="amt">${rupiah(v)}</span></div>`;
        })
        .join('') || `<div class="row"><span class="lbl" style="color:var(--muted)">Belum ada</span></div>`;

    view.innerHTML = `
      <div class="section-head"><h2>📈 Laba Rugi</h2></div>
      <div class="card card-pad">
        <div style="color:var(--muted);font-size:.78rem;margin-bottom:6px">PEMASUKAN</div>
        ${barisAkun('pemasukan')}
        <div class="row total"><span class="lbl">Total Pemasukan</span><span class="amt pos">${rupiah(lr.pemasukan)}</span></div>
        <div class="divider"></div>
        <div style="color:var(--muted);font-size:.78rem;margin-bottom:6px">PENGELUARAN</div>
        ${barisAkun('pengeluaran')}
        <div class="row total"><span class="lbl">Total Pengeluaran</span><span class="amt neg">${rupiah(lr.pengeluaran)}</span></div>
        <div class="row total"><span class="lbl">Selisih (Surplus/Defisit)</span><span class="amt ${lr.selisih>=0?'pos':'neg'}">${rupiah(lr.selisih)}</span></div>
      </div>

      <div class="section-head"><h2>💰 Ringkasan Saldo</h2></div>
      <div class="card card-pad">
        <div class="row"><span class="lbl">Total Uang Masuk</span><span class="amt pos">${rupiah(ak.masuk)}</span></div>
        <div class="row"><span class="lbl">Total Uang Keluar</span><span class="amt neg">${rupiah(ak.keluar)}</span></div>
        <div class="row"><span class="lbl">Total Tabungan</span><span class="amt">${rupiah(Tabungan.totalTabungan())}</span></div>
        <div class="row total"><span class="lbl">Sisa Uang Saku</span><span class="amt pos">${rupiah(nr.kekayaanBersih)}</span></div>
      </div>

      <button class="btn ghost" id="exportData" style="margin-top:16px">⬇️ Ekspor Data (JSON)</button>
      <button class="btn danger" id="resetData" style="margin-top:4px">🗑️ Reset Semua Data</button>
    `;
  }

  // ================================================================
  //  FORM TRANSAKSI
  // ================================================================
  function formTransaksi(preset) {
    const akun = DB.getAccounts();
    const jenis = (preset && preset.jenis) || 'pengeluaran';
    const opsiAkun = (j) =>
      akun
        .filter((a) => a.jenis === j)
        .map((a) => `<option value="${a.id}">${a.ikon} ${esc(a.nama)}</option>`)
        .join('');

    const today = new Date().toISOString().slice(0, 10);

    openModal(`
      <h3>Tambah Transaksi</h3>
      <p class="sub">Catat uang masuk (uang saku) atau uang keluar (jajan, dll).</p>

      <div class="seg">
        <button type="button" class="segbtn in ${jenis==='pemasukan'?'on':''}" data-jenis="pemasukan">⬆️ Uang Masuk</button>
        <button type="button" class="segbtn out ${jenis==='pengeluaran'?'on':''}" data-jenis="pengeluaran">⬇️ Uang Keluar</button>
      </div>

      <label class="field"><span>Jumlah (${s().mataUang})</span>
        <input type="number" id="fJumlah" inputmode="numeric" placeholder="0" min="0" />
      </label>

      <label class="field"><span>Akun / Kategori</span>
        <select id="fAkun">${opsiAkun(jenis)}</select>
      </label>

      <label class="field"><span>Tanggal</span>
        <input type="date" id="fTanggal" value="${today}" />
      </label>

      <label class="field"><span>Catatan (opsional)</span>
        <textarea id="fCatatan" placeholder="mis. jajan, uang saku bulan ini..."></textarea>
      </label>

      <button class="btn" id="fSimpan">Simpan</button>
      <button class="btn ghost" id="fBatal">Batal</button>
    `);

    let jenisAktif = jenis;
    const akunSel = modal.querySelector('#fAkun');

    modal.querySelectorAll('.segbtn').forEach((b) => {
      b.addEventListener('click', () => {
        jenisAktif = b.dataset.jenis;
        modal.querySelectorAll('.segbtn').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        akunSel.innerHTML = opsiAkun(jenisAktif);
      });
    });

    if (preset && preset.akunId) akunSel.value = preset.akunId;

    modal.querySelector('#fBatal').addEventListener('click', closeModal);
    modal.querySelector('#fSimpan').addEventListener('click', () => {
      const jumlah = Number(modal.querySelector('#fJumlah').value);
      if (!jumlah || jumlah <= 0) return toast('Masukkan jumlah yang valid.');
      const tgl = modal.querySelector('#fTanggal').value;
      DB.tambahTransaksi({
        jenis: jenisAktif,
        akunId: akunSel.value,
        jumlah,
        tanggal: tgl ? new Date(tgl).toISOString() : new Date().toISOString(),
        catatan: modal.querySelector('#fCatatan').value
      });
      closeModal();
      toast('Transaksi tersimpan ✅');
      render(currentPage);
    });

    setTimeout(() => modal.querySelector('#fJumlah').focus(), 150);
  }

  // ---------- Empty state ----------
  function emptyState(ico, title, sub) {
    return `<div class="empty"><div class="big">${ico}</div><div><b>${title}</b></div><div style="font-size:.85rem;margin-top:4px">${sub}</div></div>`;
  }

  // ================================================================
  //  EVENT DELEGATION (klik di dalam view)
  // ================================================================
  view.addEventListener('click', (e) => {
    const del = e.target.closest('[data-del]');
    if (del) {
      if (confirm('Hapus transaksi ini?')) {
        DB.hapusTransaksi(del.dataset.del);
        toast('Transaksi dihapus.');
        render(currentPage);
      }
      return;
    }

    const goto = e.target.closest('[data-goto]');
    if (goto) {
      e.preventDefault();
      navigate(goto.dataset.goto);
      return;
    }

    const filter = e.target.closest('[data-filter]');
    if (filter) {
      filterJenis = filter.dataset.filter;
      renderTransaksi();
      return;
    }

    // ---- Tabungan & Target ----
    if (e.target.id === 'setorTabungan') {
      formTransaksi({ jenis: 'pengeluaran', akunId: 'tabungan' });
    }
    if (e.target.id === 'simpanTarget') {
      const nama = document.getElementById('setNamaTarget').value.trim();
      const target = Number(document.getElementById('setTargetTabungan').value) || 0;
      DB.setSettings({ namaTarget: nama, targetTabungan: target });
      toast('Target menabung disimpan.');
      renderTabungan();
    }
    if (e.target.id === 'simpanBudget') {
      const budget = Number(document.getElementById('setBudgetHarian').value) || 0;
      DB.setSettings({ budgetHarian: budget });
      toast('Budget harian disimpan.');
      renderTabungan();
    }

    // ---- Laporan ----
    if (e.target.id === 'exportData') {
      const blob = new Blob([DB.exportJSON()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'imnote-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      toast('Data diekspor.');
    }
    if (e.target.id === 'resetData') {
      if (confirm('Yakin menghapus SEMUA data? Tindakan ini tidak bisa dibatalkan.')) {
        DB.resetSemua();
        toast('Semua data direset.');
        render(currentPage);
      }
    }
  });

  // ================================================================
  //  NAVIGASI
  // ================================================================
  const PAGES = {
    beranda: { title: "I'mNote", render: renderBeranda },
    transaksi: { title: 'Transaksi', render: renderTransaksi },
    tabungan: { title: 'Tabungan & Target', render: renderTabungan },
    laporan: { title: 'Laporan Keuangan', render: renderLaporan }
  };

  function render(page) {
    (PAGES[page] || PAGES.beranda).render();
  }

  function navigate(page) {
    if (!PAGES[page]) page = 'beranda';
    currentPage = page;
    pageTitle.textContent = PAGES[page].title;
    document.querySelectorAll('.nav-item').forEach((n) =>
      n.classList.toggle('active', n.dataset.page === page)
    );
    render(page);
    view.scrollTo && window.scrollTo(0, 0);
  }

  return { navigate, formTransaksi, toast, render, get currentPage() { return currentPage; } };
})();
