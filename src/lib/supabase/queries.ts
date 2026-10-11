import { createClient } from '@/lib/supabase/client';
import type { MenuItem, Transaction, TransactionItem } from '@/types';

function getClient() {
  return createClient();
}

export async function getStore() {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching store:', error);
    return null;
  }
  return data;
}

export async function getMenuItems(storeId: string): Promise<MenuItem[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
  return data || [];
}

export async function createMenuItem(
  storeId: string,
  name: string,
  price: number
): Promise<MenuItem | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('menu_items')
    .insert({ store_id: storeId, name, price })
    .select()
    .single();

  if (error) {
    console.error('Error creating menu item:', error);
    return null;
  }
  return data;
}

export async function updateMenuItem(
  id: string,
  updates: { name?: string; price?: number; is_active?: boolean }
): Promise<MenuItem | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating menu item:', error);
    return null;
  }
  return data;
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const supabase = getClient();
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting menu item:', error);
    return false;
  }
  return true;
}

export async function createTransaction(
  storeId: string,
  rawTranscript: string | null,
  totalAmount: number,
  items: {
    menu_item_id: string | null;
    item_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[],
  metadata?: {
    payment_method?: 'tunai' | 'qris';
    status?: 'selesai' | 'dibatalkan';
    source?: 'normal' | 'ramai' | 'manual';
    cash_received?: number | null;
    change_amount?: number | null;
  }
): Promise<Transaction | null> {
  const supabase = getClient();

  const insertPayload: Record<string, unknown> = {
    store_id: storeId,
    raw_transcript: rawTranscript,
    total_amount: totalAmount,
  };

  if (metadata) {
    if (metadata.payment_method !== undefined) insertPayload.payment_method = metadata.payment_method;
    if (metadata.status !== undefined) insertPayload.status = metadata.status;
    if (metadata.source !== undefined) insertPayload.source = metadata.source;
    if (metadata.cash_received !== undefined) insertPayload.cash_received = metadata.cash_received;
    if (metadata.change_amount !== undefined) insertPayload.change_amount = metadata.change_amount;
  }

  // Coba insert dengan metadata kolom baru
  let { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert(insertPayload)
    .select()
    .single();

  // Jika kolom baru belum ada di DB remote (error PGRST204 / 42703), fallback ke payload dasar
  if (txError && (txError.code === 'PGRST204' || txError.code === '42703' || (metadata && Object.keys(metadata).length > 0))) {
    const basePayload = {
      store_id: storeId,
      raw_transcript: rawTranscript,
      total_amount: totalAmount,
    };
    const fallbackRes = await supabase
      .from('transactions')
      .insert(basePayload)
      .select()
      .single();
    if (!fallbackRes.error && fallbackRes.data) {
      tx = fallbackRes.data;
      txError = null;
    }
  }

  if (txError || !tx) {
    console.error('Error creating transaction:', txError?.message || txError);
    return null;
  }

  const txItems = items.map((item) => ({
    transaction_id: tx.id,
    menu_item_id: item.menu_item_id,
    item_name: item.item_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.subtotal,
  }));

  const { error: itemsError } = await supabase
    .from('transaction_items')
    .insert(txItems);

  if (itemsError) {
    console.error('Error creating transaction items:', itemsError.message || itemsError);
  }

  return { ...tx, items: txItems as TransactionItem[] };
}

export async function cancelTransaction(id: string): Promise<boolean> {
  const supabase = getClient();
  const { error } = await supabase
    .from('transactions')
    .update({
      status: 'dibatalkan',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    // Jika kolom status belum ada di DB remote
    if (error.code === '42703' || error.code === 'PGRST204') {
      console.warn('Kolom status belum ada di database remote. Jalankan migrasi 002_voice_flow_v2.sql di SQL Editor Supabase.');
    } else {
      console.error('Error canceling transaction:', error.message || error);
    }
    return false;
  }
  return true;
}

export async function updateTransaction(
  id: string,
  updates: {
    payment_method?: 'tunai' | 'qris';
    status?: 'selesai' | 'dibatalkan';
    total_amount?: number;
  }
): Promise<Transaction | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('transactions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, items:transaction_items(*)')
    .single();

  if (error) {
    if (error.code === '42703' || error.code === 'PGRST204') {
      console.warn('Kolom belum ada di database remote. Jalankan migrasi 002_voice_flow_v2.sql di SQL Editor Supabase.');
    } else {
      console.error('Error updating transaction:', error.message || error);
    }
    return null;
  }
  return data;
}

export async function updateTransactionItems(
  transactionId: string,
  newTotal: number,
  newItems: {
    menu_item_id: string | null;
    item_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[]
): Promise<boolean> {
  const supabase = getClient();

  // 1. Hapus item lama
  const { error: deleteError } = await supabase
    .from('transaction_items')
    .delete()
    .eq('transaction_id', transactionId);

  if (deleteError) {
    console.error('Error deleting old transaction items:', deleteError.message || deleteError);
    return false;
  }

  // 2. Masukkan item baru
  const itemsToInsert = newItems.map((item) => ({
    transaction_id: transactionId,
    menu_item_id: item.menu_item_id,
    item_name: item.item_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.subtotal,
  }));

  const { error: insertError } = await supabase
    .from('transaction_items')
    .insert(itemsToInsert);

  if (insertError) {
    console.error('Error inserting new transaction items:', insertError.message || insertError);
    return false;
  }

  // 3. Update total amount & updated_at di transactions
  const { error: txError } = await supabase
    .from('transactions')
    .update({
      total_amount: newTotal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', transactionId);

  if (txError) {
    // Jika updated_at belum ada (42703 / PGRST204), fallback update total_amount saja
    if (txError.code === '42703' || txError.code === 'PGRST204') {
      await supabase
        .from('transactions')
        .update({ total_amount: newTotal })
        .eq('id', transactionId);
      return true;
    }
    console.error('Error updating transaction total:', txError.message || txError);
    return false;
  }

  return true;
}

export async function getTransactionsToday(storeId: string): Promise<Transaction[]> {
  const supabase = getClient();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      items:transaction_items(*)
    `)
    .eq('store_id', storeId)
    .gte('created_at', startOfDay.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  return data || [];
}

export async function getTodayTotal(storeId: string): Promise<{ total: number; count: number }> {
  const supabase = getClient();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Coba query dengan filter status dibatalkan (SPEC §7.6)
  let res: any = await supabase
    .from('transactions')
    .select('total_amount, status')
    .eq('store_id', storeId)
    .neq('status', 'dibatalkan')
    .gte('created_at', startOfDay.toISOString());

  // 2. Jika kolom status belum ada di DB remote (error 42703), fallback ke query dasar
  if (res.error) {
    res = await supabase
      .from('transactions')
      .select('total_amount')
      .eq('store_id', storeId)
      .gte('created_at', startOfDay.toISOString());
  }

  if (res.error) {
    console.error('Error fetching today total:', res.error);
    return { total: 0, count: 0 };
  }

  const validRows = (res.data || []).filter((tx: any) => tx.status !== 'dibatalkan');
  const total = validRows.reduce((sum: number, tx: any) => sum + Number(tx.total_amount), 0);
  return { total, count: validRows.length };
}

export async function getWeeklyTransactions(storeId: string): Promise<{ date: string; total: number; count: number }[]> {
  const supabase = getClient();
  
  const now = new Date();
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  // 1. Coba query dengan filter status dibatalkan
  let res: any = await supabase
    .from('transactions')
    .select('created_at, total_amount, status')
    .eq('store_id', storeId)
    .neq('status', 'dibatalkan')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  // 2. Jika kolom status belum ada di DB remote (error 42703), fallback ke query dasar
  if (res.error) {
    res = await supabase
      .from('transactions')
      .select('created_at, total_amount')
      .eq('store_id', storeId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });
  }

  if (res.error) {
    console.error('Error fetching weekly transactions:', res.error);
    return [];
  }

  const validRows = (res.data || []).filter((tx: any) => tx.status !== 'dibatalkan');

  const grouped = validRows.reduce((acc: Record<string, { total: number; count: number }>, tx: any) => {
    const date = new Date(tx.created_at);
    const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (!acc[localDateStr]) acc[localDateStr] = { total: 0, count: 0 };
    acc[localDateStr].total += Number(tx.total_amount);
    acc[localDateStr].count += 1;
    return acc;
  }, {});

  const result = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    result.push({
      date: dateStr,
      total: grouped[dateStr]?.total || 0,
      count: grouped[dateStr]?.count || 0
    });
  }

  return result;
}
