-- =====================================================================
--  schema.sql — Skema & keamanan database Supabase untuk aplikasi I'MNote.
--
--  Cara menjalankan:
--    Supabase Dashboard > SQL Editor > New query > tempel SELURUH isi
--    file ini > Run. Aman dijalankan berulang (idempotent).
--
--  Yang disiapkan:
--    1. Tabel profil user (otomatis terisi saat user mendaftar).
--    2. Tabel data per-user: transaksi & pengaturan.
--    3. Row Level Security (RLS) AKTIF di setiap tabel.
--    4. Policy: tiap user HANYA bisa mengakses barisnya sendiri.
--    5. Trigger otomatis: buat profil saat daftar + perbarui kolom waktu.
--
--  Catatan:
--    - Tabel akun (auth.users) dikelola otomatis oleh Supabase Auth,
--      tidak perlu dibuat manual.
--    - Fitur LOGIN dasar sudah berjalan tanpa tabel ini. Tabel ini
--      diperlukan bila ingin menyimpan data tiap user di cloud.
--    - Semua akses memakai anon key dari frontend; keamanan dijamin RLS.
-- =====================================================================


-- =====================================================================
--  0) EXTENSION
--     gen_random_uuid() tersedia lewat ekstensi pgcrypto.
-- =====================================================================
create extension if not exists pgcrypto;


-- =====================================================================
--  1) FUNGSI BANTU: perbarui kolom waktu "diubah_pada" otomatis.
-- =====================================================================
create or replace function public.set_diubah_pada()
returns trigger
language plpgsql
as $$
begin
  new.diubah_pada = now();
  return new;
end;
$$;


-- =====================================================================
--  2) TABEL: profil (1 baris per user)
--     Dibuat otomatis saat user mendaftar (lihat trigger di bagian 6).
-- =====================================================================
create table if not exists public.profil (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  nama        text default '',
  avatar_url  text default '',
  dibuat_pada timestamptz not null default now(),
  diubah_pada timestamptz not null default now()
);

-- Migrasi ringan: tambah kolom bila tabel sudah pernah dibuat tanpa avatar_url.
alter table public.profil add column if not exists avatar_url text default '';


-- =====================================================================
--  3) TABEL: transaksi (banyak baris per user)
-- =====================================================================
create table if not exists public.transaksi (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  tanggal     timestamptz not null default now(),
  jenis       text not null check (jenis in ('pemasukan', 'pengeluaran')),
  akun_id     text not null,
  jumlah      numeric(14,2) not null check (jumlah >= 0),
  catatan     text default '',
  dibuat_pada timestamptz not null default now()
);

create index if not exists idx_transaksi_user    on public.transaksi (user_id);
create index if not exists idx_transaksi_tanggal on public.transaksi (user_id, tanggal desc);


-- =====================================================================
--  4) TABEL: pengaturan (1 baris per user)
-- =====================================================================
create table if not exists public.pengaturan (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  mata_uang       text default 'Rp',
  tema            text default 'terang',
  target_tabungan numeric(14,2) default 0,
  nama_target     text default '',
  budget_harian   numeric(14,2) default 0,
  diubah_pada     timestamptz not null default now()
);


-- =====================================================================
--  5) ROW LEVEL SECURITY — WAJIB AKTIF
--     Tanpa ini, anon key bisa membaca semua baris. Dengan ini, tiap
--     user hanya bisa mengakses data miliknya (auth.uid() = pemilik).
-- =====================================================================
alter table public.profil      enable row level security;
alter table public.transaksi   enable row level security;
alter table public.pengaturan  enable row level security;

-- ---------- Policy: profil ----------
drop policy if exists "profil_select_sendiri" on public.profil;
create policy "profil_select_sendiri"
  on public.profil for select
  using (auth.uid() = id);

drop policy if exists "profil_insert_sendiri" on public.profil;
create policy "profil_insert_sendiri"
  on public.profil for insert
  with check (auth.uid() = id);

drop policy if exists "profil_update_sendiri" on public.profil;
create policy "profil_update_sendiri"
  on public.profil for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------- Policy: transaksi ----------
drop policy if exists "transaksi_select_sendiri" on public.transaksi;
create policy "transaksi_select_sendiri"
  on public.transaksi for select
  using (auth.uid() = user_id);

drop policy if exists "transaksi_insert_sendiri" on public.transaksi;
create policy "transaksi_insert_sendiri"
  on public.transaksi for insert
  with check (auth.uid() = user_id);

drop policy if exists "transaksi_update_sendiri" on public.transaksi;
create policy "transaksi_update_sendiri"
  on public.transaksi for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "transaksi_delete_sendiri" on public.transaksi;
create policy "transaksi_delete_sendiri"
  on public.transaksi for delete
  using (auth.uid() = user_id);

-- ---------- Policy: pengaturan ----------
drop policy if exists "pengaturan_select_sendiri" on public.pengaturan;
create policy "pengaturan_select_sendiri"
  on public.pengaturan for select
  using (auth.uid() = user_id);

drop policy if exists "pengaturan_insert_sendiri" on public.pengaturan;
create policy "pengaturan_insert_sendiri"
  on public.pengaturan for insert
  with check (auth.uid() = user_id);

drop policy if exists "pengaturan_update_sendiri" on public.pengaturan;
create policy "pengaturan_update_sendiri"
  on public.pengaturan for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- =====================================================================
--  6) TRIGGER: buat profil otomatis saat user baru mendaftar.
--     Dijalankan setelah baris baru masuk ke auth.users.
-- =====================================================================
create or replace function public.handle_user_baru()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profil (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_baru on auth.users;
create trigger on_auth_user_baru
  after insert on auth.users
  for each row execute function public.handle_user_baru();


-- =====================================================================
--  7) TRIGGER: perbarui kolom "diubah_pada" otomatis saat update.
-- =====================================================================
drop trigger if exists trg_profil_diubah on public.profil;
create trigger trg_profil_diubah
  before update on public.profil
  for each row execute function public.set_diubah_pada();

drop trigger if exists trg_pengaturan_diubah on public.pengaturan;
create trigger trg_pengaturan_diubah
  before update on public.pengaturan
  for each row execute function public.set_diubah_pada();


-- =====================================================================
--  8) STORAGE: bucket "avatar" untuk foto profil + policy aman.
--
--     Keamanan foto profil:
--     - Bucket PUBLIC untuk dibaca (agar <img> bisa menampilkannya),
--       tetapi UPLOAD/UBAH/HAPUS hanya boleh oleh pemilik file.
--     - File WAJIB diletakkan di folder bernama user id:  <uid>/namafile
--       Policy memastikan folder (segmen pertama path) = auth.uid(),
--       sehingga user TIDAK bisa menimpa / menghapus foto user lain.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('avatar', 'avatar', true)
on conflict (id) do update set public = true;

-- Siapa pun boleh MEMBACA foto (bucket publik untuk tampilan <img>).
drop policy if exists "avatar_baca_publik" on storage.objects;
create policy "avatar_baca_publik"
  on storage.objects for select
  using (bucket_id = 'avatar');

-- UPLOAD hanya ke folder milik sendiri (segmen pertama path = uid).
drop policy if exists "avatar_upload_sendiri" on storage.objects;
create policy "avatar_upload_sendiri"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatar'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- UBAH (replace) hanya file milik sendiri.
drop policy if exists "avatar_update_sendiri" on storage.objects;
create policy "avatar_update_sendiri"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatar'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatar'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- HAPUS hanya file milik sendiri.
drop policy if exists "avatar_hapus_sendiri" on storage.objects;
create policy "avatar_hapus_sendiri"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatar'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
