import { createClient } from '@/lib/supabase/client';

function getClient() {
  return createClient();
}

export interface TopMenuItem {
  item_name: string;
  total_qty: number;
  total_revenue: number;
  order_count: number;
}

export async function getTopMenuItems(
  storeId: string,
  days: number = 30
): Promise<TopMenuItem[]> {
  const supabase = getClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  let res: any = await supabase
    .from('transactions')
    .select('id, status, transaction_items(*)')
    .eq('store_id', storeId)
    .neq('status', 'dibatalkan')
    .gte('created_at', since.toISOString());

  if (res.error) {
    res = await supabase
      .from('transactions')
      .select('id, transaction_items(*)')
      .eq('store_id', storeId)
      .gte('created_at', since.toISOString());
  }

  const transactions = res.data;
  if (res.error || !transactions) {
    console.error('Error fetching top menu items:', res.error);
    return [];
  }
  const itemMap: Record<string, TopMenuItem> = {};
  
  for (const tx of transactions) {
    const items = (tx as any).transaction_items || [];
    for (const item of items) {
      const name = item.item_name;
      if (!itemMap[name]) {
        itemMap[name] = { item_name: name, total_qty: 0, total_revenue: 0, order_count: 0 };
      }
      itemMap[name].total_qty += item.quantity;
      itemMap[name].total_revenue += item.subtotal;
      itemMap[name].order_count += 1;
    }
  }

  return Object.values(itemMap).sort((a, b) => b.total_qty - a.total_qty);
}

export interface HourlyData {
  hour: number;
  count: number;
  total: number;
}

export async function getHourlyDistribution(
  storeId: string,
  days: number = 7
): Promise<HourlyData[]> {
  const supabase = getClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  let res: any = await supabase
    .from('transactions')
    .select('created_at, total_amount, status')
    .eq('store_id', storeId)
    .neq('status', 'dibatalkan')
    .gte('created_at', since.toISOString());

  if (res.error) {
    res = await supabase
      .from('transactions')
      .select('created_at, total_amount')
      .eq('store_id', storeId)
      .gte('created_at', since.toISOString());
  }

  const data = res.data;
  if (res.error || !data) {
    console.error('Error fetching hourly distribution:', res.error);
    return [];
  }
  const hourly: HourlyData[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: 0,
    total: 0,
  }));

  for (const tx of data) {
    const date = new Date(tx.created_at);
    const hour = date.getHours();
    hourly[hour].count += 1;
    hourly[hour].total += Number(tx.total_amount);
  }

  return hourly;
}

export interface WeekComparison {
  thisWeek: { total: number; count: number; avgPerTx: number };
  lastWeek: { total: number; count: number; avgPerTx: number };
  changePercent: number;
}

export async function getWeekComparison(storeId: string): Promise<WeekComparison> {
  const supabase = getClient();
  const now = new Date();
  
  const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const startOfLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);

  let res: any = await supabase
    .from('transactions')
    .select('created_at, total_amount, status')
    .eq('store_id', storeId)
    .neq('status', 'dibatalkan')
    .gte('created_at', startOfLastWeek.toISOString());

  if (res.error) {
    res = await supabase
      .from('transactions')
      .select('created_at, total_amount')
      .eq('store_id', storeId)
      .gte('created_at', startOfLastWeek.toISOString());
  }

  const data = res.data;
  if (res.error || !data) {
    console.error('Error fetching week comparison:', res.error);
    return {
      thisWeek: { total: 0, count: 0, avgPerTx: 0 },
      lastWeek: { total: 0, count: 0, avgPerTx: 0 },
      changePercent: 0,
    };
  }

  const thisWeekTxs = (data as any[]).filter((tx: any) => new Date(tx.created_at) >= startOfThisWeek);
  const lastWeekTxs = (data as any[]).filter((tx: any) => {
    const d = new Date(tx.created_at);
    return d >= startOfLastWeek && d < startOfThisWeek;
  });

  const thisWeekTotal = thisWeekTxs.reduce((sum: number, tx: any) => sum + Number(tx.total_amount), 0);
  const lastWeekTotal = lastWeekTxs.reduce((sum: number, tx: any) => sum + Number(tx.total_amount), 0);

  const thisWeekCount = thisWeekTxs.length;
  const lastWeekCount = lastWeekTxs.length;

  const thisWeekAvg = thisWeekCount > 0 ? Math.round(thisWeekTotal / thisWeekCount) : 0;
  const lastWeekAvg = lastWeekCount > 0 ? Math.round(lastWeekTotal / lastWeekCount) : 0;

  const changePercent =
    lastWeekTotal > 0
      ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
      : thisWeekTotal > 0
      ? 100
      : 0;

  return {
    thisWeek: { total: thisWeekTotal, count: thisWeekCount, avgPerTx: thisWeekAvg },
    lastWeek: { total: lastWeekTotal, count: lastWeekCount, avgPerTx: lastWeekAvg },
    changePercent,
  };
}

export interface FullAnalytics {
  topMenuItems: TopMenuItem[];
  hourlyDistribution: HourlyData[];
  weekComparison: WeekComparison;
  totalTransactions30d: number;
  totalRevenue30d: number;
  avgOrderValue: number;
}

export async function getFullAnalytics(storeId: string): Promise<FullAnalytics> {
  const [topItems, hourly, weekComp] = await Promise.all([
    getTopMenuItems(storeId, 30),
    getHourlyDistribution(storeId, 7),
    getWeekComparison(storeId),
  ]);

  const totalRevenue30d = topItems.reduce((sum, item) => sum + item.total_revenue, 0);
  const totalTransactions30d = topItems.reduce((sum, item) => sum + item.order_count, 0);

  return {
    topMenuItems: topItems,
    hourlyDistribution: hourly,
    weekComparison: weekComp,
    totalTransactions30d,
    totalRevenue30d,
    avgOrderValue: totalTransactions30d > 0 ? Math.round(totalRevenue30d / totalTransactions30d) : 0,
  };
}
