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
    const totalTabungan = Tabungan.totalTabungan();
    const sisa = Tabungan.sisaBisaDitabung();
    const kantungList = Tabungan.semuaProgres();
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
          <div class="ico">👛</div>
          <div class="val">${rupiah(totalTabungan)}</div>
          <div class="cap">Total Tabungan</div>
        </div>
        <div class="stat">
          <div class="ico">📅</div>
          <div class="val">${arus.jumlahTransaksi}</div>
          <div class="cap">Total transaksi</div>
        </div>
      </div>

      ${
        sisa > 0
          ? `<div class="note">💰 Ada sisa uang <b>${rupiah(sisa)}</b> yang belum ditabung. <a href="#" data-goto="tabungan" style="color:var(--primary);font-weight:700">Alihkan ke tabungan →</a></div>`
          : ''
      }

      ${
        kantungList.length
          ? `<div class="section-head"><h2>🎯 Kantung Tabungan</h2><a href="#" data-goto="tabungan">Kelola</a></div>
             ${kantungList
               .slice(0, 2)
               .map(
                 (k) => `<div class="card card-pad">
                   <div class="row"><span class="lbl">${esc(k.ikon)} ${esc(k.nama)}</span><span class="amt">${rupiah(k.terkumpul)}${k.target ? ' / ' + rupiah(k.target) : ''}</span></div>
                   ${k.target ? `<div class="progress"><span style="width:${k.persen}%"></span></div>` : ''}
                 </div>`
               )
               .join('')}`
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
    const total = Tabungan.totalTabungan();
    const kantungList = Tabungan.semuaProgres();
    const sisa = Tabungan.sisaBisaDitabung();
    const budget = Tabungan.statusBudget(set);

    const kartuKantung = kantungList.length
      ? kantungList
          .map(
            (k) => `
        <div class="card card-pad kantung-card">
          <div class="kantung-head">
            <span class="kantung-ikon">${esc(k.ikon)}</span>
            <div class="kantung-nama">${esc(k.nama)}</div>
            <button class="kantung-del" data-hapus-kantung="${k.id}" title="Hapus kantung">🗑️</button>
          </div>
          <div class="row"><span class="lbl">Terkumpul</span><span class="amt pos">${rupiah(k.terkumpul)}${k.target ? ' / ' + rupiah(k.target) : ''}</span></div>
          ${
            k.target
              ? `<div class="progress"><span style="width:${k.persen}%"></span></div>
                 <div class="row"><span class="lbl">${k.tercapai ? '🎉 Target tercapai!' : 'Kurang ' + rupiah(k.kurang)}</span><span class="amt">${k.persen}%</span></div>`
              : `<div class="mini-note" style="text-align:left">Tanpa target — menabung bebas.</div>`
          }
          <button class="btn gold" data-setor-kantung="${k.id}" style="margin-top:10px">Setor ke kantung ini</button>
        </div>`
          )
          .join('')
      : emptyState('👛', 'Belum ada kantung tabungan', 'Buat kantung untuk tiap tujuan menabungmu.');

    view.innerHTML = `
      <div class="card card-pad">
        <h2 style="margin-bottom:4px">👛 Tabunganku</h2>
        <p style="color:var(--muted);font-size:.84rem">Total semua kantung tabunganmu.</p>
        <div class="divider"></div>
        <div class="row total"><span class="lbl">Total Tabungan</span><span class="amt pos">${rupiah(total)}</span></div>
      </div>

      <div class="card card-pad" style="margin-top:12px">
        <h2 style="margin-bottom:4px">🔄 Alihkan Sisa Harian</h2>
        <p style="color:var(--muted);font-size:.84rem;margin-bottom:10px">Uang masuk yang belum terpakai bisa langsung dipindah jadi tabungan.</p>
        <div class="row"><span class="lbl">Sisa uang bisa ditabung</span><span class="amt ${sisa > 0 ? 'pos' : ''}">${rupiah(sisa)}</span></div>
        ${
          sisa > 0 && kantungList.length
            ? `<button class="btn" id="alihkanSisa" style="margin-top:12px">Alihkan sisa ke kantung →</button>`
            : sisa <= 0
              ? `<div class="mini-note" style="text-align:left">Belum ada sisa untuk dialihkan. Catat uang masuk dulu ya.</div>`
              : `<div class="mini-note" style="text-align:left">Buat kantung tabungan dulu untuk menampung sisa.</div>`
        }
      </div>

      <div class="section-head"><h2>🎯 Kantung Tabungan</h2><a href="#" id="tambahKantung">+ Buat</a></div>
      ${kartuKantung}

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

  // ---- Form: buat / edit kantung tabungan ----
  function formKantung() {
    openModal(`
      <h3>Buat Kantung Tabungan</h3>
      <p class="sub">Satu kantung untuk satu tujuan menabung.</p>

      <label class="field"><span>Nama tujuan</span>
        <input type="text" id="kNama" placeholder="mis. Sepatu baru, Dandurat, HP second" maxlength="40" />
      </label>

      <label class="field"><span>Ikon</span>
        <select id="kIkon">
          <option value="🎯">🎯 Target</option>
          <option value="👟">👟 Sepatu</option>
          <option value="📱">📱 Gadget</option>
          <option value="📚">📚 Buku</option>
          <option value="🚲">🚲 Sepeda</option>
          <option value="🛡️">🛡️ Darurat</option>
          <option value="🕋">🕋 Qurban/Ibadah</option>
          <option value="🎁">🎁 Hadiah</option>
        </select>
      </label>

      <label class="field"><span>Target jumlah (opsional, ${s().mataUang})</span>
        <input type="number" id="kTarget" inputmode="numeric" placeholder="0" min="0" />
      </label>

      <button class="btn" id="kSimpan">Simpan Kantung</button>
      <button class="btn ghost" id="kBatal">Batal</button>
    `);

    modal.querySelector('#kBatal').addEventListener('click', closeModal);
    modal.querySelector('#kSimpan').addEventListener('click', () => {
      const nama = modal.querySelector('#kNama').value.trim();
      if (!nama) return toast('Isi nama tujuan dulu.');
      DB.tambahKantung({
        nama,
        ikon: modal.querySelector('#kIkon').value,
        target: Number(modal.querySelector('#kTarget').value) || 0
      });
      closeModal();
      toast('Kantung tabungan dibuat ✅');
      renderTabungan();
    });
    setTimeout(() => modal.querySelector('#kNama').focus(), 150);
  }

  // ---- Form: setor ke kantung tertentu ----
  function formSetorKantung(kantungId) {
    const kantung = DB.getKantung().find((k) => k.id === kantungId);
    if (!kantung) return;

    openModal(`
      <h3>Setor ke "${esc(kantung.nama)}"</h3>
      <p class="sub">Masukkan jumlah yang ingin kamu tabung.</p>

      <label class="field"><span>Jumlah (${s().mataUang})</span>
        <input type="number" id="sJumlah" inputmode="numeric" placeholder="0" min="0" />
      </label>
      <label class="field"><span>Catatan (opsional)</span>
        <input type="text" id="sCatatan" placeholder="mis. sisa jajan hari ini" maxlength="60" />
      </label>

      <button class="btn gold" id="sSimpan">Setor</button>
      <button class="btn ghost" id="sBatal">Batal</button>
    `);

    modal.querySelector('#sBatal').addEventListener('click', closeModal);
    modal.querySelector('#sSimpan').addEventListener('click', () => {
      const jumlah = Number(modal.querySelector('#sJumlah').value);
      if (!jumlah || jumlah <= 0) return toast('Masukkan jumlah yang valid.');
      DB.tambahSetoran(kantungId, jumlah, 'manual', modal.querySelector('#sCatatan').value);
      closeModal();
      toast('Berhasil menabung ✅');
      renderTabungan();
    });
    setTimeout(() => modal.querySelector('#sJumlah').focus(), 150);
  }

  // ---- Form: alihkan sisa uang harian ke sebuah kantung ----
  function formAlihkanSisa() {
    const sisa = Tabungan.sisaBisaDitabung();
    const kantungList = DB.getKantung();
    if (sisa <= 0) return toast('Belum ada sisa untuk dialihkan.');
    if (!kantungList.length) return toast('Buat kantung tabungan dulu.');

    const opsi = kantungList
      .map((k) => `<option value="${k.id}">${esc(k.ikon)} ${esc(k.nama)}</option>`)
      .join('');

    openModal(`
      <h3>Alihkan Sisa Harian</h3>
      <p class="sub">Sisa uang yang belum terpakai: <b>${rupiah(sisa)}</b>. Pindahkan ke tabungan.</p>

      <label class="field"><span>Pilih kantung tujuan</span>
        <select id="aKantung">${opsi}</select>
      </label>
      <label class="field"><span>Jumlah dialihkan (${s().mataUang})</span>
        <input type="number" id="aJumlah" inputmode="numeric" value="${Math.round(sisa)}" min="0" max="${Math.round(sisa)}" />
      </label>

      <button class="btn" id="aSimpan">Alihkan ke Tabungan</button>
      <button class="btn ghost" id="aBatal">Batal</button>
    `);

    modal.querySelector('#aBatal').addEventListener('click', closeModal);
    modal.querySelector('#aSimpan').addEventListener('click', () => {
      let jumlah = Number(modal.querySelector('#aJumlah').value);
      if (!jumlah || jumlah <= 0) return toast('Masukkan jumlah yang valid.');
      if (jumlah > sisa) jumlah = sisa; // jangan melebihi sisa
      const kantungId = modal.querySelector('#aKantung').value;
      DB.tambahSetoran(kantungId, jumlah, 'sisa', 'Alihan sisa uang harian');
      closeModal();
      toast('Sisa harian dialihkan ke tabungan ✅');
      renderTabungan();
    });
    setTimeout(() => modal.querySelector('#aJumlah').focus(), 150);
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
  //  HALAMAN: PROFIL
  // ================================================================
  let _profilCache = null; // { id, email, nama, avatar_url }

  function inisialHuruf(nama, email) {
    const sumber = (nama && nama.trim()) || (email || '');
    return (sumber.trim()[0] || '🙂').toUpperCase();
  }

  function renderProfil() {
    const u = Pencapaian.tingkatSekarang();
    const nama = (_profilCache && _profilCache.nama) || '';
    const email = (_profilCache && _profilCache.email) || '';
    const avatar = (_profilCache && _profilCache.avatar_url) || '';

    const avatarHtml = avatar
      ? `<img src="${esc(avatar)}" alt="Foto profil" class="pf-avatar-img" />`
      : `<div class="pf-avatar-inisial">${esc(inisialHuruf(nama, email))}</div>`;

    const dotTingkat = Pencapaian.TINGKAT
      .slice()
      .reverse()
      .map(
        (t) =>
          `<div class="pf-level ${t.id === u.id ? 'aktif ' + t.warna : ''}">
             <span class="pf-level-logo">${t.logo}</span>
             <span class="pf-level-nama">${t.nama}</span>
           </div>`
      )
      .join('');

    view.innerHTML = `
      <div class="pf-head ${u.warna}">
        <div class="pf-avatar-wrap">
          ${avatarHtml}
          <button class="pf-avatar-edit" id="pfGantiFoto" title="Ganti foto">📷</button>
          <input type="file" id="pfFileFoto" accept="image/*" hidden />
        </div>
        <div class="pf-nama">${esc(nama || 'Pelajar Hebat')}</div>
        <div class="pf-email">${esc(email)}</div>
      </div>

      <div class="pf-badge ${u.warna}">
        <div class="pf-badge-logo">${u.logo}</div>
        <div class="pf-badge-info">
          <div class="pf-badge-nama">Level ${u.nama}</div>
          <div class="pf-badge-arti">${esc(u.arti)}</div>
        </div>
      </div>

      <div class="note">${esc(u.pesan)}</div>

      <div class="card card-pad" style="margin-top:12px">
        <div class="row"><span class="lbl">Total tabungan</span><span class="amt pos">${rupiah(u.total)}</span></div>
        <div class="row"><span class="lbl">Kantung tabungan aktif</span><span class="amt">${u.jumlahKantung}</span></div>
        ${
          u.berikutnya
            ? `<div class="progress"><span style="width:${
                u.berikutnya.min > 0 ? Math.min(100, Math.round((u.total / u.berikutnya.min) * 100)) : 0
              }%"></span></div>
               <div class="row"><span class="lbl">Menuju ${esc(u.berikutnya.nama)} ${u.berikutnya.logo}</span><span class="amt">kurang ${rupiah(u.sisaMenujuBerikutnya)}</span></div>`
            : `<div class="row total"><span class="lbl">Status</span><span class="amt pos">Level tertinggi tercapai 🕋</span></div>`
        }
      </div>

      <div class="card card-pad" style="margin-top:12px">
        <div style="color:var(--muted);font-size:.78rem;margin-bottom:6px">TARGET LEVEL INI</div>
        <div style="font-weight:700;margin-bottom:8px">${esc(u.target)}</div>
        <div style="color:var(--muted);font-size:.78rem;margin-bottom:4px">PENCAPAIAN</div>
        <div style="font-size:.9rem;line-height:1.5">${esc(u.realistis)}</div>
      </div>

      <div class="section-head"><h2>Semua Tingkatan</h2></div>
      <div class="pf-levels">${dotTingkat}</div>

      <div class="card card-pad" style="margin-top:12px">
        <h2 style="margin-bottom:8px">Edit Profil</h2>
        <label class="field"><span>Nama tampilan</span>
          <input type="text" id="pfNama" value="${esc(nama)}" placeholder="mis. Siti Aminah" maxlength="60" />
        </label>
        <button class="btn" id="pfSimpanNama">Simpan Nama</button>
      </div>

      <button class="btn danger" id="pfKeluar" style="margin-top:16px">🚪 Keluar dari Akun</button>
    `;

    // Muat data profil dari Supabase (sekali), lalu render ulang bila berubah.
    if (!_profilCache && window.Profil) {
      Profil.ambil().then((p) => {
        if (p) {
          _profilCache = p;
          if (currentPage === 'profil') renderProfil();
        }
      });
    }
  }

  // ================================================================
  //  FORM TRANSAKSI
  // ================================================================
  function formTransaksi(preset) {
    const akun = DB.getAccounts();
    const jenis = (preset && preset.jenis) || 'pengeluaran';
    const opsiAkun = (j) =>
      akun
        // Kategori 'tabungan' disembunyikan dari form manual; menabung
        // dilakukan lewat halaman Tabungan (kantung) agar lebih terarah.
        .filter((a) => a.jenis === j && a.id !== 'tabungan')
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

    // ---- Tabungan (kantung) ----
    if (e.target.id === 'tambahKantung') {
      e.preventDefault();
      formKantung();
      return;
    }
    const setorBtn = e.target.closest('[data-setor-kantung]');
    if (setorBtn) {
      formSetorKantung(setorBtn.dataset.setorKantung);
      return;
    }
    const hapusKantungBtn = e.target.closest('[data-hapus-kantung]');
    if (hapusKantungBtn) {
      if (confirm('Hapus kantung ini beserta riwayat setorannya?')) {
        DB.hapusKantung(hapusKantungBtn.dataset.hapusKantung);
        toast('Kantung dihapus.');
        renderTabungan();
      }
      return;
    }
    if (e.target.id === 'alihkanSisa') {
      formAlihkanSisa();
      return;
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

    // ---- Profil ----
    if (e.target.id === 'pfGantiFoto') {
      const inp = document.getElementById('pfFileFoto');
      if (inp) inp.click();
    }
    if (e.target.id === 'pfSimpanNama') {
      const nama = (document.getElementById('pfNama').value || '').trim();
      const btn = e.target;
      btn.disabled = true;
      Profil.simpanNama(nama).then((r) => {
        btn.disabled = false;
        if (r.ok) {
          _profilCache = Object.assign({}, _profilCache, { nama });
          toast('Nama tersimpan ✅');
          renderProfil();
        } else {
          toast(r.pesan || 'Gagal menyimpan.');
        }
      });
    }
    if (e.target.id === 'pfKeluar') {
      Auth.keluar();
    }
  });

  // Tangani pemilihan file foto profil (change, bukan click).
  view.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'pfFileFoto') {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      toast('Mengunggah foto...');
      Profil.unggahFoto(file).then((r) => {
        if (r.ok) {
          _profilCache = Object.assign({}, _profilCache, { avatar_url: r.url });
          toast('Foto profil diperbarui ✅');
          renderProfil();
        } else {
          toast(r.pesan || 'Gagal mengunggah foto.');
        }
      });
    }
  });

  // ================================================================
  //  NAVIGASI
  // ================================================================
  const PAGES = {
    beranda: { title: "I'MNote", render: renderBeranda },
    transaksi: { title: 'Transaksi', render: renderTransaksi },
    tabungan: { title: 'Tabungan & Target', render: renderTabungan },
    laporan: { title: 'Laporan Keuangan', render: renderLaporan },
    profil: { title: 'Profil', render: renderProfil }
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

  function resetProfilCache() {
    _profilCache = null;
  }

  return {
    navigate,
    formTransaksi,
    toast,
    render,
    resetProfilCache,
    get currentPage() {
      return currentPage;
    }
  };
})();
