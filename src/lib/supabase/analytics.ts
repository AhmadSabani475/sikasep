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
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, transaction_items(*)')
    .eq('store_id', storeId)
    .gte('created_at', since.toISOString());

  if (error || !transactions) {
    console.error('Error fetching top menu items:', error);
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

  const { data, error } = await supabase
    .from('transactions')
    .select('created_at, total_amount')
    .eq('store_id', storeId)
    .gte('created_at', since.toISOString());

  if (error || !data) {
    console.error('Error fetching hourly distribution:', error);
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

  const { data, error } = await supabase
    .from('transactions')
    .select('created_at, total_amount')
    .eq('store_id', storeId)
    .gte('created_at', startOfLastWeek.toISOString());

  if (error || !data) {
    console.error('Error fetching week comparison:', error);
    return {
      thisWeek: { total: 0, count: 0, avgPerTx: 0 },
      lastWeek: { total: 0, count: 0, avgPerTx: 0 },
      changePercent: 0,
    };
  }

  const thisWeekData = data.filter(tx => new Date(tx.created_at) >= startOfThisWeek);
  const lastWeekData = data.filter(tx => {
    const d = new Date(tx.created_at);
    return d >= startOfLastWeek && d < startOfThisWeek;
  });

  const sumReduce = (arr: typeof data) => arr.reduce((sum, tx) => sum + Number(tx.total_amount), 0);

  const thisTotal = sumReduce(thisWeekData);
  const lastTotal = sumReduce(lastWeekData);

  return {
    thisWeek: {
      total: thisTotal,
      count: thisWeekData.length,
      avgPerTx: thisWeekData.length > 0 ? Math.round(thisTotal / thisWeekData.length) : 0,
    },
    lastWeek: {
      total: lastTotal,
      count: lastWeekData.length,
      avgPerTx: lastWeekData.length > 0 ? Math.round(lastTotal / lastWeekData.length) : 0,
    },
    changePercent: lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : 0,
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
