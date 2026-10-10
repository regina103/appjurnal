/* =====================================================================
   ui.js — Render antarmuka & interaksi.
   Semua halaman (beranda, transaksi, zakat, laporan) dirender di sini.
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
    const sosial = Laporan.ringkasanSosial();
    const txs = DB.getTransaksi().slice(0, 5);

    const listHtml = txs.length
      ? txs.map(txRow).join('')
      : emptyState('📝', 'Belum ada transaksi', 'Tekan tombol + untuk mencatat.');

    view.innerHTML = `
      <div class="balance-card">
        <div class="label">Saldo (Dana Halal)</div>
        <div class="amount">${rupiah(n.kekayaanBersih)}</div>
        <div class="balance-sub">
          <div class="pill"><small>Pemasukan</small><b>${rupiah(arus.masuk)}</b></div>
          <div class="pill"><small>Pengeluaran</small><b>${rupiah(arus.keluar)}</b></div>
        </div>
      </div>

      ${
        n.kasNonHalal > 0
          ? `<div class="note warn">⚠️ Dana non-halal tercatat <b>${rupiah(
              n.kasNonHalal
            )}</b>. Secara syariah dana ini bukan hak milik dan dianjurkan disalurkan untuk kemaslahatan umum (bukan diniatkan sedekah).</div>`
          : ''
      }

      <div class="summary-grid">
        <div class="stat">
          <div class="ico">🤲</div>
          <div class="val">${rupiah(sosial.total)}</div>
          <div class="cap">Total ZIS & Wakaf</div>
        </div>
        <div class="stat">
          <div class="ico">📅</div>
          <div class="val">${arus.jumlahTransaksi}</div>
          <div class="cap">Total transaksi</div>
        </div>
      </div>

      <div class="section-head">
        <h2>Dana Sosial</h2>
      </div>
      <div class="social-grid">
        <div class="social-tile zakat"><div class="s-ico">🕌</div><div class="s-lbl">Zakat</div><div class="s-amt">${rupiah(sosial.zakat)}</div></div>
        <div class="social-tile infak"><div class="s-ico">🤲</div><div class="s-lbl">Infak</div><div class="s-amt">${rupiah(sosial.infak)}</div></div>
        <div class="social-tile sedekah"><div class="s-ico">❤️</div><div class="s-lbl">Sedekah</div><div class="s-amt">${rupiah(sosial.sedekah)}</div></div>
        <div class="social-tile wakaf"><div class="s-ico">🏛️</div><div class="s-lbl">Wakaf</div><div class="s-amt">${rupiah(sosial.wakaf)}</div></div>
      </div>

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
    const nonhalal = t.dana === 'nonhalal';
    return `
      <div class="tx-item">
        <div class="tx-ico">${akun ? akun.ikon : '📦'}</div>
        <div class="tx-body">
          <div class="tx-title">${esc(akun ? akun.nama : 'Lainnya')}${
      nonhalal ? '<span class="badge warn">non-halal</span>' : ''
    }</div>
          <div class="tx-meta">${tanggalPendek(t.tanggal)}${
      t.catatan ? ' • ' + esc(t.catatan) : ''
    }</div>
        </div>
        <div class="tx-amt ${masuk ? 'in' : 'out'}">${masuk ? '+' : '-'}${rupiah(t.jumlah).replace('-', '')}</div>
        <button class="tx-del" data-del="${t.id}" title="Hapus">🗑️</button>
      </div>`;
  }

  // ================================================================
  //  HALAMAN: ZAKAT
  // ================================================================
  function renderZakat() {
    const set = s();
    const harta = Zakat.hartaHalalSaatIni();
    const h = Zakat.hitung(harta, set);
    const haul = Zakat.statusHaul(set.haulMulai);

    view.innerHTML = `
      <div class="card card-pad">
        <h2 style="margin-bottom:4px">Kalkulator Zakat Maal</h2>
        <p style="color:var(--muted);font-size:.84rem">Zakat harta 2,5% bila mencapai nisab (85 gram emas) dan telah dimiliki 1 tahun (haul).</p>

        <div class="divider"></div>

        <div class="row"><span class="lbl">Harta halal saat ini<small>otomatis dari transaksi</small></span><span class="amt">${rupiah(harta)}</span></div>
        <div class="row"><span class="lbl">Nilai nisab<small>${set.nisabGram} gram × ${rupiah(set.hargaEmasPerGram)}</small></span><span class="amt">${rupiah(h.nisab)}</span></div>
        <div class="row total"><span class="lbl">Status</span><span class="amt ${h.wajib ? 'pos' : ''}">${
      h.wajib ? '✅ Mencapai nisab' : '➖ Belum mencapai nisab'
    }</span></div>

        ${
          h.wajib
            ? `<div class="note">Perkiraan zakat yang perlu dikeluarkan: <b>${rupiah(h.jumlahZakat)}</b> (${h.persen}%).</div>
               <button class="btn gold" style="margin-top:14px" id="bayarZakat">Catat Pembayaran Zakat</button>`
            : `<div class="note warn">Hartamu masih kurang ${rupiah(h.kurang)} untuk mencapai nisab. Zakat belum wajib.</div>`
        }
      </div>

      <div class="card card-pad" style="margin-top:12px">
        <h2 style="margin-bottom:8px">Haul (perhitungan 1 tahun)</h2>
        ${
          haul.aktif
            ? `
          <div class="row"><span class="lbl">Mulai haul</span><span class="amt">${tanggalPendek(set.haulMulai)}</span></div>
          <div class="progress"><span style="width:${haul.persen}%"></span></div>
          <div class="row"><span class="lbl">Berjalan ${haul.hariBerjalan} hari</span><span class="amt">${haul.persen}%</span></div>
          ${
            haul.selesai
              ? `<div class="note">🎉 Haul telah genap 1 tahun. Jika harta mencapai nisab, zakat sudah waktunya ditunaikan.</div>`
              : `<div class="note">⏳ Sisa ${haul.hariSisa} hari lagi menuju haul (± ${Zakat.HARI_HAUL} hari / 1 tahun hijriah).</div>`
          }
          <button class="btn ghost" id="resetHaul">Atur ulang tanggal haul</button>
        `
            : `
          <p style="color:var(--muted);font-size:.84rem;margin-bottom:12px">Tandai kapan hartamu mulai mencapai nisab untuk menghitung haul.</p>
          <button class="btn" id="mulaiHaul">Mulai Hitung Haul Hari Ini</button>
        `
        }
      </div>

      <div class="card card-pad" style="margin-top:12px">
        <h2 style="margin-bottom:8px">Pengaturan Nisab</h2>
        <label class="field"><span>Harga emas per gram (Rp)</span>
          <input type="number" id="setHargaEmas" value="${set.hargaEmasPerGram}" min="0" />
        </label>
        <label class="field"><span>Nisab (gram emas)</span>
          <input type="number" id="setNisab" value="${set.nisabGram}" min="1" />
        </label>
        <button class="btn" id="simpanNisab">Simpan Pengaturan</button>
        <div class="mini-note">Perbarui harga emas sesuai kondisi terkini agar perhitungan akurat.</div>
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

      <div class="section-head"><h2>⚖️ Neraca</h2></div>
      <div class="card card-pad">
        <div class="row"><span class="lbl">Kas Dana Halal</span><span class="amt">${rupiah(nr.kasHalal)}</span></div>
        <div class="row"><span class="lbl">Kas Dana Non-Halal<small>disalurkan, bukan hak milik</small></span><span class="amt">${rupiah(nr.kasNonHalal)}</span></div>
        <div class="row total"><span class="lbl">Total Aset</span><span class="amt">${rupiah(nr.totalAset)}</span></div>
        <div class="row"><span class="lbl">Kekayaan Bersih (halal)</span><span class="amt pos">${rupiah(nr.kekayaanBersih)}</span></div>
      </div>

      <div class="section-head"><h2>💧 Arus Kas</h2></div>
      <div class="card card-pad">
        <div class="row"><span class="lbl">Kas Masuk</span><span class="amt pos">${rupiah(ak.masuk)}</span></div>
        <div class="row"><span class="lbl">Kas Keluar</span><span class="amt neg">${rupiah(ak.keluar)}</span></div>
        <div class="row total"><span class="lbl">Arus Kas Bersih</span><span class="amt ${ak.arusBersih>=0?'pos':'neg'}">${rupiah(ak.arusBersih)}</span></div>
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
      <p class="sub">Catat pemasukan atau pengeluaran keuanganmu.</p>

      <div class="seg">
        <button type="button" class="segbtn in ${jenis==='pemasukan'?'on':''}" data-jenis="pemasukan">⬆️ Pemasukan</button>
        <button type="button" class="segbtn out ${jenis==='pengeluaran'?'on':''}" data-jenis="pengeluaran">⬇️ Pengeluaran</button>
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

    // ---- Zakat ----
    if (e.target.id === 'mulaiHaul') {
      DB.setSettings({ haulMulai: new Date().toISOString() });
      toast('Haul mulai dihitung hari ini.');
      renderZakat();
    }
    if (e.target.id === 'resetHaul') {
      DB.setSettings({ haulMulai: new Date().toISOString() });
      toast('Tanggal haul diperbarui.');
      renderZakat();
    }
    if (e.target.id === 'simpanNisab') {
      const harga = Number(document.getElementById('setHargaEmas').value) || 0;
      const nisab = Number(document.getElementById('setNisab').value) || 85;
      DB.setSettings({ hargaEmasPerGram: harga, nisabGram: nisab });
      toast('Pengaturan nisab disimpan.');
      renderZakat();
    }
    if (e.target.id === 'bayarZakat') {
      const harta = Zakat.hartaHalalSaatIni();
      const h = Zakat.hitung(harta);
      formTransaksi({ jenis: 'pengeluaran', akunId: 'zakat' });
      setTimeout(() => {
        const f = document.getElementById('fJumlah');
        if (f) f.value = h.jumlahZakat;
      }, 180);
    }

    // ---- Laporan ----
    if (e.target.id === 'exportData') {
      const blob = new Blob([DB.exportJSON()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jurnal-syariah-' + new Date().toISOString().slice(0, 10) + '.json';
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
    beranda: { title: 'Jurnal Syariah', render: renderBeranda },
    transaksi: { title: 'Transaksi', render: renderTransaksi },
    zakat: { title: 'Zakat & Haul', render: renderZakat },
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
