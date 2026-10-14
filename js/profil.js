/* =====================================================================
   profil.js — Kelola data profil user (nama & foto) via Supabase.

   Keamanan:
   - Semua akses lewat anon key + sesi login user. RLS di tabel "profil"
     memastikan user hanya bisa baca/ubah barisnya sendiri.
   - Foto diunggah ke bucket "avatar" di folder <user_id>/..., sehingga
     policy Storage mencegah user menimpa foto user lain.
   - Validasi tipe & ukuran file dilakukan sebelum upload.

   Mengekspos window.Profil:
   - ambil()                 -> { id, email, nama, avatar_url } | null
   - simpanNama(nama)        -> { ok, pesan }
   - unggahFoto(file)        -> { ok, pesan, url }
   ===================================================================== */

const Profil = (() => {
  const BUCKET = 'avatar';
  const MAKS_BYTE = 2 * 1024 * 1024; // 2 MB
  const TIPE_OK = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  function sb() {
    return window.SB && window.SB.client ? window.SB.client : null;
  }

  async function userId() {
    const u = await Auth.userSekarang();
    return u ? u.id : null;
  }

  // Ambil baris profil milik user yang sedang login.
  async function ambil() {
    const c = sb();
    if (!c) return null;
    const uid = await userId();
    if (!uid) return null;
    try {
      const { data, error } = await c
        .from('profil')
        .select('id, email, nama, avatar_url')
        .eq('id', uid)
        .maybeSingle();
      if (error) {
        console.warn('[Profil] gagal ambil:', error.message);
        return null;
      }

      // Sinkronisasi: bila nama di tabel kosong tapi tersimpan di metadata
      // saat daftar, isi otomatis sekali.
      if (data && (!data.nama || !data.nama.trim())) {
        const u = await Auth.userSekarang();
        const namaMeta =
          u && u.user_metadata && u.user_metadata.nama
            ? String(u.user_metadata.nama).trim()
            : '';
        if (namaMeta) {
          await c.from('profil').upsert({ id: uid, nama: namaMeta }, { onConflict: 'id' });
          data.nama = namaMeta;
        }
      }
      return data || null;
    } catch (e) {
      console.warn('[Profil] error:', e);
      return null;
    }
  }

  // Simpan / perbarui nama. Pakai upsert agar aman walau baris belum ada.
  async function simpanNama(nama) {
    const c = sb();
    if (!c) return { ok: false, pesan: 'Backend belum siap.' };
    const uid = await userId();
    if (!uid) return { ok: false, pesan: 'Sesi tidak ditemukan. Masuk lagi.' };

    const bersih = String(nama || '').trim().slice(0, 60);
    try {
      const { error } = await c
        .from('profil')
        .upsert({ id: uid, nama: bersih }, { onConflict: 'id' });
      if (error) return { ok: false, pesan: error.message };
      return { ok: true, pesan: 'Nama tersimpan.' };
    } catch (e) {
      return { ok: false, pesan: 'Gagal menyimpan nama.' };
    }
  }

  // Unggah foto profil ke Storage lalu simpan URL-nya ke profil.
  async function unggahFoto(file) {
    const c = sb();
    if (!c) return { ok: false, pesan: 'Backend belum siap.' };
    const uid = await userId();
    if (!uid) return { ok: false, pesan: 'Sesi tidak ditemukan. Masuk lagi.' };

    if (!file) return { ok: false, pesan: 'Tidak ada file dipilih.' };
    if (!TIPE_OK.includes(file.type))
      return { ok: false, pesan: 'Format harus JPG, PNG, WEBP, atau GIF.' };
    if (file.size > MAKS_BYTE)
      return { ok: false, pesan: 'Ukuran foto maksimal 2 MB.' };

    // Nama file di dalam folder milik user. Timestamp agar cache ter-refresh.
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${uid}/profil_${Date.now()}.${ext || 'jpg'}`;

    try {
      const { error: upErr } = await c.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) return { ok: false, pesan: 'Gagal mengunggah: ' + upErr.message };

      const { data: pub } = c.storage.from(BUCKET).getPublicUrl(path);
      const url = pub ? pub.publicUrl : '';

      const { error: dbErr } = await c
        .from('profil')
        .upsert({ id: uid, avatar_url: url }, { onConflict: 'id' });
      if (dbErr) return { ok: false, pesan: 'Foto terunggah tapi gagal disimpan.' };

      return { ok: true, pesan: 'Foto profil diperbarui.', url };
    } catch (e) {
      return { ok: false, pesan: 'Gagal mengunggah foto.' };
    }
  }

  return { ambil, simpanNama, unggahFoto };
})();
