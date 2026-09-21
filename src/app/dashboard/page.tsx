'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import MicButton from '@/components/MicButton';
import TransactionCard from '@/components/TransactionCard';
import SuccessAnimation from '@/components/SuccessAnimation';
import { formatRupiah } from '@/lib/mock-data';
import type { ParsedItem, ParsedTransactionResult, MenuItem } from '@/types';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import { getMenuItems, createTransaction, getTodayTotal } from '@/lib/supabase/queries';

export default function KasirPage() {
  const { store } = useAuth();
  const toast = useToast();
  const [transcript, setTranscript] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedTransactionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastSpeakingTimeRef = useRef<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSavedAmount, setLastSavedAmount] = useState('');

  useEffect(() => {
    async function loadInitialData() {
      if (store) {
        const [items, stats] = await Promise.all([
          getMenuItems(store.id),
          getTodayTotal(store.id)
        ]);
        setMenuItems(items);
        setTodayTotal(stats.total);
        setTodayCount(stats.count);
      }
    }
    loadInitialData();
  }, [store]);

  useEffect(() => {
    if (isSpeaking) {
      lastSpeakingTimeRef.current = Date.now();
    } else {
      lastSpeakingTimeRef.current = Date.now();
    }
  }, [isSpeaking]);

  const handleTranscript = useCallback(
    async (text: string) => {
      const timeSinceSpeaking = Date.now() - lastSpeakingTimeRef.current;
      if (isSpeaking || timeSinceSpeaking < 2500) {
        console.log('Mengabaikan suara (AI masih/baru saja bicara):', text);
        return;
      }
      
      const lowerText = text.toLowerCase();
      if (lowerText.includes('berhasil disimpan') || lowerText.includes('rupiah')) {
        console.log('Mengabaikan suara AI (berdasarkan kata kunci):', text);
        return;
      }

      setTranscript(text);
      setIsProcessing(true);
      setError(null);

      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: text,
            menuItems: menuItems.filter(m => m.is_active).map(m => ({ nama: m.name, harga: m.price }))
          })
        });

        if (!res.ok) {
          throw new Error('Gagal mengekstrak data');
        }

        const data: ParsedTransactionResult = await res.json();
        data.items = data.items.map(item => {
          const matchedMenu = menuItems.find(m => m.name === item.nama);
          if (matchedMenu) {
            return {
              ...item,
              menu_item_id: matchedMenu.id 
            };
          }
          return { ...item, is_custom: true };
        });

        setParsedResult(data);

        if (voiceEnabled && 'speechSynthesis' in window) {
          const isAutoSaved = autoSave && data.item_tidak_dikenal.length === 0;
          const textMsg = data.items.map(i => `${i.jumlah} ${i.nama}`).join(', ') + `. Total ${data.total} rupiah.${isAutoSaved ? ' Berhasil disimpan.' : ''}`;
          const utterance = new SpeechSynthesisUtterance(textMsg);
          utterance.lang = 'id-ID';
          
          setIsSpeaking(true);
          
          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => setTimeout(() => setIsSpeaking(false), 500);
          utterance.onerror = () => setIsSpeaking(false);
          
          window.speechSynthesis.speak(utterance);
        }

        if (autoSave && data.item_tidak_dikenal.length === 0) {
          await executeSave(data.items, data.total, text);
        } else {
          setParsedResult(data);
        }
      } catch (err) {
        console.error(err);
        setError('Terjadi kesalahan saat memproses suara dengan AI.');
      } finally {
        setIsProcessing(false);
      }
    },
    [menuItems, autoSave, voiceEnabled]
  );

  const executeSave = async (items: ParsedItem[], total: number, currentTranscript: string) => {
    if (!store) return;
    setIsProcessing(true);
    
    const itemsToSave = items.map((item: any) => ({
      menu_item_id: item.menu_item_id || null, // Will be null for custom items
      item_name: item.nama,
      quantity: item.jumlah,
      unit_price: item.harga_satuan,
      subtotal: item.subtotal
    }));

    const tx = await createTransaction(store.id, currentTranscript, total, itemsToSave);
    
    if (tx) {
      setSavedCount((c) => c + 1);
      setLastSavedAmount(formatRupiah(total));
      setShowSuccess(true);
      const stats = await getTodayTotal(store.id);
      setTodayTotal(stats.total);
      setTodayCount(stats.count);
      
      setParsedResult(null);
      setTranscript(null);
      
      toast.success('Transaksi berhasil disimpan!');
    } else {
      toast.error('Gagal menyimpan transaksi. Coba lagi.');
    }
    
    setIsProcessing(false);
  };

  const handleSave = useCallback(
    async (items: ParsedItem[], total: number) => {
      if (transcript) {
        await executeSave(items, total, transcript);
      }
    },
    [store, transcript]
  );

  const handleAddUnknownItem = useCallback(async (itemName: string, price: number) => {
    if (!store) return;
    try {
      const { createMenuItem } = await import('@/lib/supabase/queries');
      const newItem = await createMenuItem(store.id, itemName, price);
      if (newItem) {
        setMenuItems(prev => [...prev, newItem]);
        setParsedResult(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            unknownItems: prev.item_tidak_dikenal.filter(u => u !== itemName),
            items: prev.items.map(item => item.nama === itemName ? { ...item, is_custom: false, menu_item_id: newItem.id } : item)
          };
        });
        toast.success(`${itemName} berhasil ditambahkan ke menu!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menambahkan menu');
    }
  }, [store, toast]);

  const handleCancel = useCallback(() => {
    setParsedResult(null);
    setTranscript(null);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <SuccessAnimation 
        show={showSuccess} 
        amount={lastSavedAmount}
        onComplete={() => setShowSuccess(false)} 
      />
      <header className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Kasir</h1>
            <p className="text-xs text-text-muted mt-0.5">Ucapkan pesanan untuk mencatat transaksi</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-right">
                <p className="text-[11px] text-text-muted">Hari ini</p>
                <p className="text-sm font-bold text-primary-400">{formatRupiah(todayTotal)}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-right">
                <p className="text-[11px] text-text-muted">Transaksi</p>
                <p className="text-sm font-bold text-text-primary">{todayCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-xs text-text-muted cursor-pointer flex items-center gap-1.5">
                <input 
                  type="checkbox" 
                  checked={autoSave} 
                  onChange={(e) => setAutoSave(e.target.checked)} 
                  className="rounded border-white/20 bg-surface-700 text-primary-500 focus:ring-primary-500/50"
                />
                Auto Simpan
              </label>
              <label className="text-xs text-text-muted cursor-pointer flex items-center gap-1.5">
                <input 
                  type="checkbox" 
                  checked={voiceEnabled} 
                  onChange={(e) => setVoiceEnabled(e.target.checked)} 
                  className="rounded border-white/20 bg-surface-700 text-primary-500 focus:ring-primary-500/50"
                />
                Suara
              </label>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
        <div className="flex sm:hidden items-center gap-6 glass rounded-2xl px-6 py-3">
          <div className="text-center">
            <p className="text-[11px] text-text-muted">Omzet Hari Ini</p>
            <p className="text-base font-bold text-primary-400">{formatRupiah(todayTotal)}</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-[11px] text-text-muted">Transaksi</p>
            <p className="text-base font-bold text-text-primary">{todayCount}</p>
          </div>
        </div>
        {error && (
          <div className="px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-500 text-sm animate-fade-in text-center max-w-md w-full">
            {error}
            <button 
              onClick={() => setError(null)}
              className="block mt-2 mx-auto text-xs font-medium hover:underline"
            >
              Coba Lagi
            </button>
          </div>
        )}
        <div className={parsedResult || isProcessing ? 'hidden' : 'block'}>
          <MicButton onTranscript={handleTranscript} disabled={isProcessing || isSpeaking || !store || menuItems.length === 0} />
        </div>
        
        {!isProcessing && !parsedResult && store && menuItems.length === 0 && (
          <p className="text-sm text-text-muted text-center">
            Anda belum memiliki menu.<br/>Silakan tambah menu di halaman Menu terlebih dahulu.
          </p>
        )}
        {isProcessing && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-20 h-20 rounded-full glass flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-400 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">Memproses pesanan...</p>
              <p className="text-xs text-text-muted mt-1">AI sedang mengekstrak data</p>
            </div>
            {transcript && (
              <div className="glass rounded-xl px-4 py-2 max-w-md">
                <p className="text-xs text-text-muted text-center">&ldquo;{transcript}&rdquo;</p>
              </div>
            )}
          </div>
        )}
        {parsedResult && !isProcessing && (
          <div className="w-full max-w-2xl">
            <TransactionCard
              items={parsedResult.items}
              total={parsedResult.total}
              unknownItems={parsedResult.item_tidak_dikenal}
              rawTranscript={transcript || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
              onAddUnknownItem={handleAddUnknownItem}
            />
          </div>
        )}
        {!parsedResult && !isProcessing && savedCount > 0 && !error && (
          <div className="glass rounded-xl px-4 py-2 text-xs text-primary-400 font-medium animate-fade-in flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Transaksi berhasil disimpan!
          </div>
        )}
      </div>
    </div>
  );
}
