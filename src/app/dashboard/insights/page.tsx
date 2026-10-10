'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getFullAnalytics, type FullAnalytics } from '@/lib/supabase/analytics';
import { formatRupiah } from '@/lib/mock-data';

interface Insight {
  judul: string;
  deskripsi: string;
  tipe: 'positive' | 'warning' | 'suggestion' | 'info';
  ikon: string;
}

interface ActionSuggestion {
  aksi: string;
  prioritas: 'tinggi' | 'sedang' | 'rendah';
  estimasi_dampak: string;
}

interface InsightsData {
  ringkasan: string;
  insights: Insight[];
  saran_aksi: ActionSuggestion[];
}

const iconMap: Record<string, React.ReactNode> = {
  trending_up: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  trending_down: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  ),
  star: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  lightbulb: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" /><path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  ),
  package: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  ),
  combo: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01" /><path d="M10 8h.01" /><path d="M14 8h.01" />
    </svg>
  ),
  target: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
};

const tipeStyles: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  positive: {
    bg: 'bg-[#DCFCE7]/40',
    border: 'border-[#86EFAC]',
    text: 'text-[#15803D]',
    iconBg: 'bg-[#DCFCE7] text-[#15803D]',
  },
  warning: {
    bg: 'bg-[#FEF3C7]/40',
    border: 'border-[#FDE68A]',
    text: 'text-[#B45309]',
    iconBg: 'bg-[#FEF3C7] text-[#B45309]',
  },
  suggestion: {
    bg: 'bg-[#FDF6E2]',
    border: 'border-[#E7E0D3]',
    text: 'text-[#9A3412]',
    iconBg: 'bg-[#FFFBEB] text-[#9A3412] border border-[#E7E0D3]',
  },
  info: {
    bg: 'bg-[#F5EBE1]/50',
    border: 'border-[#E7E0D3]',
    text: 'text-[#57534E]',
    iconBg: 'bg-[#FFFFFF] text-[#57534E] border border-[#E7E0D3]',
  },
};

const priorityStyles: Record<string, { bg: string; text: string; border: string }> = {
  tinggi: { bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', border: 'border-[#FECACA]' },
  sedang: { bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', border: 'border-[#FDE68A]' },
  rendah: { bg: 'bg-[#FDF6E2]', text: 'text-[#57534E]', border: 'border-[#E7E0D3]' },
};

export default function InsightsPage() {
  const { store } = useAuth();
  const [analytics, setAnalytics] = useState<FullAnalytics | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      if (store) {
        const data = await getFullAnalytics(store.id);
        setAnalytics(data);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [store]);

  const fetchInsights = async (data: FullAnalytics) => {
    setAiLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analytics: data }),
      });

      if (!res.ok) throw new Error('Failed to get insights');
      const result: InsightsData = await res.json();
      setInsights(result);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat rekomendasi AI. Silakan coba lagi.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#FFFBEB] text-[#1C1917]">
      <header className="px-6 py-5 border-b border-[#E7E0D3] bg-[#FFFBEB]/90 backdrop-blur-xs sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1C1917] flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#9A3412] flex items-center justify-center text-[#FFFBEB]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </span>
              AI Insights & Rekomendasi
            </h1>
            <p className="text-xs text-[#78716C] mt-0.5">Saran bisnis cerdas berbasis data toko UMKM Anda</p>
          </div>
          {analytics && (
            <button
              onClick={() => fetchInsights(analytics)}
              disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#FFFFFF] border border-[#E7E0D3] text-sm font-semibold text-[#57534E] hover:text-[#9A3412] hover:bg-[#FDF6E2] shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={aiLoading ? 'animate-spin text-[#9A3412]' : ''}
              >
                <polyline points="1 4 1 10 7 10" />
                <polyline points="23 20 23 14 17 14" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
              Segarkan
            </button>
          )}
        </div>
      </header>

      <div className="p-6 space-y-6">
        {(loading || aiLoading) && !insights && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-8">
            <div className="w-12 h-12 rounded-xl bg-[#FDF6E2] border border-[#E7E0D3] flex items-center justify-center text-[#9A3412]">
              <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[#1C1917]">AI sedang menganalisis pola penjualan Anda...</p>
              <p className="text-xs text-[#78716C] mt-1">Menghitung tren omzet, produk terlaris, dan jam sibuk toko</p>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#B91C1C] text-sm animate-fade-in text-center">
            {error}
            {analytics && (
              <button onClick={() => fetchInsights(analytics)} className="block mt-2 mx-auto text-xs font-bold underline cursor-pointer">
                Coba Lagi
              </button>
            )}
          </div>
        )}

        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
            <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-4 shadow-2xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Revenue 30 Hari</p>
              <p className="text-lg font-bold text-[#9A3412] mt-1 tabular-nums">{formatRupiah(analytics.totalRevenue30d)}</p>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-4 shadow-2xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Total Transaksi</p>
              <p className="text-lg font-bold text-[#1C1917] mt-1 tabular-nums">{analytics.totalTransactions30d}</p>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-4 shadow-2xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Rata-rata Order</p>
              <p className="text-lg font-bold text-[#78350F] mt-1 tabular-nums">{formatRupiah(analytics.avgOrderValue)}</p>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-4 shadow-2xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">Tren Mingguan</p>
              <p
                className={`text-lg font-bold mt-1 tabular-nums ${
                  analytics.weekComparison.changePercent >= 0 ? 'text-[#15803D]' : 'text-[#B91C1C]'
                }`}
              >
                {analytics.weekComparison.changePercent >= 0 ? '+' : ''}
                {analytics.weekComparison.changePercent}%
              </p>
            </div>
          </div>
        )}

        {insights && (
          <>
            <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-5 shadow-2xs animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-lg bg-[#FDF6E2] border border-[#E7E0D3] flex items-center justify-center text-[#9A3412]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </span>
                <h2 className="text-base font-bold text-[#1C1917]">Ringkasan Eksekutif AI</h2>
              </div>
              <p className="text-sm text-[#57534E] leading-relaxed">{insights.ringkasan}</p>
            </div>

            <div className="space-y-3">
              <h2 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9A3412]">
                  <path d="M9 18h6" /><path d="M10 22h4" />
                  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                </svg>
                Poin Wawasan Utama
              </h2>
              {insights.insights.map((insight, i) => {
                const style = tipeStyles[insight.tipe] || tipeStyles.info;
                return (
                  <div
                    key={i}
                    className={`rounded-2xl p-4.5 border ${style.bg} ${style.border} shadow-2xs animate-fade-in`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg}`}>
                        {iconMap[insight.ikon] || iconMap.lightbulb}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#1C1917]">{insight.judul}</h3>
                        <p className="text-xs text-[#57534E] mt-1 leading-relaxed">{insight.deskripsi}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {insights.saran_aksi && insights.saran_aksi.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9A3412]">
                    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                  </svg>
                  Rekomendasi Tindakan Strategis
                </h2>
                {insights.saran_aksi.map((saran, i) => {
                  const pStyle = priorityStyles[saran.prioritas] || priorityStyles.rendah;
                  return (
                    <div key={i} className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-4 shadow-2xs animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#1C1917]">{saran.aksi}</p>
                          <p className="text-xs text-[#78716C] mt-1">Estimasi dampak: {saran.estimasi_dampak}</p>
                        </div>
                        <span className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}>
                          {saran.prioritas}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {!loading && !aiLoading && !insights && !error && analytics && analytics.totalTransactions30d === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-[#FDF6E2] border border-[#E7E0D3] flex items-center justify-center mb-3 text-[#9A3412]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <p className="text-base font-bold text-[#1C1917]">Belum cukup data transaksi untuk analisis</p>
            <p className="text-xs text-[#78716C] mt-1">Lakukan transaksi penjualan terlebih dahulu agar AI dapat mendeteksi pola bisnis toko Anda</p>
          </div>
        )}
      </div>
    </div>
  );
}
