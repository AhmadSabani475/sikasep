-- ==============================================================================
-- SIKASEP (Sistem Kasir Suara Enterpreneur Purwakarta)
-- Skrip SQL Seed Data Contoh Akun Demo (30 Hari Terakhir)
-- ==============================================================================
-- CARA PENGGUNAAN DI SUPABASE SQL EDITOR:
-- 1. Buka dashboard Supabase proyek Anda -> Masuk ke menu "SQL Editor".
-- 2. Email akun demo sudah dikonfigurasi langsung untuk: sikasep@gmail.com
-- 3. Salin seluruh isi berkas ini, tempel ke SQL Editor, lalu klik tombol "Run" (Ctrl+Enter / Cmd+Enter).
--
-- KEAMANAN:
-- - Skrip ini menggunakan filter ketat `store_id` milik akun demo saja.
-- - Data toko/pengguna lain TIDAK AKAN tersentuh sama sekali.
-- - Jika dijalankan ulang, menu yang sudah ada tidak akan diduplikasi.
-- ==============================================================================

-- 1. Pastikan kolom pendukung tersedia pada tabel menu_items & transactions (Aman & Idempoten)
alter table public.menu_items 
  add column if not exists category text,
  add column if not exists is_favorite boolean default false;

alter table public.transactions
  add column if not exists payment_method text default 'tunai',
  add column if not exists status text default 'selesai',
  add column if not exists source text default 'normal',
  add column if not exists cash_received numeric,
  add column if not exists change_amount numeric,
  add column if not exists updated_at timestamptz;

-- 2. Eksekusi Pengisian Data Menu dan Transaksi 30 Hari
do $$
declare
  -- ============================================================================
  -- KONFIGURASI AKUN DEMO
  -- ============================================================================
  v_demo_email text := 'sikasep@gmail.com'; 

  -- Opsi: Set ke true jika ingin membersihkan transaksi akun demo sebelumnya sebelum mengisi ulang
  v_reset_transaksi_lama boolean := false;
  -- ============================================================================

  v_user_id uuid;
  v_store_id uuid;
  v_store_name text;

  -- Menu IDs
  v_id_sate uuid;
  v_id_sop uuid;
  v_id_timbel uuid;
  v_id_kelapa uuid;
  v_id_teh uuid;
  v_id_jeruk uuid;
  v_id_kopi uuid;
  v_id_mineral uuid;

  -- Loop variables
  v_day int;
  v_tx_idx int;
  v_tx_count int;
  v_tx_time timestamptz;
  v_hour int;
  v_minute int;
  v_second int;

  v_tx_id uuid;
  v_total numeric;
  v_payment_method text;
  v_status text;
  v_source text;
  v_cash_received numeric;
  v_change_amount numeric;
  v_transcript text;

  v_basket_type int;
  v_food_name text;
  v_food_id uuid;
  v_food_price numeric;
  v_food_qty int;

  v_drink_name text;
  v_drink_id uuid;
  v_drink_price numeric;
  v_drink_qty int;

  v_drink2_name text;
  v_drink2_id uuid;
  v_drink2_price numeric;
  v_drink2_qty int;

  v_rnd int;
  v_total_tx_created int := 0;
  v_total_items_created int := 0;
  v_total_omzet numeric := 0;
begin
  -- 1. Validasi Email Akun Demo
  if v_demo_email is null or trim(v_demo_email) = '' then
    raise exception 'PERINGATAN: Email akun demo tidak boleh kosong!';
  end if;

  select id into v_user_id 
  from auth.users 
  where lower(email) = lower(trim(v_demo_email))
  limit 1;

  if v_user_id is null then
    raise exception 'Pengguna dengan email "%" tidak ditemukan di auth.users. Pastikan Anda sudah mendaftar akun tersebut di Sikasep.', v_demo_email;
  end if;

  -- 2. Dapatkan Store milik Pengguna Demo
  select id, name into v_store_id, v_store_name 
  from public.stores 
  where owner_id = v_user_id 
  limit 1;

  if v_store_id is null then
    insert into public.stores (owner_id, name)
    values (v_user_id, 'Warung Sate Maranggi Demo')
    returning id, name into v_store_id, v_store_name;
  end if;

  raise notice 'Memproses seed untuk Toko: % (ID: %)', v_store_name, v_store_id;

  -- 3. Isi / Sinkronisasi Menu Toko Demo (Lewati jika sudah ada nama yang sama)
  -- Daftar Menu Spesifikasi:
  -- Makanan:
  -- - Sate Maranggi Sapi, 35000, favorit
  -- - Sop iga, 28000
  -- - Nasi Timbel Komplit, 25000
  -- Minuman:
  -- - Es Kelapa Muda, 8000, favorit
  -- - Es Teh Manis, 5000, favorit
  -- - Es Jeruk, 7000
  -- - Kopi Hitam, 6000
  -- - Air Mineral, 4000, favorit

  insert into public.menu_items (store_id, name, price, category, is_favorite, is_active)
  select v_store_id, m.name, m.price, m.category, m.is_favorite, true
  from (
    values
      ('Sate Maranggi Sapi', 35000, 'Makanan', true),
      ('Sop iga', 28000, 'Makanan', false),
      ('Nasi Timbel Komplit', 25000, 'Makanan', false),
      ('Es Kelapa Muda', 8000, 'Minuman', true),
      ('Es Teh Manis', 5000, 'Minuman', true),
      ('Es Jeruk', 7000, 'Minuman', false),
      ('Kopi Hitam', 6000, 'Minuman', false),
      ('Air Mineral', 4000, 'Minuman', true)
  ) as m(name, price, category, is_favorite)
  where not exists (
    select 1 from public.menu_items mi
    where mi.store_id = v_store_id and lower(trim(mi.name)) = lower(trim(m.name))
  );

  -- Pastikan harga, kategori, dan is_favorite sesuai spesifikasi jika sebelumnya sudah ada
  update public.menu_items mi
  set 
    price = m.price,
    category = m.category,
    is_favorite = m.is_favorite,
    is_active = true
  from (
    values
      ('Sate Maranggi Sapi', 35000, 'Makanan', true),
      ('Sop iga', 28000, 'Makanan', false),
      ('Nasi Timbel Komplit', 25000, 'Makanan', false),
      ('Es Kelapa Muda', 8000, 'Minuman', true),
      ('Es Teh Manis', 5000, 'Minuman', true),
      ('Es Jeruk', 7000, 'Minuman', false),
      ('Kopi Hitam', 6000, 'Minuman', false),
      ('Air Mineral', 4000, 'Minuman', true)
  ) as m(name, price, category, is_favorite)
  where mi.store_id = v_store_id and lower(trim(mi.name)) = lower(trim(m.name));

  -- Ambil ID setiap menu toko demo
  select id into v_id_sate from public.menu_items where store_id = v_store_id and lower(name) = 'sate maranggi sapi' limit 1;
  select id into v_id_sop from public.menu_items where store_id = v_store_id and lower(name) = 'sop iga' limit 1;
  select id into v_id_timbel from public.menu_items where store_id = v_store_id and lower(name) = 'nasi timbel komplit' limit 1;
  select id into v_id_kelapa from public.menu_items where store_id = v_store_id and lower(name) = 'es kelapa muda' limit 1;
  select id into v_id_teh from public.menu_items where store_id = v_store_id and lower(name) = 'es teh manis' limit 1;
  select id into v_id_jeruk from public.menu_items where store_id = v_store_id and lower(name) = 'es jeruk' limit 1;
  select id into v_id_kopi from public.menu_items where store_id = v_store_id and lower(name) = 'kopi hitam' limit 1;
  select id into v_id_mineral from public.menu_items where store_id = v_store_id and lower(name) = 'air mineral' limit 1;

  -- 4. Opsi Pembersihan Transaksi Lama Toko Demo
  if v_reset_transaksi_lama then
    delete from public.transactions where store_id = v_store_id;
    raise notice 'Transaksi lama toko demo berhasil dibersihkan.';
  end if;

  -- 5. Buat Transaksi 30 Hari Terakhir (5 - 10 transaksi per hari, jam ramai 12:00 & 18:00)
  for v_day in reverse 29..0 loop
    -- Variasi 6 - 9 transaksi per hari (rata-rata 7-8 transaksi/hari)
    v_tx_count := 6 + ((v_day * 3 + 1) % 4);

    for v_tx_idx in 0..(v_tx_count - 1) loop
      -- Alokasi jam: jam ramai 12:00 (siang) dan 18:00 (malam), sisanya tersebar
      case v_tx_idx % 8
        when 0 then v_hour := 10; v_minute := 15 + ((v_day * 7 + v_tx_idx * 11) % 35); -- Pagi (10:15 - 10:50)
        when 1 then v_hour := 11; v_minute := 35 + ((v_day * 5 + v_tx_idx * 9) % 20);  -- Mulai Ramai Siang (11:35 - 11:55)
        when 2 then v_hour := 12; v_minute := 5 + ((v_day * 13 + v_tx_idx * 7) % 40);  -- Puncak Siang (12:05 - 12:45)
        when 3 then v_hour := 13; v_minute := 10 + ((v_day * 3 + v_tx_idx * 13) % 30); -- Siang (13:10 - 13:40)
        when 4 then v_hour := 15; v_minute := 20 + ((v_day * 11 + v_tx_idx * 5) % 35); -- Sore (15:20 - 15:55)
        when 5 then v_hour := 17; v_minute := 30 + ((v_day * 9 + v_tx_idx * 17) % 25); -- Mulai Ramai Malam (17:30 - 17:55)
        when 6 then v_hour := 18; v_minute := 5 + ((v_day * 7 + v_tx_idx * 3) % 45);   -- Puncak Malam (18:05 - 18:50)
        else        v_hour := 19; v_minute := 20 + ((v_day * 17 + v_tx_idx * 9) % 35); -- Malam (19:20 - 19:55)
      end case;

      v_second := ((v_day * 19 + v_tx_idx * 23) % 59);

      -- Waktu dibuat relatif terhadap sekarang (now() - interval)
      v_tx_time := date_trunc('day', now()) - (v_day || ' days')::interval 
                   + (v_hour || ' hours')::interval 
                   + (v_minute || ' minutes')::interval 
                   + (v_second || ' seconds')::interval;

      -- Jika hari ini (v_day = 0) dan waktu melewati jam sekarang, geser ke beberapa jam yang lalu
      if v_tx_time > now() then
        v_tx_time := now() - (((v_tx_count - v_tx_idx) * 40 + 10) || ' minutes')::interval;
      end if;

      -- Pola Keranjang Menu:
      -- Menu favorit ~70% terjual:
      -- Makanan: 70% Sate Maranggi Sapi (favorit), 15% Sop Iga, 15% Nasi Timbel Komplit
      -- Minuman: 70% Favorit (Es Teh Manis, Es Kelapa Muda, Air Mineral), 15% Es Jeruk, 15% Kopi Hitam
      v_rnd := (v_day * 37 + v_tx_idx * 43) % 100;
      if v_rnd < 70 then
        v_food_name := 'Sate Maranggi Sapi';
        v_food_id := v_id_sate;
        v_food_price := 35000;
      elsif v_rnd < 85 then
        v_food_name := 'Sop iga';
        v_food_id := v_id_sop;
        v_food_price := 28000;
      else
        v_food_name := 'Nasi Timbel Komplit';
        v_food_id := v_id_timbel;
        v_food_price := 25000;
      end if;

      v_rnd := (v_day * 29 + v_tx_idx * 53) % 100;
      if v_rnd < 32 then
        v_drink_name := 'Es Teh Manis';
        v_drink_id := v_id_teh;
        v_drink_price := 5000;
      elsif v_rnd < 58 then
        v_drink_name := 'Es Kelapa Muda';
        v_drink_id := v_id_kelapa;
        v_drink_price := 8000;
      elsif v_rnd < 70 then
        v_drink_name := 'Air Mineral';
        v_drink_id := v_id_mineral;
        v_drink_price := 4000;
      elsif v_rnd < 85 then
        v_drink_name := 'Es Jeruk';
        v_drink_id := v_id_jeruk;
        v_drink_price := 7000;
      else
        v_drink_name := 'Kopi Hitam';
        v_drink_id := v_id_kopi;
        v_drink_price := 6000;
      end if;

      -- Jenis kombinasi pesanan (1 makanan + 1 minuman, 2 makanan + 2 minuman, paket, dll.)
      v_basket_type := (v_day * 5 + v_tx_idx) % 6;
      v_drink2_name := null;

      case v_basket_type
        when 0 then -- 1 Makanan + 1 Minuman (Paling Umum)
          v_food_qty := 1;
          v_drink_qty := 1;
          v_total := (v_food_qty * v_food_price) + (v_drink_qty * v_drink_price);
          v_transcript := v_food_name || ' 1 ' || v_drink_name || ' 1';

        when 1 then -- 2 Makanan + 2 Minuman (Makan berdua)
          v_food_qty := 2;
          v_drink_qty := 2;
          v_total := (v_food_qty * v_food_price) + (v_drink_qty * v_drink_price);
          v_transcript := v_food_name || ' 2 ' || v_drink_name || ' 2';

        when 2 then -- 1 Makanan + 2 Minuman (Makan + Tambah Air Mineral)
          v_food_qty := 1;
          v_drink_qty := 1;
          v_drink2_name := 'Air Mineral';
          v_drink2_id := v_id_mineral;
          v_drink2_price := 4000;
          v_drink2_qty := 1;
          v_total := (v_food_qty * v_food_price) + (v_drink_qty * v_drink_price) + (v_drink2_qty * v_drink2_price);
          v_transcript := v_food_name || ' 1 ' || v_drink_name || ' 1 air mineral 1';

        when 3 then -- Makanan saja (Bungkus / Takeaway)
          v_food_qty := 1 + ((v_day + v_tx_idx) % 2); -- 1 atau 2 porsi
          v_drink_qty := 0;
          v_total := (v_food_qty * v_food_price);
          v_transcript := v_food_name || ' ' || v_food_qty;

        when 4 then -- Minuman saja (Nongkrong santai)
          v_food_qty := 0;
          v_drink_qty := 2;
          v_total := (v_drink_qty * v_drink_price);
          v_transcript := v_drink_name || ' ' || v_drink_qty;

        else -- 2 Makanan + 1 Minuman
          v_food_qty := 2;
          v_drink_qty := 1;
          v_total := (v_food_qty * v_food_price) + (v_drink_qty * v_drink_price);
          v_transcript := v_food_name || ' 2 ' || v_drink_name || ' 1';
      end case;

      -- Metode pembayaran: 65% Tunai, 35% QRIS
      if ((v_day * 7 + v_tx_idx * 11) % 10) < 6 then
        v_payment_method := 'tunai';
        -- Hitung nominal uang tunai & kembalian yang wajar
        v_cash_received := ceil(v_total / 10000.0) * 10000;
        if (v_cash_received - v_total) < 2000 and v_cash_received < 150000 then
          v_cash_received := v_cash_received + 10000;
        end if;
        v_change_amount := v_cash_received - v_total;
      else
        v_payment_method := 'qris';
        v_cash_received := null;
        v_change_amount := null;
      end if;

      -- Status: 98% selesai, 2% dibatalkan (untuk menguji riwayat pembatalan)
      if v_day = 14 and v_tx_idx = 3 then
        v_status := 'dibatalkan';
      else
        v_status := 'selesai';
      end if;

      -- Source: Mode Ramai (~50%), Mode Normal (~40%), Manual (~10%)
      if (v_tx_idx % 10) < 5 then
        v_source := 'ramai';
      elsif (v_tx_idx % 10) < 9 then
        v_source := 'normal';
      else
        v_source := 'manual';
      end if;

      -- Generate UUID Transaksi
      v_tx_id := gen_random_uuid();

      -- Insert ke tabel public.transactions
      insert into public.transactions (
        id,
        store_id,
        raw_transcript,
        total_amount,
        payment_method,
        status,
        source,
        cash_received,
        change_amount,
        created_at
      ) values (
        v_tx_id,
        v_store_id,
        v_transcript,
        v_total,
        v_payment_method,
        v_status,
        v_source,
        v_cash_received,
        v_change_amount,
        v_tx_time
      );

      -- Insert Items ke tabel public.transaction_items (Subtotal dan total selalu konsisten)
      if v_food_qty > 0 then
        insert into public.transaction_items (
          id,
          transaction_id,
          menu_item_id,
          item_name,
          quantity,
          unit_price,
          subtotal
        ) values (
          gen_random_uuid(),
          v_tx_id,
          v_food_id,
          v_food_name,
          v_food_qty,
          v_food_price,
          v_food_qty * v_food_price
        );
        v_total_items_created := v_total_items_created + v_food_qty;
      end if;

      if v_drink_qty > 0 then
        insert into public.transaction_items (
          id,
          transaction_id,
          menu_item_id,
          item_name,
          quantity,
          unit_price,
          subtotal
        ) values (
          gen_random_uuid(),
          v_tx_id,
          v_drink_id,
          v_drink_name,
          v_drink_qty,
          v_drink_price,
          v_drink_qty * v_drink_price
        );
        v_total_items_created := v_total_items_created + v_drink_qty;
      end if;

      if v_drink2_name is not null and v_drink2_qty > 0 then
        insert into public.transaction_items (
          id,
          transaction_id,
          menu_item_id,
          item_name,
          quantity,
          unit_price,
          subtotal
        ) values (
          gen_random_uuid(),
          v_tx_id,
          v_drink2_id,
          v_drink2_name,
          v_drink2_qty,
          v_drink2_price,
          v_drink2_qty * v_drink2_price
        );
        v_total_items_created := v_total_items_created + v_drink2_qty;
      end if;

      v_total_tx_created := v_total_tx_created + 1;
      if v_status = 'selesai' then
        v_total_omzet := v_total_omzet + v_total;
      end if;

    end loop;
  end loop;

  raise notice '=======================================================';
  raise notice 'SEED BERHASIL SELESAI!';
  raise notice 'Toko: % (Store ID: %)', v_store_name, v_store_id;
  raise notice 'Total Transaksi Dibuat : % transaksi', v_total_tx_created;
  raise notice 'Total Item Terjual     : % porsi', v_total_items_created;
  raise notice 'Total Omzet (30 Hari)  : Rp %', to_char(v_total_omzet, 'FM999,999,999');
  raise notice '=======================================================';
end $$;

-- ==============================================================================
-- 3. QUERY RINGKASAN HASIL SEED (Tampil di Grid Hasil Supabase SQL Editor)
-- Ganti email di bawah ini jika ingin melihat hasil ringkasan tabel
-- ==============================================================================
with demo_store as (
  select s.id as store_id, s.name as store_name
  from public.stores s
  join auth.users u on s.owner_id = u.id
  where lower(u.email) = lower(trim('sikasep@gmail.com'))
  limit 1
)
select 
  'Katalog Menu Toko' as kategori,
  count(mi.id)::text as jumlah_data,
  string_agg(mi.name || ' (Rp ' || to_char(mi.price, 'FM999,999') || ')', ' | ' order by mi.is_favorite desc, mi.name) as detail_keterangan
from demo_store ds
join public.menu_items mi on mi.store_id = ds.store_id

union all

select 
  'Filter Transaksi: Hari Ini',
  count(t.id)::text,
  'Total Omzet Hari Ini: Rp ' || to_char(coalesce(sum(case when t.status = 'selesai' then t.total_amount else 0 end), 0), 'FM999,999,999')
from demo_store ds
join public.transactions t on t.store_id = ds.store_id
where t.created_at >= date_trunc('day', now())

union all

select 
  'Filter Transaksi: 7 Hari Terakhir',
  count(t.id)::text,
  'Total Omzet 7 Hari: Rp ' || to_char(coalesce(sum(case when t.status = 'selesai' then t.total_amount else 0 end), 0), 'FM999,999,999')
from demo_store ds
join public.transactions t on t.store_id = ds.store_id
where t.created_at >= (now() - interval '7 days')

union all

select 
  'Filter Transaksi: 30 Hari Terakhir',
  count(t.id)::text,
  'Total Omzet 30 Hari: Rp ' || to_char(coalesce(sum(case when t.status = 'selesai' then t.total_amount else 0 end), 0), 'FM999,999,999')
from demo_store ds
join public.transactions t on t.store_id = ds.store_id
where t.created_at >= (now() - interval '30 days')

union all

select 
  'Menu Terlaris #1 (Makanan Favorit)',
  sum(ti.quantity)::text || ' porsi',
  ti.item_name || ' (Pendapatan: Rp ' || to_char(sum(ti.subtotal), 'FM999,999,999') || ')'
from demo_store ds
join public.transactions t on t.store_id = ds.store_id
join public.transaction_items ti on ti.transaction_id = t.id
where ti.item_name = 'Sate Maranggi Sapi' and t.status = 'selesai'
group by ti.item_name;
