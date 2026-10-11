'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import MicButton from '@/components/MicButton';
import TransactionCard from '@/components/TransactionCard';
import SuccessAnimation from '@/components/SuccessAnimation';
import QuickMenuGrid from '@/components/QuickMenuGrid';
import PaymentModal from '@/components/PaymentModal';
import ReceiptModal from '@/components/ReceiptModal';
import { formatRupiah, mockMenuItems } from '@/lib/mock-data';
import type { ParsedItem, ParsedTransactionResult, MenuItem } from '@/types';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import { getMenuItems, createTransaction, cancelTransaction, getTodayTotal } from '@/lib/supabase/queries';
import { createMicGate } from '@/lib/voice/mic-gate';
import { playCueSound } from '@/lib/voice/cue';
import { createVoiceOrderPipeline, UNDO_WINDOW_MS } from '@/lib/voice/order-policy';

export default function KasirPage() {
  const { store } = useAuth();
  const toast = useToast();
  const [transcript, setTranscript] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedTransactionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setSavedCount] = useState(0);

  const [todayTotal, setTodayTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [error, setError] = useState<string | null>(null);

  // Voice v2 Settings & Modes
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRamai, setIsRamai] = useState(false);
  const [ramaiPaymentMethod, setRamaiPaymentMethod] = useState<'tunai' | 'qris'>('tunai');

  // Status visual voice
  const [voiceBanner, setVoiceBanner] = useState<{ message: string; type: 'info' | 'warn' | 'success' } | null>(null);

  // Undo (Batalkan) 8 detik untuk Mode Ramai
  const [undoTx, setUndoTx] = useState<{
    id: string;
    total: number;
    itemCount: number;
    paymentMethod: 'tunai' | 'qris';
    expiresAt: number;
  } | null>(null);
  const [undoCountdown, setUndoCountdown] = useState<number>(8);

  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSavedAmount, setLastSavedAmount] = useState('');

  // Modals for Normal Mode
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [pendingItems, setPendingItems] = useState<ParsedItem[]>([]);
  const [pendingTotal, setPendingTotal] = useState<number>(0);
  const [lastPaymentDetails, setLastPaymentDetails] = useState<{
    method: 'tunai' | 'qris';
    paidAmount: number;
    changeAmount: number;
    transactionId?: string;
    createdAt?: string;
  } | null>(null);

  // Mic Gate instance
  const micGate = useMemo(() => createMicGate(), []);

  // Refs for current states used in callbacks
  const isRamaiRef = useRef(isRamai);
  const soundEnabledRef = useRef(soundEnabled);
  const ramaiPaymentMethodRef = useRef(ramaiPaymentMethod);
  const menuItemsRef = useRef(menuItems);
  const storeRef = useRef(store);

  useEffect(() => {
    isRamaiRef.current = isRamai;
  }, [isRamai]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    ramaiPaymentMethodRef.current = ramaiPaymentMethod;
  }, [ramaiPaymentMethod]);

  useEffect(() => {
    menuItemsRef.current = menuItems;
  }, [menuItems]);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  // Load data awal kasir
  useEffect(() => {
    async function loadInitialData() {
      if (store) {
        try {
          const [items, stats] = await Promise.all([
            getMenuItems(store.id),
            getTodayTotal(store.id),
          ]);
          setMenuItems(items.length > 0 ? items : mockMenuItems);
          setTodayTotal(stats.total);
          setTodayCount(stats.count);
        } catch {
          setMenuItems(mockMenuItems);
        }
      }
    }
    loadInitialData();
  }, [store]);

  // Timer hitung mundur tombol Batalkan (8 detik)
  useEffect(() => {
    if (!undoTx) return;

    const interval = setInterval(() => {
      const remainingMs = undoTx.expiresAt - Date.now();
      if (remainingMs <= 0) {
        setUndoTx(null);
        clearInterval(interval);
      } else {
        setUndoCountdown(Math.ceil(remainingMs / 1000));
      }
    }, 250);

    return () => clearInterval(interval);
  }, [undoTx]);

  // Fungsi batalkan transaksi simpan otomatis
  const handleUndoAutoSave = async () => {
    if (!undoTx) return;
    const target = undoTx;
    setUndoTx(null);

    try {
      if (storeRef.current && !target.id.startsWith('DEMO-')) {
        await cancelTransaction(target.id);
        const stats = await getTodayTotal(storeRef.current.id);
        setTodayTotal(stats.total);
        setTodayCount(stats.count);
      } else {
        setTodayTotal((prev) => Math.max(0, prev - target.total));
        setTodayCount((prev) => Math.max(0, prev - 1));
      }

      toast.success('Transaksi berhasil dibatalkan');
      setVoiceBanner({ message: 'Transaksi dibatalkan', type: 'info' });
      setTimeout(() => setVoiceBanner(null), 3500);
    } catch (err) {
      console.error('Gagal membatalkan transaksi:', err);
      toast.error('Gagal membatalkan transaksi');
    }
  };

  // Simpan otomatis di Mode Ramai
  const executeAutoSave = useCallback(
    async (parsed: ParsedTransactionResult, rawText: string) => {
      const currentStore = storeRef.current;
      const method = ramaiPaymentMethodRef.current;
      let txId = `TRX-${Date.now().toString().slice(-6)}`;

      const itemsToSave = parsed.items.map((item) => ({
        menu_item_id: item.menu_item_id || null,
        item_name: item.nama,
        quantity: item.jumlah,
        unit_price: item.harga_satuan,
        subtotal: item.subtotal,
      }));

      if (currentStore) {
        try {
          const tx = await createTransaction(
            currentStore.id,
            rawText,
            parsed.total,
            itemsToSave,
            {
              payment_method: method,
              status: 'selesai',
              source: 'ramai',
              cash_received: null,
              change_amount: null,
            }
          );
          if (tx?.id) {
            txId = tx.id;
          }
          const stats = await getTodayTotal(currentStore.id);
          setTodayTotal(stats.total);
          setTodayCount(stats.count);
        } catch (err) {
          console.error('Error auto-saving transaction:', err);
        }
      } else {
        setTodayTotal((prev) => prev + parsed.total);
        setTodayCount((prev) => prev + 1);
      }

      setSavedCount((c) => c + 1);
      setParsedResult(null);

      // Munculkan bar Batalkan selama 8 detik
      setUndoTx({
        id: txId,
        total: parsed.total,
        itemCount: parsed.items.length,
        paymentMethod: method,
        expiresAt: Date.now() + UNDO_WINDOW_MS,
      });
      setUndoCountdown(8);

      setVoiceBanner({
        message: `Tersimpan otomatis: ${formatRupiah(parsed.total)} (${method.toUpperCase()})`,
        type: 'success',
      });
      setTimeout(() => setVoiceBanner(null), 4000);

      // Mainkan chime audio singkat di dalam mic gate
      await micGate.playAppSound(() => playCueSound('success', soundEnabledRef.current));
    },
    [micGate]
  );

  // Setup Voice Pipeline dengan Deduper 3s & Decision Policy
  const voicePipeline = useMemo(() => {
    return createVoiceOrderPipeline({
      getMode: () => (isRamaiRef.current ? 'ramai' : 'normal'),
      getMenu: () => (menuItemsRef.current.length > 0 ? menuItemsRef.current : mockMenuItems),
      extract: async (text: string) => {
        const targetMenu = menuItemsRef.current.length > 0 ? menuItemsRef.current : mockMenuItems;
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: text,
            menuItems: targetMenu.map((m) => ({ nama: m.name, harga: m.price })),
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Gagal mengekstrak data');
        }

        const data: ParsedTransactionResult = await res.json();
        return data;
      },
      onAutoSave: async (parsed, rawText) => {
        await executeAutoSave(parsed, rawText);
      },
      onDraft: async (parsed, _rawText) => {
        setParsedResult(parsed);
        const hasUnreasonable = parsed.items.some((i) => i.jumlah > 20);
        const hasUnknown = parsed.item_tidak_dikenal && parsed.item_tidak_dikenal.length > 0;

        let msg = 'Pesanan masuk draf untuk ditinjau';
        if (hasUnreasonable) {
          msg = 'Jumlah > 20: masuk draf untuk ditinjau';
        } else if (hasUnknown) {
          msg = 'Ada item belum dikenal: masuk draf';
        }

        setVoiceBanner({ message: msg, type: 'info' });
        setTimeout(() => setVoiceBanner(null), 4000);

        await micGate.playAppSound(() => playCueSound('draft', soundEnabledRef.current));
      },
      onDuplicate: async () => {
        setVoiceBanner({ message: 'Pesanan identik diabaikan', type: 'warn' });
        setTimeout(() => setVoiceBanner(null), 3000);
        await micGate.playAppSound(() => playCueSound('duplicate', soundEnabledRef.current));
      },
      onIgnored: async () => {
        setVoiceBanner({ message: 'Tidak ada item menu yang dikenali', type: 'warn' });
        setTimeout(() => setVoiceBanner(null), 3000);
      },
    });
  }, [executeAutoSave, micGate]);

  // Handler penerima transkrip dari mic
  const handleTranscript = useCallback(
    async (text: string) => {
      setTranscript(text);
      setIsProcessing(true);
      setError(null);

      try {
        await voicePipeline.handleTranscript(text);
      } catch (err) {
        console.error(err);
        setError('Terjadi kesalahan saat memproses suara dengan AI.');
      } finally {
        setIsProcessing(false);
      }
    },
    [voicePipeline]
  );

  // Penanganan simpan manual dari draf (Mode Normal)
  const handleSave = useCallback((items: ParsedItem[], total: number) => {
    setPendingItems(items);
    setPendingTotal(total);
    setIsPaymentModalOpen(true);
  }, []);

  const handleConfirmPayment = async (details: {
    method: 'tunai' | 'qris';
    paidAmount: number;
    changeAmount: number;
  }) => {
    const items = pendingItems;
    const total = pendingTotal;
    const currentTranscript = transcript || 'Input manual kasir';
    let txId = `TRX-${Date.now().toString().slice(-6)}`;

    if (store) {
      setIsProcessing(true);
      try {
        const itemsToSave = items.map((item) => ({
          menu_item_id: item.menu_item_id || null,
          item_name: item.nama,
          quantity: item.jumlah,
          unit_price: item.harga_satuan,
          subtotal: item.subtotal,
        }));

        const tx = await createTransaction(
          store.id,
          currentTranscript,
          total,
          itemsToSave,
          {
            payment_method: details.method,
            status: 'selesai',
            source: 'normal',
            cash_received: details.paidAmount,
            change_amount: details.changeAmount,
          }
        );
        if (tx) {
          txId = tx.id ? tx.id.slice(0, 8).toUpperCase() : txId;
          const stats = await getTodayTotal(store.id);
          setTodayTotal(stats.total);
          setTodayCount(stats.count);
        }
      } catch (err) {
        console.error('Error saving transaction:', err);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setTodayTotal((prev) => prev + total);
      setTodayCount((prev) => prev + 1);
    }

    setSavedCount((c) => c + 1);
    setLastSavedAmount(formatRupiah(total));
    setLastPaymentDetails({
      ...details,
      transactionId: txId,
      createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    });

    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
    toast.success('Pembayaran berhasil diproses!');
    await micGate.playAppSound(() => playCueSound('success', soundEnabledRef.current));
  };

  const handleNewOrder = useCallback(() => {
    setParsedResult(null);
    setTranscript(null);
    setPendingItems([]);
    setPendingTotal(0);
    setIsReceiptModalOpen(false);
  }, []);

  const handleSelectMenuItem = useCallback((item: MenuItem) => {
    setParsedResult((prev) => {
      const existingItems = prev ? [...prev.items] : [];
      const index = existingItems.findIndex(
        (i) => i.nama.toLowerCase() === item.name.toLowerCase() || i.menu_item_id === item.id
      );

      if (index >= 0) {
        const current = existingItems[index];
        const newQty = current.jumlah + 1;
        existingItems[index] = {
          ...current,
          jumlah: newQty,
          subtotal: newQty * current.harga_satuan,
        };
      } else {
        existingItems.push({
          nama: item.name,
          jumlah: 1,
          harga_satuan: item.price,
          subtotal: item.price,
          menu_item_id: item.id,
        });
      }

      const total = existingItems.reduce((acc, curr) => acc + curr.subtotal, 0);

      return {
        items: existingItems,
        total,
        item_tidak_dikenal: prev ? prev.item_tidak_dikenal : [],
      };
    });
  }, []);

  const handleItemsChange = useCallback((newItems: ParsedItem[]) => {
    setParsedResult((prev) => {
      if (!prev) return null;
      if (newItems.length === 0) {
        return null;
      }
      const total = newItems.reduce((acc, curr) => acc + curr.subtotal, 0);
      return {
        ...prev,
        items: newItems,
        total,
      };
    });
  }, []);

  const handleAddUnknownItem = useCallback(
    async (itemName: string, price: number) => {
      if (!store) return;
      try {
        const { createMenuItem } = await import('@/lib/supabase/queries');
        const newItem = await createMenuItem(store.id, itemName, price);
        if (newItem) {
          setMenuItems((prev) => [...prev, newItem]);
          setParsedResult((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              item_tidak_dikenal: prev.item_tidak_dikenal.filter((u) => u !== itemName),
              items: prev.items.map((item) =>
                item.nama === itemName
                  ? { ...item, is_custom: false, menu_item_id: newItem.id }
                  : item
              ),
            };
          });
          toast.success(`${itemName} berhasil ditambahkan ke menu!`);
        }
      } catch (err) {
        console.error(err);
        toast.error('Gagal menambahkan menu');
      }
    },
    [store, toast]
  );

  const handleCancel = useCallback(() => {
    setParsedResult(null);
    setTranscript(null);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#FFFBEB] text-[#1C1917] relative">
      <SuccessAnimation
        show={showSuccess}
        amount={lastSavedAmount}
        onComplete={() => setShowSuccess(false)}
      />

      {/* Top Header POS */}
      <header className="px-5 py-4 md:px-8 bg-white border-b border-[#E7E0D3] shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-[#1C1917]">Kasir Sikasep</h1>
              <span className="text-[10px] font-bold text-[#9A3412] bg-[#FDF6E2] px-2 py-0.5 rounded-full border border-[#E7E0D3]">
                {isRamai ? 'Mode Ramai Aktif' : 'Mode Normal'}
              </span>
            </div>
            <p className="text-xs text-[#57534E] mt-0.5">
              Tap katalog cepat atau gunakan tombol suara untuk mencatat pesanan
            </p>
          </div>

          <div className="flex items-center gap-5">
            {/* Today Summary */}
            <div className="hidden sm:flex items-center gap-4 bg-[#FDF6E2] px-4 py-2 rounded-xl border border-[#E7E0D3]">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-[#78350F]">Omzet Hari Ini</p>
                <p className="text-sm font-extrabold text-[#9A3412] tabular-nums">
                  {formatRupiah(todayTotal)}
                </p>
              </div>
              <div className="w-px h-7 bg-[#E7E0D3]" />
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-[#78350F]">Transaksi</p>
                <p className="text-sm font-extrabold text-[#1C1917] tabular-nums">{todayCount}</p>
              </div>
            </div>

            {/* Quick Settings: Saklar Bunyi (SPEC §7.2 pengganti Suara AI) */}
            <div className="flex items-center gap-3">
              <label
                className="text-xs font-semibold text-[#57534E] cursor-pointer flex items-center gap-2 select-none min-h-[48px]"
                title="Bunyi lonceng audio kasir (Suara AI) saat pesanan selesai"
              >
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E7E0D3] text-[#9A3412] focus:ring-[#9A3412]/30 cursor-pointer"
                />
                <span className="font-semibold text-[#1C1917]">Bunyi</span>
                <span
                  className="text-[10px] text-[#78350F] bg-[#FDF6E2] px-2 py-0.5 rounded border border-[#E7E0D3] hidden sm:inline"
                  title="Notifikasi audio singkat tanpa feedback TTS (pengganti Suara AI)"
                >
                  Audio Chime
                </span>
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 md:px-8 space-y-6 max-w-7xl w-full mx-auto pb-24">
        {/* Mobile Today Stats Bar */}
        <div className="flex sm:hidden items-center justify-around bg-white border border-[#E7E0D3] rounded-xl p-3 shadow-2xs">
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-[#78350F]">Omzet Hari Ini</p>
            <p className="text-sm font-extrabold text-[#9A3412] tabular-nums">
              {formatRupiah(todayTotal)}
            </p>
          </div>
          <div className="w-px h-6 bg-[#E7E0D3]" />
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-[#78350F]">Transaksi</p>
            <p className="text-sm font-extrabold text-[#1C1917] tabular-nums">{todayCount}</p>
          </div>
        </div>

        {/* Visual Indicator Banner (Voice v2: Masuk Draf, Diabaikan, dsb) */}
        {voiceBanner && (
          <div
            className={`px-4 py-3 rounded-xl border text-xs font-bold animate-fade-in flex items-center justify-between shadow-2xs ${
              voiceBanner.type === 'success'
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                : voiceBanner.type === 'warn'
                ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span>{voiceBanner.message}</span>
            </div>
            <button
              onClick={() => setVoiceBanner(null)}
              className="text-xs font-bold underline hover:no-underline ml-3 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-medium animate-fade-in flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold underline hover:no-underline ml-3"
            >
              Tutup
            </button>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Quick Menu Grid */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm md:text-base font-bold text-[#1C1917]">
                Katalog Menu Cepat
              </h2>
              <span className="text-xs text-[#57534E]">
                {menuItems.length} produk siap tap
              </span>
            </div>

            <QuickMenuGrid
              items={menuItems}
              onSelectItem={handleSelectMenuItem}
            />
          </div>

          {/* Right: Voice Panel & Draft Order Review */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5 sticky top-4">
            {/* 1. Panel Suara AI Kasir */}
            <div className="bg-white rounded-2xl border border-[#E7E0D3] p-5 shadow-2xs flex flex-col items-center gap-4">
              <div className="w-full flex items-center justify-between pb-3 border-b border-[#E7E0D3]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FDF6E2] text-[#9A3412] flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1C1917]">Panel Suara Kasir</h3>
                    <p className="text-[11px] text-[#57534E]">Bicara pesanan sekaligus (ID/Sunda)</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-[#9A3412] bg-[#FDF6E2] px-2 py-0.5 rounded-full border border-[#E7E0D3]">
                  AI Voice POS
                </span>
              </div>

              {/* Saklar Permanen Tunai | QRIS saat Mode Ramai (SPEC §7.1 & §7.2) */}
              {isRamai && (
                <div className="w-full bg-[#FDF6E2] p-3 rounded-xl border border-[#E7E0D3] flex flex-col gap-1.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#78350F]">Metode Bayar Mode Ramai</span>
                    <span className="text-[10px] text-[#57534E]">Auto-save</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setRamaiPaymentMethod('tunai')}
                      className={`min-h-[48px] rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        ramaiPaymentMethod === 'tunai'
                          ? 'bg-[#9A3412] text-[#FFFBEB] border-[#9A3412] shadow-xs'
                          : 'bg-white text-[#57534E] border-[#E7E0D3] hover:bg-[#FFFBEB]'
                      }`}
                    >
                      Tunai (Uang Pas)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRamaiPaymentMethod('qris')}
                      className={`min-h-[48px] rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        ramaiPaymentMethod === 'qris'
                          ? 'bg-[#9A3412] text-[#FFFBEB] border-[#9A3412] shadow-xs'
                          : 'bg-white text-[#57534E] border-[#E7E0D3] hover:bg-[#FFFBEB]'
                      }`}
                    >
                      QRIS
                    </button>
                  </div>
                  <p className="text-[10px] text-[#78716C] mt-0.5 text-center leading-tight">
                    QRIS: penanda metode bayar manual, periksa bukti bayar kasir
                  </p>
                </div>
              )}

              {/* Status Mic & Tombol Mic */}
              <div className="w-full flex flex-col items-center justify-center py-1">
                <MicButton
                  onTranscript={handleTranscript}
                  disabled={isProcessing}
                  micGate={micGate}
                  isRamai={isRamai}
                  onToggleRamai={setIsRamai}
                />
              </div>
            </div>

            {/* 2. Draf Transaksi Card */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm md:text-base font-bold text-[#1C1917]">
                  Draf Transaksi
                </h2>
                {parsedResult && parsedResult.items.length > 0 && (
                  <button
                    onClick={handleCancel}
                    className="text-xs font-semibold text-[#B91C1C] hover:underline cursor-pointer"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {parsedResult && parsedResult.items.length > 0 ? (
                <div className="bg-white rounded-2xl border border-[#E7E0D3] p-4 shadow-sm animate-fade-in">
                  <TransactionCard
                    items={parsedResult.items}
                    total={parsedResult.total}
                    unknownItems={parsedResult.item_tidak_dikenal}
                    rawTranscript={transcript || undefined}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onAddUnknownItem={handleAddUnknownItem}
                    onItemsChange={handleItemsChange}
                  />
                </div>
              ) : isProcessing ? (
                <div className="bg-white rounded-2xl border border-[#E7E0D3] p-8 text-center flex flex-col items-center gap-3 animate-fade-in shadow-2xs">
                  <div className="w-14 h-14 rounded-full bg-[#FDF6E2] text-[#9A3412] flex items-center justify-center animate-spin">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-[#1C1917]">Memproses ucapan kasir...</p>
                  <p className="text-xs text-[#57534E]">AI sedang merapikan item ke draf pesanan</p>
                  {transcript && (
                    <div className="bg-[#FFFBEB] rounded-xl px-3.5 py-1.5 border border-[#E7E0D3] mt-2">
                      <p className="text-xs text-[#78350F] italic">&ldquo;{transcript}&rdquo;</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#E7E0D3] p-6 text-center flex flex-col items-center justify-center gap-3 shadow-2xs min-h-[180px]">
                  <div className="w-12 h-12 rounded-full bg-[#FDF6E2] text-[#9A3412] flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1C1917]">Draf Masih Kosong</p>
                    <p className="text-xs text-[#57534E] mt-1 max-w-xs leading-relaxed">
                      {isRamai
                        ? 'Mode Ramai aktif: ucapkan pesanan untuk auto-save langsung ke sistem.'
                        : 'Sentuh menu di katalog cepat atau ucapkan pesanan lewat mikrofon di atas untuk mulai mencatat.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task 12: Toast Batalkan 8 Detik (SPEC §7.5) */}
      {undoTx && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-up">
          <div className="bg-[#1C1917] text-[#FFFBEB] rounded-2xl p-4 shadow-2xl border border-[#9A3412]/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#9A3412] text-[#FFFBEB] flex items-center justify-center shrink-0 font-bold tabular-nums">
                {undoCountdown}s
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  Tersimpan Otomatis: {formatRupiah(undoTx.total)}
                </p>
                <p className="text-[11px] text-[#D6D3D1] truncate">
                  {undoTx.itemCount} item ({undoTx.paymentMethod.toUpperCase()})
                </p>
              </div>
            </div>

            <button
              onClick={handleUndoAutoSave}
              type="button"
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-[#FFFBEB] text-xs font-bold transition-all shrink-0 cursor-pointer focus-ring shadow-md"
            >
              Batalkan
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Pembayaran Kasir (Mode Normal) */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        items={pendingItems}
        total={pendingTotal}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Modal Struk Kasir Thermal Plered */}
      {lastPaymentDetails && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          storeName={store?.name || 'Warung Sikasep Purwakarta'}
          items={pendingItems}
          total={pendingTotal}
          paymentDetails={lastPaymentDetails}
          onNewOrder={handleNewOrder}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}
    </div>
  );
}
