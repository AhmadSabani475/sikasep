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
        const formattedData = data.map(d => {
          const dateObj = new Date(d.date);
          const days = ['Ming', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
          return {
            ...d,
            dayName: days[dateObj.getDay()],
            formattedDate: `${dateObj.getDate()}/${dateObj.getMonth() + 1}`
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
  
  const peakHour = hourlyData.length > 0 
    ? hourlyData.reduce((max, curr) => curr.count > max.count ? curr : max, hourlyData[0])
    : { hour: 0, count: 0, total: 0 };

  const formatHour = (h: number) => `${String(h).padStart(2, '0')}:00`;
  const activeHours = hourlyData.filter(h => h.hour >= 6 && h.hour <= 22);

  const tabs = [
    { id: 'overview' as const, label: 'Ringkasan' },
    { id: 'menu' as const, label: 'Menu Terlaris' },
    { id: 'waktu' as const, label: 'Jam Sibuk' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <header className="px-6 py-5 border-b border-white/5">
        <h1 className="text-lg font-bold">Rekap Penjualan</h1>
        <p className="text-xs text-text-muted mt-0.5">Statistik & Analitik Toko Anda</p>
      </header>
      <div className="px-6 py-3 border-b border-white/5">
        <div className="flex gap-1 bg-surface-800 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500/15 text-primary-400'
                  : 'text-text-muted hover:text-text-secondary'
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
            <svg className="w-8 h-8 text-primary-400 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-primary-500/15 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-400" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                      <p className="text-xs text-text-muted">Omzet 7 Hari</p>
                    </div>
                    <p className="text-xl font-bold text-primary-400">{formatRupiah(totalOmzetMinggu)}</p>
                  </div>
                  <div className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-accent-500/15 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-400" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="M6 8h.01" /><path d="M10 8h.01" /><path d="M14 8h.01" />
                        </svg>
                      </div>
                      <p className="text-xs text-text-muted">Transaksi</p>
                    </div>
                    <p className="text-xl font-bold text-text-primary">{totalTransaksiMinggu}</p>
                  </div>
                  <div className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                      <p className="text-xs text-text-muted">Rata-rata / Tx</p>
                    </div>
                    <p className="text-xl font-bold text-blue-400">{formatRupiah(avgPerTx)}</p>
                  </div>
                  {weekComp && (
                    <div className="glass rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${weekComp.changePercent >= 0 ? 'bg-primary-500/15' : 'bg-danger-500/15'}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={weekComp.changePercent >= 0 ? 'text-primary-400' : 'text-danger-500'} strokeLinecap="round" strokeLinejoin="round">
                            {weekComp.changePercent >= 0 ? (
                              <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>
                            ) : (
                              <><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></>
                            )}
                          </svg>
                        </div>
                        <p className="text-xs text-text-muted">vs Minggu Lalu</p>
                      </div>
                      <p className={`text-xl font-bold ${weekComp.changePercent >= 0 ? 'text-primary-400' : 'text-danger-500'}`}>
                        {weekComp.changePercent >= 0 ? '+' : ''}{weekComp.changePercent}%
                      </p>
                    </div>
                  )}
                </div>
                <div className="glass rounded-2xl p-5">
                  <h2 className="text-sm font-semibold mb-6">Grafik Omzet Harian</h2>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                        <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={(value) => `Rp${value / 1000}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff20', borderRadius: '12px' }}
                          itemStyle={{ color: '#10b981' }}
                          labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                          formatter={(value) => [formatRupiah(Number(value)), 'Omzet']}
                          labelFormatter={(_label, payload) => payload?.[0]?.payload?.formattedDate || String(_label)}
                        />
                        <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {weekComp && (
                  <div className="glass rounded-2xl p-5">
                    <h2 className="text-sm font-semibold mb-4">Perbandingan Mingguan</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-surface-700/50">
                        <p className="text-xs text-text-muted mb-2">Minggu Ini</p>
                        <p className="text-lg font-bold text-primary-400">{formatRupiah(weekComp.thisWeek.total)}</p>
                        <p className="text-xs text-text-muted mt-1">{weekComp.thisWeek.count} transaksi • Avg {formatRupiah(weekComp.thisWeek.avgPerTx)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-700/50">
                        <p className="text-xs text-text-muted mb-2">Minggu Lalu</p>
                        <p className="text-lg font-bold text-text-secondary">{formatRupiah(weekComp.lastWeek.total)}</p>
                        <p className="text-xs text-text-muted mt-1">{weekComp.lastWeek.count} transaksi • Avg {formatRupiah(weekComp.lastWeek.avgPerTx)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {activeTab === 'menu' && (
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h2 className="text-sm font-semibold">Menu Terlaris (30 Hari)</h2>
                  <p className="text-xs text-text-muted mt-0.5">Berdasarkan jumlah terjual</p>
                </div>
                
                {topItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-text-secondary">Belum ada data penjualan</p>
                    <p className="text-xs text-text-muted mt-1">Lakukan beberapa transaksi untuk melihat menu terlaris</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.03]">
                    {topItems.slice(0, 10).map((item, i) => {
                      const maxQty = topItems[0]?.total_qty || 1;
                      const percentage = Math.round((item.total_qty / maxQty) * 100);
                      return (
                        <div key={item.item_name} className="px-5 py-3 hover:bg-white/[0.02] transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                i === 0 ? 'bg-accent-500/20 text-accent-400' :
                                i === 1 ? 'bg-surface-500 text-text-secondary' :
                                i === 2 ? 'bg-orange-500/20 text-orange-400' :
                                'bg-surface-700 text-text-muted'
                              }`}>
                                {i + 1}
                              </span>
                              <span className="text-sm font-medium text-text-primary">{item.item_name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-primary-400">{formatRupiah(item.total_revenue)}</p>
                              <p className="text-xs text-text-muted">{item.total_qty} terjual</p>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface-700 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-700"
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
                  <div className="glass rounded-2xl p-5 bg-gradient-to-r from-accent-500/5 to-transparent border border-accent-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-accent-500/15 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-400" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Jam Tersibuk: {formatHour(peakHour.hour)}</p>
                        <p className="text-xs text-text-muted">{peakHour.count} transaksi • {formatRupiah(peakHour.total)} revenue</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="glass rounded-2xl p-5">
                  <h2 className="text-sm font-semibold mb-6">Distribusi Transaksi per Jam (7 Hari)</h2>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activeHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                        <XAxis 
                          dataKey="hour" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#a1a1aa', fontSize: 11 }}
                          tickFormatter={(h) => `${h}`}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff20', borderRadius: '12px' }}
                          labelFormatter={(h) => `Pukul ${formatHour(h as number)}`}
                          formatter={(value, name) => [value, name === 'count' ? 'Transaksi' : 'Revenue']}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {activeHours.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.hour === peakHour.hour ? '#fbbf24' : '#1aad7c'} 
                              fillOpacity={entry.hour === peakHour.hour ? 0.9 : 0.6}
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
