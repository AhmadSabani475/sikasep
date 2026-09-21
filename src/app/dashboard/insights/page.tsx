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

const tipeStyles: Record<string, { bg: string; border: string; text: string }> = {
  positive: { bg: 'bg-primary-500/10', border: 'border-primary-500/20', text: 'text-primary-400' },
  warning: { bg: 'bg-accent-500/10', border: 'border-accent-500/20', text: 'text-accent-400' },
  suggestion: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  info: { bg: 'bg-surface-600/50', border: 'border-white/10', text: 'text-text-secondary' },
};

const priorityStyles: Record<string, { bg: string; text: string }> = {
  tinggi: { bg: 'bg-danger-500/15', text: 'text-danger-500' },
  sedang: { bg: 'bg-accent-500/15', text: 'text-accent-400' },
  rendah: { bg: 'bg-surface-600', text: 'text-text-secondary' },
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
      setError('Gagal memuat insights AI. Coba lagi nanti.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <header className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs">
                🧠
              </span>
              AI Insights
            </h1>
            <p className="text-xs text-text-muted mt-0.5">Saran bisnis cerdas dari AI berdasarkan data toko Anda</p>
          </div>
          {analytics && (
            <button
              onClick={() => fetchInsights(analytics)}
              disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm text-text-secondary hover:text-primary-400 hover:bg-white/5 transition-all disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={aiLoading ? 'animate-spin' : ''}>
                <polyline points="1 4 1 10 7 10" />
                <polyline points="23 20 23 14 17 14" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
              Refresh
            </button>
          )}
        </div>
      </header>

      <div className="p-6 space-y-6">
        {(loading || aiLoading) && !insights && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-primary-500/20 animate-spin" style={{ borderTopColor: 'var(--color-primary-400)' }} />
              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <span className="text-2xl">🧠</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">AI sedang menganalisis data Anda...</p>
              <p className="text-xs text-text-muted mt-1">Ini mungkin memakan waktu beberapa detik</p>
            </div>
          </div>
        )}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm animate-fade-in text-center">
            {error}
            {analytics && (
              <button onClick={() => fetchInsights(analytics)} className="block mt-2 mx-auto text-xs font-medium hover:underline">
                Coba Lagi
              </button>
            )}
          </div>
        )}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
            <div className="glass rounded-2xl p-4">
              <p className="text-xs text-text-muted">Revenue 30 hari</p>
              <p className="text-lg font-bold text-primary-400 mt-1">{formatRupiah(analytics.totalRevenue30d)}</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="text-xs text-text-muted">Total Transaksi</p>
              <p className="text-lg font-bold text-text-primary mt-1">{analytics.totalTransactions30d}</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="text-xs text-text-muted">Rata-rata / Transaksi</p>
              <p className="text-lg font-bold text-accent-400 mt-1">{formatRupiah(analytics.avgOrderValue)}</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="text-xs text-text-muted">Tren Mingguan</p>
              <p className={`text-lg font-bold mt-1 ${analytics.weekComparison.changePercent >= 0 ? 'text-primary-400' : 'text-danger-500'}`}>
                {analytics.weekComparison.changePercent >= 0 ? '+' : ''}{analytics.weekComparison.changePercent}%
              </p>
            </div>
          </div>
        )}
        {insights && (
          <>
            <div className="glass rounded-2xl p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">✨</span>
                <h2 className="text-sm font-semibold">Ringkasan AI</h2>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{insights.ringkasan}</p>
            </div>
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-400">
                  <path d="M9 18h6" /><path d="M10 22h4" />
                  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                </svg>
                Insights
              </h2>
              {insights.insights.map((insight, i) => {
                const style = tipeStyles[insight.tipe] || tipeStyles.info;
                return (
                  <div
                    key={i}
                    className={`rounded-2xl p-4 border ${style.bg} ${style.border} animate-fade-in`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 w-9 h-9 rounded-xl ${style.bg} flex items-center justify-center ${style.text}`}>
                        {iconMap[insight.ikon] || iconMap.lightbulb}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-text-primary">{insight.judul}</h3>
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">{insight.deskripsi}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {insights.saran_aksi && insights.saran_aksi.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-400">
                    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                  </svg>
                  Saran Aksi
                </h2>
                {insights.saran_aksi.map((saran, i) => {
                  const pStyle = priorityStyles[saran.prioritas] || priorityStyles.rendah;
                  return (
                    <div key={i} className="glass rounded-2xl p-4 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary">{saran.aksi}</p>
                          <p className="text-xs text-text-muted mt-1">Estimasi dampak: {saran.estimasi_dampak}</p>
                        </div>
                        <span className={`shrink-0 text-[10px] px-2 py-1 rounded-full font-medium ${pStyle.bg} ${pStyle.text}`}>
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
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-sm text-text-secondary font-medium">Belum cukup data untuk analisis</p>
            <p className="text-xs text-text-muted mt-1">Lakukan beberapa transaksi terlebih dahulu agar AI bisa menganalisis pola bisnis Anda</p>
          </div>
        )}
      </div>
    </div>
  );
}
