-- ============================================
-- Sikasep — Migration 002: Alur Suara v2 (SPEC §7)
-- ============================================

-- 1. Tambahkan kolom ke transactions
alter table public.transactions
  add column if not exists payment_method text default 'tunai' check (payment_method in ('tunai', 'qris')),
  add column if not exists status text default 'selesai' check (status in ('selesai', 'dibatalkan')),
  add column if not exists source text default 'normal' check (source in ('normal', 'ramai', 'manual')),
  add column if not exists cash_received numeric check (cash_received >= 0),
  add column if not exists change_amount numeric check (change_amount >= 0),
  add column if not exists updated_at timestamptz;

-- 2. Index untuk status & payment_method
create index if not exists idx_transactions_status on public.transactions(status);
create index if not exists idx_transactions_payment_method on public.transactions(payment_method);

-- 3. Kebijakan RLS update transactions (batal, ubah metode)
create policy "Users can update own transactions"
  on public.transactions for update
  using (store_id = public.get_user_store_id());

-- 4. Kebijakan RLS update & delete transaction_items (edit item)
create policy "Users can update own transaction items"
  on public.transaction_items for update
  using (
    transaction_id in (
      select id from public.transactions
      where store_id = public.get_user_store_id()
    )
  );

create policy "Users can delete own transaction items"
  on public.transaction_items for delete
  using (
    transaction_id in (
      select id from public.transactions
      where store_id = public.get_user_store_id()
    )
  );
