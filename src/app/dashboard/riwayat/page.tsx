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
        getTodayTotal(store.id),
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
    <div className="flex flex-col h-full bg-[#FFFBEB] text-[#1C1917]">
      <header className="px-6 py-5 border-b border-[#E7E0D3] bg-[#FFFBEB]/90 backdrop-blur-xs sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1C1917]">Riwayat Transaksi</h1>
            <p className="text-xs text-[#78716C] mt-0.5">Catatan pesanan dan pembayaran kasir hari ini</p>
          </div>
        </div>
      </header>

      <div className="px-6 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#FDF6E2] border border-[#E7E0D3] flex items-center justify-center text-[#9A3412]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">Omzet Hari Ini</p>
            </div>
            <p className="text-2xl font-bold text-[#9A3412] tabular-nums">{formatRupiah(todayTotal)}</p>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#FDF6E2] border border-[#E7E0D3] flex items-center justify-center text-[#B45309]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M6 8h.01" />
                  <path d="M10 8h.01" />
                  <path d="M14 8h.01" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">Transaksi</p>
            </div>
            <p className="text-2xl font-bold text-[#1C1917] tabular-nums">{todayCount}</p>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#FDF6E2] border border-[#E7E0D3] flex items-center justify-center text-[#57534E]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">Item Terjual</p>
            </div>
            <p className="text-2xl font-bold text-[#1C1917] tabular-nums">{todayItemCount}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="w-8 h-8 text-[#9A3412] animate-spin" viewBox="0 0 24 24" fill="none">
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
                  className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl overflow-hidden hover:border-[#9A3412]/40 transition-colors shadow-2xs animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <button
                    onClick={() => toggleExpand(tx.id)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer min-h-[56px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FDF6E2] border border-[#E7E0D3] flex items-center justify-center text-[#9A3412] shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1C1917]">
                          {tx.items?.length || 0} item pesanan
                        </p>
                        <p className="text-xs text-[#78716C] mt-0.5">
                          {formatLocalTime(tx.created_at)} WIB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-base font-bold text-[#9A3412] tabular-nums">
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
                        className={`text-[#78716C] transition-transform ${
                          expandedId === tx.id ? 'rotate-180' : ''
                        }`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>
                  {expandedId === tx.id && (
                    <div className="px-5 pb-5 border-t border-[#F5EBE1] pt-4 animate-fade-in bg-[#FFFBEB]/40">
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
                          className="flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl bg-[#FDF6E2] hover:bg-[#E7E0D3] text-xs font-semibold text-[#1C1917] border border-[#E7E0D3] transition-colors cursor-pointer"
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
                          <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-[#FFFBEB] border border-[#E7E0D3] print:hidden">
                            <p className="text-xs text-[#78716C]">
                              <span className="font-semibold text-[#1C1917]">Ucapan Suara:</span>{' '}
                              &ldquo;{tx.raw_transcript}&rdquo;
                            </p>
                          </div>
                        )}
                        <div className="hidden print:block text-center mb-4 text-black font-mono">
                          <h2 className="text-base font-bold">SIKASEP PURWAKARTA</h2>
                          <p className="text-xs">{formatLocalTime(tx.created_at)}</p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs print:text-black">
                            <thead>
                              <tr className="text-[#78716C] border-b border-[#E7E0D3]">
                                <th className="text-left py-2 font-semibold">Item</th>
                                <th className="text-center py-2 font-semibold w-12">Qty</th>
                                <th className="text-right py-2 font-semibold w-24">Harga</th>
                                <th className="text-right py-2 font-semibold w-28">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tx.items?.map((item) => (
                                <tr key={item.id} className="border-b border-[#F5EBE1]">
                                  <td className="py-2.5 font-medium text-[#1C1917]">{item.item_name}</td>
                                  <td className="py-2.5 text-center text-[#57534E] tabular-nums">{item.quantity}</td>
                                  <td className="py-2.5 text-right text-[#57534E] tabular-nums">
                                    {formatRupiah(item.unit_price)}
                                  </td>
                                  <td className="py-2.5 text-right font-semibold text-[#1C1917] tabular-nums">
                                    {formatRupiah(item.subtotal)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-[#E7E0D3]">
                                <td colSpan={3} className="pt-3 pb-1 text-right font-bold text-[#57534E]">
                                  Total
                                </td>
                                <td className="pt-3 pb-1 text-right font-bold text-sm text-[#9A3412] tabular-nums">
                                  {formatRupiah(tx.total_amount)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {transactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-8">
                <div className="w-14 h-14 rounded-2xl bg-[#FDF6E2] border border-[#E7E0D3] flex items-center justify-center mb-3 text-[#9A3412]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <p className="text-base font-bold text-[#1C1917]">Belum ada transaksi hari ini</p>
                <p className="text-xs text-[#78716C] mt-1">Transaksi kasir akan otomatis tercatat di sini setelah pembayaran diselesaikan</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
