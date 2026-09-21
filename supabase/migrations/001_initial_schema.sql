-- ============================================
-- Sikasep — Initial Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Table: stores (extends auth.users with store profile)
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  created_at timestamptz default now()
);

-- 2. Table: menu_items
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  name text not null,
  price numeric not null check (price >= 0),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. Table: transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  raw_transcript text,
  total_amount numeric not null check (total_amount >= 0),
  created_at timestamptz default now()
);

-- 4. Table: transaction_items
create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.transactions(id) on delete cascade not null,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  subtotal numeric not null check (subtotal >= 0)
);

-- ============================================
-- Indexes
-- ============================================
create index if not exists idx_menu_items_store_id on public.menu_items(store_id);
create index if not exists idx_transactions_store_id on public.transactions(store_id);
create index if not exists idx_transactions_created_at on public.transactions(created_at);
create index if not exists idx_transaction_items_transaction_id on public.transaction_items(transaction_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
alter table public.stores enable row level security;
alter table public.menu_items enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;

-- Helper function: get store_id for current user
create or replace function public.get_user_store_id()
returns uuid
language sql
stable
security definer
as $$
  select id from public.stores where owner_id = auth.uid() limit 1;
$$;

-- ---- STORES ----
create policy "Users can view own store"
  on public.stores for select
  using (owner_id = auth.uid());

create policy "Users can update own store"
  on public.stores for update
  using (owner_id = auth.uid());

create policy "Users can insert own store"
  on public.stores for insert
  with check (owner_id = auth.uid());

-- ---- MENU_ITEMS ----
create policy "Users can view own menu items"
  on public.menu_items for select
  using (store_id = public.get_user_store_id());

create policy "Users can insert own menu items"
  on public.menu_items for insert
  with check (store_id = public.get_user_store_id());

create policy "Users can update own menu items"
  on public.menu_items for update
  using (store_id = public.get_user_store_id());

create policy "Users can delete own menu items"
  on public.menu_items for delete
  using (store_id = public.get_user_store_id());

-- ---- TRANSACTIONS ----
create policy "Users can view own transactions"
  on public.transactions for select
  using (store_id = public.get_user_store_id());

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (store_id = public.get_user_store_id());

-- ---- TRANSACTION_ITEMS ----
create policy "Users can view own transaction items"
  on public.transaction_items for select
  using (
    transaction_id in (
      select id from public.transactions
      where store_id = public.get_user_store_id()
    )
  );

create policy "Users can insert own transaction items"
  on public.transaction_items for insert
  with check (
    transaction_id in (
      select id from public.transactions
      where store_id = public.get_user_store_id()
    )
  );

-- ============================================
-- Auto-create store on user signup (trigger)
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.stores (owner_id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'store_name', 'Toko Saya')
  );
  return new;
end;
$$;

-- Drop trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- Enable Realtime for transactions
-- ============================================
alter publication supabase_realtime add table public.transactions;
