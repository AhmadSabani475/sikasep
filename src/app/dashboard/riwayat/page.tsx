'use client';

import { useState, useEffect } from 'react';
import { formatRupiah } from '@/lib/mock-data';
import type { Transaction } from '@/types';
import { useAuth } from '@/components/AuthProvider';
import { getTransactionsToday, getTodayTotal } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';

export default function RiwayatPage() {
  const { store } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const formatLocalTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const loadData = async () => {
    if (store) {
      const [txs, stats] = await Promise.all([
        getTransactionsToday(store.id),
        getTodayTotal(store.id)
      ]);
      setTransactions(txs);
      setTodayTotal(stats.total);
      setTodayCount(stats.count);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    if (store) {
      const supabase = createClient();
      const channel = supabase
        .channel('public:transactions')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'transactions', filter: `store_id=eq.${store.id}` },
          () => {
            loadData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [store]);

  const todayItemCount = transactions.reduce(
    (sum, tx) => sum + (tx.items?.length || 0),
    0
  );

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Riwayat Transaksi</h1>
            <p className="text-xs text-text-muted mt-0.5">Hari ini</p>
          </div>
        </div>
      </header>
      <div className="px-6 py-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-2xl p-4 col-span-3 sm:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-primary-500/15 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-400" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <p className="text-xs text-text-muted">Omzet Hari Ini</p>
            </div>
            <p className="text-2xl font-bold text-primary-400">{formatRupiah(todayTotal)}</p>
          </div>
          <div className="glass rounded-2xl p-4 col-span-1.5 sm:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-accent-500/15 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-400" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M6 8h.01" />
                  <path d="M10 8h.01" />
                  <path d="M14 8h.01" />
                </svg>
              </div>
              <p className="text-xs text-text-muted">Transaksi</p>
            </div>
            <p className="text-2xl font-bold text-text-primary">{todayCount}</p>
          </div>
          <div className="glass rounded-2xl p-4 col-span-1.5 sm:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-surface-600 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </svg>
              </div>
              <p className="text-xs text-text-muted">Item Terjual</p>
            </div>
            <p className="text-2xl font-bold text-text-primary">{todayItemCount}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="w-8 h-8 text-primary-400 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <div
                  key={tx.id}
                  className="glass rounded-2xl overflow-hidden animate-fade-in hover:bg-white/[0.02] transition-all"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <button
                    onClick={() => toggleExpand(tx.id)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-400" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {tx.items?.length || 0} item
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {formatLocalTime(tx.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-primary-400">
                        {formatRupiah(tx.total_amount)}
                      </p>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-text-muted transition-transform ${
                          expandedId === tx.id ? 'rotate-180' : ''
                        }`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>
                  {expandedId === tx.id && (
                    <div className="px-5 pb-4 border-t border-white/5 pt-3 animate-fade-in">
                      <div className="flex justify-end mb-3">
                        <button
                          onClick={() => {
                            const printContent = document.getElementById(`print-receipt-${tx.id}`);
                            const originalBody = document.body.innerHTML;
                            if (printContent) {
                              document.body.innerHTML = printContent.innerHTML;
                              window.print();
                              document.body.innerHTML = originalBody;
                              window.location.reload();
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-700 text-xs text-text-primary hover:bg-surface-600 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9" />
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <rect x="6" y="14" width="12" height="8" />
                          </svg>
                          Cetak Struk
                        </button>
                      </div>

                      <div id={`print-receipt-${tx.id}`}>
                        {tx.raw_transcript && (
                          <div className="mb-3 px-3 py-2 rounded-lg bg-surface-700/50 print:hidden">
                            <p className="text-xs text-text-muted">
                              <span className="font-medium text-text-secondary">Ucapan:</span>{' '}
                              &ldquo;{tx.raw_transcript}&rdquo;
                            </p>
                          </div>
                        )}
                        <div className="hidden print:block text-center mb-4 text-black">
                          <h2 className="text-lg font-bold">Sikasep</h2>
                          <p className="text-xs">{formatLocalTime(tx.created_at)}</p>
                        </div>
                        <table className="w-full text-xs print:text-black">
                        <thead>
                          <tr className="text-text-muted">
                            <th className="text-left py-1.5 font-medium">Item</th>
                            <th className="text-center py-1.5 font-medium w-12">Qty</th>
                            <th className="text-right py-1.5 font-medium w-20">Harga</th>
                            <th className="text-right py-1.5 font-medium w-24">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tx.items?.map((item) => (
                            <tr key={item.id} className="border-t border-white/[0.03]">
                              <td className="py-2 text-text-primary">{item.item_name}</td>
                              <td className="py-2 text-center text-text-secondary">{item.quantity}</td>
                              <td className="py-2 text-right text-text-secondary">
                                {formatRupiah(item.unit_price)}
                              </td>
                              <td className="py-2 text-right text-text-primary font-medium">
                                {formatRupiah(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-white/5">
                            <td colSpan={3} className="py-2 text-right font-medium text-text-secondary">
                              Total
                            </td>
                            <td className="py-2 text-right font-bold text-primary-400">
                              {formatRupiah(tx.total_amount)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {transactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <p className="text-sm text-text-secondary font-medium">Belum ada transaksi hari ini</p>
                <p className="text-xs text-text-muted mt-1">Transaksi akan muncul di sini setelah disimpan</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
