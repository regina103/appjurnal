-- =====================================================================
--  schema.sql — Skema & keamanan database Supabase untuk Jurnal Siswa.
--
--  Jalankan isi file ini di Supabase Dashboard:
--    Project > SQL Editor > New query > tempel semua > Run.
--
--  Yang disiapkan:
--    1. Tabel data per-user (transaksi, pengaturan).
--    2. Row Level Security (RLS) AKTIF di setiap tabel.
--    3. Policy: tiap user HANYA bisa melihat/mengubah barisnya sendiri.
--
--  Catatan: Tabel user (auth.users) dikelola otomatis oleh Supabase Auth,
--  tidak perlu Anda buat. File ini hanya untuk DATA aplikasi.
--  Fitur LOGIN dasar sudah berjalan tanpa tabel ini; tabel ini diperlukan
--  bila Anda ingin menyimpan transaksi tiap user di cloud.
-- =====================================================================

-- ---------- Tabel: transaksi ----------
create table if not exists public.transaksi (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  tanggal     timestamptz not null default now(),
  jenis       text not null check (jenis in ('pemasukan', 'pengeluaran')),
  akun_id     text not null,
  jumlah      numeric not null check (jumlah >= 0),
  catatan     text default '',
  dibuat_pada timestamptz not null default now()
);

create index if not exists idx_transaksi_user on public.transaksi (user_id);

-- ---------- Tabel: pengaturan (1 baris per user) ----------
create table if not exists public.pengaturan (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  mata_uang       text default 'Rp',
  tema            text default 'terang',
  target_tabungan numeric default 0,
  nama_target     text default '',
  budget_harian   numeric default 0,
  diubah_pada     timestamptz not null default now()
);

-- =====================================================================
--  ROW LEVEL SECURITY — WAJIB AKTIF
--  Tanpa ini, anon key bisa membaca semua baris. Dengan ini, tiap user
--  hanya bisa mengakses data miliknya sendiri (auth.uid() = user_id).
-- =====================================================================
alter table public.transaksi  enable row level security;
alter table public.pengaturan enable row level security;

-- --- Policy transaksi ---
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

-- --- Policy pengaturan ---
drop policy if exists "pengaturan_select_sendiri" on public.pengaturan;
create policy "pengaturan_select_sendiri"
  on public.pengaturan for select
  using (auth.uid() = user_id);

drop policy if exists "pengaturan_upsert_sendiri" on public.pengaturan;
create policy "pengaturan_upsert_sendiri"
  on public.pengaturan for insert
  with check (auth.uid() = user_id);

drop policy if exists "pengaturan_update_sendiri" on public.pengaturan;
create policy "pengaturan_update_sendiri"
  on public.pengaturan for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
