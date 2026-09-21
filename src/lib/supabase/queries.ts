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
  }[]
): Promise<Transaction | null> {
  const supabase = getClient();

  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      store_id: storeId,
      raw_transcript: rawTranscript,
      total_amount: totalAmount,
    })
    .select()
    .single();

  if (txError || !tx) {
    console.error('Error creating transaction:', txError);
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
    console.error('Error creating transaction items:', itemsError);
  }

  return { ...tx, items: txItems as TransactionItem[] };
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

  const { data, error } = await supabase
    .from('transactions')
    .select('total_amount')
    .eq('store_id', storeId)
    .gte('created_at', startOfDay.toISOString());

  if (error) {
    console.error('Error fetching today total:', error);
    return { total: 0, count: 0 };
  }

  const total = (data || []).reduce((sum, tx) => sum + Number(tx.total_amount), 0);
  return { total, count: data?.length || 0 };
}

export async function getWeeklyTransactions(storeId: string): Promise<{ date: string; total: number; count: number }[]> {
  const supabase = getClient();
  
  const now = new Date();
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  const { data, error } = await supabase
    .from('transactions')
    .select('created_at, total_amount')
    .eq('store_id', storeId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching weekly transactions:', error);
    return [];
  }

  const grouped = (data || []).reduce((acc: Record<string, { total: number; count: number }>, tx) => {
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
