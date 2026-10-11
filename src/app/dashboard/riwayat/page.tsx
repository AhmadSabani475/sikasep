'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatRupiah } from '@/lib/mock-data';
import type { Transaction, MenuItem } from '@/types';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import {
  getTransactionsToday,
  getTodayTotal,
  cancelTransaction,
  updateTransaction,
  updateTransactionItems,
  getMenuItems,
} from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';

export default function RiwayatPage() {
  const { store } = useAuth();
  const toast = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [todayTotal, setTodayTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  // State Edit Item Modal / Inline
  const [editingTx, setEditingTx] = useState<{
    id: string;
    items: Array<{
      id?: string;
      menu_item_id: string | null;
      item_name: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }>;
  } | null>(null);

  // State Modal Konfirmasi Batal
  const [cancelingTxId, setCancelingTxId] = useState<string | null>(null);

  const formatLocalTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const loadData = useCallback(async () => {
    if (store) {
      try {
        const [txs, stats, menus] = await Promise.all([
          getTransactionsToday(store.id),
          getTodayTotal(store.id),
          getMenuItems(store.id),
        ]);
        setTransactions(txs);
        setTodayTotal(stats.total);
        setTodayCount(stats.count);
        setMenuItems(menus);
      } catch (err) {
        console.error('Error loading riwayat data:', err);
      }
    }
    setLoading(false);
  }, [store]);

  useEffect(() => {
    loadData();
    if (store) {
      const supabase = createClient();
      const channel = supabase
        .channel('public:transactions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions', filter: `store_id=eq.${store.id}` },
          () => {
            loadData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [store, loadData]);

  // Transaksi aktif (bukan dibatalkan) untuk hitungan item terjual
  const activeTransactions = transactions.filter((tx) => tx.status !== 'dibatalkan');
  const todayItemCount = activeTransactions.reduce(
    (sum, tx) => sum + (tx.items?.reduce((s, i) => s + i.quantity, 0) || 0),
    0
  );

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setEditingTx(null);
  };

  // 1. Aksi Ubah Metode Bayar
  const handleTogglePaymentMethod = async (tx: Transaction) => {
    const nextMethod: 'tunai' | 'qris' = tx.payment_method === 'qris' ? 'tunai' : 'qris';
    try {
      const updated = await updateTransaction(tx.id, { payment_method: nextMethod });
      if (updated) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === tx.id ? { ...t, payment_method: nextMethod, updated_at: updated.updated_at } : t))
        );
        toast.success(`Metode bayar diubah ke ${nextMethod.toUpperCase()}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengubah metode pembayaran');
    }
  };

  // 2. Aksi Batal Transaksi
  const handleConfirmCancel = async () => {
    if (!cancelingTxId) return;
    try {
      const ok = await cancelTransaction(cancelingTxId);
      if (ok) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === cancelingTxId
              ? { ...t, status: 'dibatalkan', updated_at: new Date().toISOString() }
              : t
          )
        );
        if (store) {
          const stats = await getTodayTotal(store.id);
          setTodayTotal(stats.total);
          setTodayCount(stats.count);
        }
        toast.success('Transaksi berhasil dibatalkan');
      } else {
        toast.error('Gagal membatalkan transaksi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat membatalkan transaksi');
    } finally {
      setCancelingTxId(null);
    }
  };

  // 3. Aksi Edit Item
  const handleStartEdit = (tx: Transaction) => {
    if (!tx.items) return;
    setEditingTx({
      id: tx.id,
      items: tx.items.map((i) => ({
        id: i.id,
        menu_item_id: i.menu_item_id,
        item_name: i.item_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        subtotal: i.subtotal,
      })),
    });
  };

  const handleUpdateItemQty = (index: number, delta: number) => {
    if (!editingTx) return;
    const newItems = [...editingTx.items];
    const current = newItems[index];
    const newQty = current.quantity + delta;

    if (newQty <= 0) {
      // Hapus item
      newItems.splice(index, 1);
    } else {
      newItems[index] = {
        ...current,
        quantity: newQty,
        subtotal: newQty * current.unit_price,
      };
    }
    setEditingTx({ ...editingTx, items: newItems });
  };

  const handleAddItemToEdit = (menuItem: MenuItem) => {
    if (!editingTx) return;
    const existingIndex = editingTx.items.findIndex(
      (i) => i.item_name.toLowerCase() === menuItem.name.toLowerCase()
    );
    const newItems = [...editingTx.items];
    if (existingIndex >= 0) {
      const cur = newItems[existingIndex];
      newItems[existingIndex] = {
        ...cur,
        quantity: cur.quantity + 1,
        subtotal: (cur.quantity + 1) * cur.unit_price,
      };
    } else {
      newItems.push({
        menu_item_id: menuItem.id,
        item_name: menuItem.name,
        quantity: 1,
        unit_price: menuItem.price,
        subtotal: menuItem.price,
      });
    }
    setEditingTx({ ...editingTx, items: newItems });
  };

  const handleSaveEditItems = async () => {
    if (!editingTx) return;
    if (editingTx.items.length === 0) {
      toast.error('Pesanan tidak boleh kosong. Gunakan "Batalkan" jika ingin membatalkan transaksi.');
      return;
    }

    const newTotal = editingTx.items.reduce((s, i) => s + i.subtotal, 0);
    try {
      const ok = await updateTransactionItems(editingTx.id, newTotal, editingTx.items);
      if (ok) {
        toast.success('Item pesanan berhasil diperbarui');
        setEditingTx(null);
        await loadData();
      } else {
        toast.error('Gagal memperbarui item pesanan');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat memperbarui pesanan');
    }
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

      {/* Summary Cards */}
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
              <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">Transaksi Aktif</p>
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

      {/* Transaction List */}
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
              {transactions.map((tx, index) => {
                const isCancelled = tx.status === 'dibatalkan';
                const paymentMethod = tx.payment_method || 'tunai';
                const source = tx.source || 'normal';

                return (
                  <div
                    key={tx.id}
                    className={`bg-[#FFFFFF] border rounded-2xl overflow-hidden transition-colors shadow-2xs animate-fade-in ${
                      isCancelled
                        ? 'border-[#E7E0D3] opacity-75 bg-[#F9F7F4]'
                        : 'border-[#E7E0D3] hover:border-[#9A3412]/40'
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <button
                      onClick={() => toggleExpand(tx.id)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer min-h-[56px]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                            isCancelled
                              ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
                              : 'bg-[#FDF6E2] border-[#E7E0D3] text-[#9A3412]'
                          }`}
                        >
                          {isCancelled ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-bold ${isCancelled ? 'text-[#78716C] line-through' : 'text-[#1C1917]'}`}>
                              {tx.items?.length || 0} item pesanan
                            </p>
                            {/* Status Badge */}
                            {isCancelled ? (
                              <span className="text-[10px] font-bold text-[#991B1B] bg-[#FEE2E2] px-2 py-0.5 rounded-full border border-[#FCA5A5]">
                                Dibatalkan
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                                Selesai
                              </span>
                            )}
                            {/* Payment Method Badge */}
                            <span className="text-[10px] font-bold text-[#78350F] bg-[#FDF6E2] px-2 py-0.5 rounded-full border border-[#E7E0D3] uppercase">
                              {paymentMethod}
                            </span>
                            {/* Source Badge */}
                            {source === 'ramai' && (
                              <span className="text-[10px] font-bold text-[#9A3412] bg-[#FFFBEB] px-2 py-0.5 rounded-full border border-[#E7E0D3] hidden sm:inline">
                                Mode Ramai
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#78716C] mt-0.5">
                            {formatLocalTime(tx.created_at)} WIB
                            {tx.updated_at && ' (diedit)'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <p
                          className={`text-base font-bold tabular-nums ${
                            isCancelled ? 'text-[#A8A29E] line-through' : 'text-[#9A3412]'
                          }`}
                        >
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

                    {/* Expanded Detail Panel */}
                    {expandedId === tx.id && (
                      <div className="px-5 pb-5 border-t border-[#F5EBE1] pt-4 animate-fade-in bg-[#FFFBEB]/40">
                        {/* Aksi Kelola Transaksi (SPEC §7.6) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E7E0D3]">
                          <div className="text-xs text-[#78716C]">
                            {isCancelled ? (
                              <span className="text-[#991B1B] font-semibold">
                                Transaksi ini telah dibatalkan dan tidak dihitung ke omzet.
                              </span>
                            ) : (
                              <span>
                                Metode: <strong className="text-[#1C1917] uppercase">{paymentMethod}</strong>
                              </span>
                            )}
                          </div>

                          {!isCancelled && (
                            <div className="flex flex-wrap items-center gap-2">
                              {/* 1. Ubah Metode Bayar */}
                              <button
                                type="button"
                                onClick={() => handleTogglePaymentMethod(tx)}
                                className="flex items-center gap-1.5 px-3 py-2 min-h-[48px] rounded-xl bg-white hover:bg-[#FDF6E2] text-xs font-semibold text-[#1C1917] border border-[#E7E0D3] transition-colors cursor-pointer"
                                title="Ubah metode antara Tunai dan QRIS"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m16 3 4 4-4 4" />
                                  <path d="M20 7H4" />
                                  <path d="m8 21-4-4 4-4" />
                                  <path d="M4 17h16" />
                                </svg>
                                <span>Ubah ke {paymentMethod === 'qris' ? 'Tunai' : 'QRIS'}</span>
                              </button>

                              {/* 2. Edit Item */}
                              <button
                                type="button"
                                onClick={() => handleStartEdit(tx)}
                                className="flex items-center gap-1.5 px-3 py-2 min-h-[48px] rounded-xl bg-white hover:bg-[#FDF6E2] text-xs font-semibold text-[#1C1917] border border-[#E7E0D3] transition-colors cursor-pointer"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                </svg>
                                <span>Edit Item</span>
                              </button>

                              {/* 3. Batalkan Transaksi */}
                              <button
                                type="button"
                                onClick={() => setCancelingTxId(tx.id)}
                                className="flex items-center gap-1.5 px-3 py-2 min-h-[48px] rounded-xl bg-[#FEE2E2] hover:bg-[#FCA5A5] text-xs font-semibold text-[#991B1B] border border-[#FCA5A5] transition-colors cursor-pointer"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="15" y1="9" x2="9" y2="15" />
                                  <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                <span>Batalkan</span>
                              </button>

                              {/* 4. Cetak Struk */}
                              <button
                                type="button"
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
                                className="flex items-center gap-1.5 px-3 py-2 min-h-[48px] rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] text-xs font-semibold text-[#FFFBEB] transition-colors cursor-pointer"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="6 9 6 2 18 2 18 9" />
                                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                  <rect x="6" y="14" width="12" height="8" />
                                </svg>
                                <span>Cetak Struk</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Editor Item Inline jika sedang mode edit */}
                        {editingTx && editingTx.id === tx.id ? (
                          <div className="bg-white rounded-xl p-4 border border-[#9A3412]/30 mb-4 animate-fade-in space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-[#E7E0D3]">
                              <p className="text-xs font-bold text-[#1C1917]">Edit Item Pesanan</p>
                              <span className="text-[11px] text-[#78716C]">Gunakan + / − untuk ubah jumlah</span>
                            </div>

                            <div className="space-y-2">
                              {editingTx.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-[#FFFBEB]/50 border border-[#E7E0D3]">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-[#1C1917] truncate">{item.item_name}</p>
                                    <p className="text-[11px] text-[#57534E] tabular-nums">
                                      {formatRupiah(item.unit_price)} × {item.quantity} = {formatRupiah(item.subtotal)}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemQty(idx, -1)}
                                      className="w-10 h-10 rounded-lg bg-white hover:bg-[#FEE2E2] text-[#B91C1C] border border-[#E7E0D3] font-bold text-sm flex items-center justify-center transition-all cursor-pointer"
                                      aria-label={`Kurangi ${item.item_name}`}
                                    >
                                      −
                                    </button>
                                    <span className="w-8 text-center font-bold text-xs tabular-nums text-[#1C1917]">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemQty(idx, 1)}
                                      className="w-10 h-10 rounded-lg bg-white hover:bg-[#DCFCE7] text-[#166534] border border-[#E7E0D3] font-bold text-sm flex items-center justify-center transition-all cursor-pointer"
                                      aria-label={`Tambah ${item.item_name}`}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Tambah item dari menu cepat */}
                            {menuItems.length > 0 && (
                              <div className="pt-2">
                                <p className="text-[11px] font-semibold text-[#78716C] mb-1.5">Tambah menu lain:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {menuItems.slice(0, 6).map((m) => (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => handleAddItemToEdit(m)}
                                      className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-[#FDF6E2] hover:bg-[#E7E0D3] text-[#78350F] border border-[#E7E0D3] cursor-pointer"
                                    >
                                      + {m.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-[#E7E0D3]">
                              <div>
                                <p className="text-[10px] text-[#78716C] uppercase font-bold">Total Baru:</p>
                                <p className="text-sm font-extrabold text-[#9A3412] tabular-nums">
                                  {formatRupiah(editingTx.items.reduce((s, i) => s + i.subtotal, 0))}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingTx(null)}
                                  className="px-3 py-2 min-h-[44px] rounded-xl text-xs font-semibold text-[#57534E] hover:bg-gray-100 cursor-pointer"
                                >
                                  Batal Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveEditItems}
                                  className="px-4 py-2 min-h-[44px] rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] text-xs font-bold text-[#FFFBEB] cursor-pointer shadow-xs"
                                >
                                  Simpan Perubahan
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {/* Struk & Detail Table */}
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
                            <p className="text-xs">Metode: {paymentMethod.toUpperCase()}</p>
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
                );
              })}
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

      {/* Modal Dialog Konfirmasi Batal Transaksi */}
      {cancelingTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#E7E0D3] shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#991B1B] mx-auto flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C1917]">Batalkan Transaksi Ini?</h3>
              <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
                Transaksi akan ditandai sebagai dibatalkan dan tidak lagi dihitung dalam omzet harian. Riwayat transaksi tetap tersimpan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelingTxId(null)}
                className="min-h-[48px] rounded-xl border border-[#E7E0D3] text-xs font-semibold text-[#57534E] hover:bg-[#FDF6E2] cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="min-h-[48px] rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-xs font-bold text-[#FFFBEB] cursor-pointer shadow-sm"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
