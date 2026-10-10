'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getWeeklyTransactions } from '@/lib/supabase/queries';
import { getTopMenuItems, getHourlyDistribution, getWeekComparison, type TopMenuItem, type HourlyData, type WeekComparison } from '@/lib/supabase/analytics';
import { formatRupiah } from '@/lib/mock-data';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export default function RekapPage() {
  const { store } = useAuth();
  const [weeklyData, setWeeklyData] = useState<{ date: string; total: number; count: number; dayName?: string; formattedDate?: string }[]>([]);
  const [topItems, setTopItems] = useState<TopMenuItem[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [weekComp, setWeekComp] = useState<WeekComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'waktu'>('overview');

  useEffect(() => {
    async function loadData() {
      if (store) {
        const [data, top, hourly, comp] = await Promise.all([
          getWeeklyTransactions(store.id),
          getTopMenuItems(store.id, 30),
          getHourlyDistribution(store.id, 7),
          getWeekComparison(store.id),
        ]);
        const formattedData = data.map((d) => {
          const dateObj = new Date(d.date);
          const days = ['Ming', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
          return {
            ...d,
            dayName: days[dateObj.getDay()],
            formattedDate: `${dateObj.getDate()}/${dateObj.getMonth() + 1}`,
          };
        });

        setWeeklyData(formattedData);
        setTopItems(top);
        setHourlyData(hourly);
        setWeekComp(comp);
      }
      setLoading(false);
    }
    loadData();
  }, [store]);

  const totalOmzetMinggu = weeklyData.reduce((sum, item) => sum + item.total, 0);
  const totalTransaksiMinggu = weeklyData.reduce((sum, item) => sum + item.count, 0);
  const avgPerTx = totalTransaksiMinggu > 0 ? Math.round(totalOmzetMinggu / totalTransaksiMinggu) : 0;

  const peakHour =
    hourlyData.length > 0
      ? hourlyData.reduce((max, curr) => (curr.count > max.count ? curr : max), hourlyData[0])
      : { hour: 0, count: 0, total: 0 };

  const formatHour = (h: number) => `${String(h).padStart(2, '0')}:00`;
  const activeHours = hourlyData.filter((h) => h.hour >= 6 && h.hour <= 22);

  const tabs = [
    { id: 'overview' as const, label: 'Ringkasan Omzet' },
    { id: 'menu' as const, label: 'Menu Terlaris' },
    { id: 'waktu' as const, label: 'Jam Sibuk' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#FFFBEB] text-[#1C1917]">
      <header className="px-6 py-5 border-b border-[#E7E0D3] bg-[#FFFBEB]/90 backdrop-blur-xs sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-tight text-[#1C1917]">Rekap Penjualan</h1>
        <p className="text-xs text-[#78716C] mt-0.5">Analitik performa toko UMKM Purwakarta</p>
      </header>

      <div className="px-6 py-3 border-b border-[#E7E0D3]">
        <div className="flex gap-1.5 bg-[#FDF6E2] border border-[#E7E0D3] rounded-xl p-1.5 max-w-md">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 min-h-[44px] rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#9A3412] text-[#FFFBEB] shadow-2xs'
                  : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#E7E0D3]/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <svg className="w-8 h-8 text-[#9A3412] animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-[#FDF6E2] border border-[#E7E0D3] flex items-center justify-center text-[#9A3412]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">Omzet 7 Hari</p>
                    </div>
                    <p className="text-xl font-bold text-[#9A3412] tabular-nums">{formatRupiah(totalOmzetMinggu)}</p>
                  </div>

                  <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-[#FDF6E2] border border-[#E7E0D3] flex items-center justify-center text-[#B45309]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="M6 8h.01" /><path d="M10 8h.01" /><path d="M14 8h.01" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">Transaksi</p>
                    </div>
                    <p className="text-xl font-bold text-[#1C1917] tabular-nums">{totalTransaksiMinggu}</p>
                  </div>

                  <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-[#FDF6E2] border border-[#E7E0D3] flex items-center justify-center text-[#78350F]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">Rata-rata / Tx</p>
                    </div>
                    <p className="text-xl font-bold text-[#78350F] tabular-nums">{formatRupiah(avgPerTx)}</p>
                  </div>

                  {weekComp && (
                    <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-4 shadow-2xs">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                            weekComp.changePercent >= 0
                              ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]'
                              : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#B91C1C]'
                          }`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {weekComp.changePercent >= 0 ? (
                              <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>
                            ) : (
                              <><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></>
                            )}
                          </svg>
                        </div>
                        <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">vs Pekan Lalu</p>
                      </div>
                      <p
                        className={`text-xl font-bold tabular-nums ${
                          weekComp.changePercent >= 0 ? 'text-[#15803D]' : 'text-[#B91C1C]'
                        }`}
                      >
                        {weekComp.changePercent >= 0 ? '+' : ''}
                        {weekComp.changePercent}%
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-5 shadow-2xs">
                  <div className="mb-6">
                    <h2 className="text-base font-bold text-[#1C1917]">Tren Omzet Harian</h2>
                    <p className="text-xs text-[#78716C] mt-0.5">Grafik pendapatan 7 hari terakhir dalam Rupiah</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#9A3412" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#9A3412" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D3" vertical={false} />
                        <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fill: '#78716C', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716C', fontSize: 12 }} tickFormatter={(value) => `Rp${value / 1000}k`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderColor: '#E7E0D3',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)',
                            color: '#1C1917',
                          }}
                          itemStyle={{ color: '#9A3412', fontWeight: 700 }}
                          labelStyle={{ color: '#78716C', marginBottom: '4px', fontSize: '12px' }}
                          formatter={(value) => [formatRupiah(Number(value)), 'Omzet']}
                          labelFormatter={(_label, payload) => payload?.[0]?.payload?.formattedDate || String(_label)}
                        />
                        <Area type="monotone" dataKey="total" stroke="#9A3412" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {weekComp && (
                  <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-5 shadow-2xs">
                    <h2 className="text-base font-bold text-[#1C1917] mb-4">Perbandingan Performa Mingguan</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-[#FDF6E2] border border-[#E7E0D3]">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1">Minggu Ini</p>
                        <p className="text-xl font-bold text-[#9A3412] tabular-nums">{formatRupiah(weekComp.thisWeek.total)}</p>
                        <p className="text-xs text-[#57534E] mt-1 tabular-nums">
                          {weekComp.thisWeek.count} transaksi • Rata-rata {formatRupiah(weekComp.thisWeek.avgPerTx)}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#FDF6E2] border border-[#E7E0D3]">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1">Minggu Lalu</p>
                        <p className="text-xl font-bold text-[#57534E] tabular-nums">{formatRupiah(weekComp.lastWeek.total)}</p>
                        <p className="text-xs text-[#57534E] mt-1 tabular-nums">
                          {weekComp.lastWeek.count} transaksi • Rata-rata {formatRupiah(weekComp.lastWeek.avgPerTx)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'menu' && (
              <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl overflow-hidden shadow-2xs">
                <div className="px-5 py-4 border-b border-[#E7E0D3] bg-[#FFFBEB]/50">
                  <h2 className="text-base font-bold text-[#1C1917]">Menu Terlaris (30 Hari Terakhir)</h2>
                  <p className="text-xs text-[#78716C] mt-0.5">Diurutkan berdasarkan volume penjualan terbanyak</p>
                </div>

                {topItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center p-6">
                    <p className="text-sm font-semibold text-[#1C1917]">Belum ada data penjualan tercatat</p>
                    <p className="text-xs text-[#78716C] mt-1">Lakukan transaksi di kasir untuk melihat produk terlaris toko Anda</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F5EBE1]">
                    {topItems.slice(0, 10).map((item, i) => {
                      const maxQty = topItems[0]?.total_qty || 1;
                      const percentage = Math.round((item.total_qty / maxQty) * 100);
                      return (
                        <div key={item.item_name} className="px-5 py-4 hover:bg-[#FFFBEB]/50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                  i === 0
                                    ? 'bg-[#9A3412] text-[#FFFBEB]'
                                    : i === 1
                                    ? 'bg-[#C2410C] text-[#FFFBEB]'
                                    : i === 2
                                    ? 'bg-[#B45309] text-[#FFFBEB]'
                                    : 'bg-[#FDF6E2] text-[#57534E] border border-[#E7E0D3]'
                                }`}
                              >
                                {i + 1}
                              </span>
                              <span className="text-sm font-bold text-[#1C1917]">{item.item_name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-[#9A3412] tabular-nums">{formatRupiah(item.total_revenue)}</p>
                              <p className="text-xs text-[#78716C] tabular-nums">{item.total_qty} porsi terjual</p>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-[#FDF6E2] overflow-hidden border border-[#E7E0D3]/50">
                            <div
                              className="h-full rounded-full bg-[#9A3412] transition-all duration-700"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'waktu' && (
              <>
                {peakHour.count > 0 && (
                  <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-5 shadow-2xs">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-[#FDF6E2] border border-[#E7E0D3] flex items-center justify-center text-[#9A3412] shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#1C1917]">Jam Tersibuk: Pukul {formatHour(peakHour.hour)} WIB</p>
                        <p className="text-xs text-[#78716C] mt-0.5 tabular-nums">
                          {peakHour.count} transaksi terjadi • {formatRupiah(peakHour.total)} pendapatan terkumpul
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-5 shadow-2xs">
                  <div className="mb-6">
                    <h2 className="text-base font-bold text-[#1C1917]">Distribusi Transaksi per Jam (7 Hari)</h2>
                    <p className="text-xs text-[#78716C] mt-0.5">Analisis jam ramai untuk efisiensi persiapan staf kasir</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activeHours} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D3" vertical={false} />
                        <XAxis
                          dataKey="hour"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#78716C', fontSize: 11 }}
                          tickFormatter={(h) => `${h}`}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716C', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderColor: '#E7E0D3',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)',
                            color: '#1C1917',
                          }}
                          labelStyle={{ color: '#78716C', marginBottom: '4px', fontSize: '12px' }}
                          labelFormatter={(h) => `Pukul ${formatHour(h as number)} WIB`}
                          formatter={(value, name) => [value, name === 'count' ? 'Jumlah Transaksi' : 'Total Revenue']}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {activeHours.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.hour === peakHour.hour ? '#9A3412' : '#C2410C'}
                              fillOpacity={entry.hour === peakHour.hour ? 1.0 : 0.65}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
