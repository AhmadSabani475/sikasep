'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ParsedItem } from '@/types';
import { formatRupiah } from '@/lib/mock-data';

interface TransactionCardProps {
  items: ParsedItem[];
  total: number;
  unknownItems?: string[];
  rawTranscript?: string;
  onSave: (items: ParsedItem[], total: number) => void;
  onCancel: () => void;
  onAddUnknownItem?: (itemName: string, price: number) => Promise<void>;
  onItemsChange?: (items: ParsedItem[]) => void;
}

export default function TransactionCard({
  items: initialItems,
  total: initialTotal,
  unknownItems = [],
  rawTranscript,
  onSave,
  onCancel,
  onAddUnknownItem,
  onItemsChange,
}: TransactionCardProps) {
  const [items, setItems] = useState<ParsedItem[]>(initialItems);
  const [addingItem, setAddingItem] = useState<string | null>(null);

  // Sync internal items whenever initialItems changes from parent (e.g. QuickMenuGrid tap)
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const calculatedTotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  const updateItem = useCallback(
    (index: number, field: keyof ParsedItem, value: string | number) => {
      const updated = [...items];
      const item = { ...updated[index] };

      if (field === 'jumlah') {
        const qty = Math.max(1, Number(value));
        item.jumlah = qty;
        item.subtotal = qty * item.harga_satuan;
      } else if (field === 'harga_satuan') {
        const price = Math.max(0, Number(value));
        item.harga_satuan = price;
        item.subtotal = item.jumlah * price;
      } else if (field === 'nama') {
        item.nama = String(value);
      }

      updated[index] = item;
      setItems(updated);
      onItemsChange?.(updated);
    },
    [items, onItemsChange]
  );

  const removeItem = useCallback(
    (index: number) => {
      const updated = items.filter((_, i) => i !== index);
      setItems(updated);
      onItemsChange?.(updated);
    },
    [items, onItemsChange]
  );

  const addItem = useCallback(() => {
    const updated = [
      ...items,
      {
        nama: '',
        jumlah: 1,
        harga_satuan: 0,
        subtotal: 0,
        is_custom: true,
      },
    ];
    setItems(updated);
    onItemsChange?.(updated);
  }, [items, onItemsChange]);

  return (
    <div className="bg-white rounded-2xl border border-[#E7E0D3] overflow-hidden shadow-2xs">
      {/* Header Draf */}
      <div className="px-5 py-4 border-b border-[#E7E0D3] flex items-center justify-between bg-[#FDF6E2]/40">
        <div>
          <h3 className="font-bold text-sm text-[#1C1917]">Konfirmasi Draf Pesanan</h3>
          <p className="text-xs text-[#57534E] mt-0.5">Periksa & edit item sebelum disimpan</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[#FDF6E2] border border-[#E7E0D3] text-[#78350F] font-bold">
          {items.length} item
        </span>
      </div>

      {rawTranscript && (
        <div className="px-5 py-3 bg-[#FDF6E2]/70 border-b border-[#E7E0D3]">
          <p className="text-xs text-[#78350F]">
            <span className="font-bold text-[#9A3412]">Transkrip:</span>{' '}
            &ldquo;{rawTranscript}&rdquo;
          </p>
        </div>
      )}

      {unknownItems.length > 0 && (
        <div className="px-5 py-3 bg-[#FEE2E2]/60 border-b border-[#FCA5A5] space-y-2">
          <div className="flex items-start gap-2 text-xs text-[#991B1B] font-semibold">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Item tidak ada di katalog:</span>
          </div>
          <div className="flex flex-wrap gap-2 pl-5">
            {unknownItems.map((uItem, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-[#FCA5A5]">
                <span className="text-xs font-medium text-[#1C1917]">{uItem}</span>
                {onAddUnknownItem && (
                  <button
                    onClick={async () => {
                      setAddingItem(uItem);
                      const priceStr = prompt(`Masukkan harga untuk "${uItem}":`, '0');
                      if (priceStr !== null) {
                        const p = Number(priceStr);
                        if (!isNaN(p) && p > 0) {
                          await onAddUnknownItem(uItem, p);
                        } else {
                          alert('Harga tidak valid.');
                        }
                      }
                      setAddingItem(null);
                    }}
                    disabled={addingItem === uItem}
                    className="text-[11px] font-bold bg-[#9A3412] text-[#FFFBEB] px-2.5 py-1 rounded hover:bg-[#7C2D12] transition-colors min-h-[32px] flex items-center justify-center cursor-pointer"
                  >
                    {addingItem === uItem ? 'Menyimpan...' : 'Tambah ke Menu'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daftar Item Draf: Kartu Bertumpuk (Nama Penuh di Atas, Qty Stepper, Harga Ribuan, Hapus) */}
      <div className="p-3 md:p-4 space-y-3 max-h-[420px] overflow-y-auto">
        {items.map((item, index) => (
          <div
            key={item.menu_item_id || index}
            className="bg-[#FDF6E2]/40 rounded-xl p-3 md:p-3.5 border border-[#E7E0D3] flex flex-col gap-2.5 transition-all shadow-2xs"
          >
            {/* 1. Baris Atas: Nama Penuh (Tidak Menciut, Tidak Terpotong) */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={item.nama}
                  onChange={(e) => updateItem(index, 'nama', e.target.value)}
                  className={`w-full bg-transparent text-[#1C1917] text-sm md:text-base font-bold focus:outline-none focus:ring-1 focus:ring-[#9A3412]/30 rounded px-1 -mx-1 ${
                    item.is_custom ? 'text-[#9A3412]' : ''
                  }`}
                  placeholder="Nama item"
                />
                {item.is_custom && (
                  <span className="text-[10px] text-[#9A3412] font-semibold bg-[#FEE2E2] px-1.5 py-0.5 rounded border border-[#FCA5A5] inline-block mt-0.5">
                    Menu Khusus
                  </span>
                )}
              </div>

              {/* Tombol Hapus: min 48px touch target */}
              <button
                onClick={() => removeItem(index)}
                type="button"
                className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl text-[#57534E] hover:text-[#B91C1C] hover:bg-[#FEE2E2] active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                aria-label={`Hapus ${item.nama}`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 2. Baris Bawah: Stepper − dan + (min 48px), Harga Satuan, dan Subtotal Ribuan */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#E7E0D3]/60">
              {/* Stepper Qty Ergonomis (min 48px, tanpa spinner bawaan browser) */}
              <div className="flex items-center gap-1.5 bg-white rounded-xl border border-[#E7E0D3] p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => updateItem(index, 'jumlah', Math.max(1, item.jumlah - 1))}
                  disabled={item.jumlah <= 1}
                  className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-lg bg-[#FDF6E2] hover:bg-[#E7E0D3] active:scale-95 text-[#1C1917] text-lg font-bold flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  aria-label={`Kurangi kuantitas ${item.nama}`}
                >
                  −
                </button>
                <span className="w-9 text-center font-bold text-sm md:text-base tabular-nums text-[#1C1917]">
                  {item.jumlah}
                </span>
                <button
                  type="button"
                  onClick={() => updateItem(index, 'jumlah', item.jumlah + 1)}
                  className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-lg bg-[#FDF6E2] hover:bg-[#E7E0D3] active:scale-95 text-[#1C1917] text-lg font-bold flex items-center justify-center transition-all cursor-pointer"
                  aria-label={`Tambah kuantitas ${item.nama}`}
                >
                  +
                </button>
              </div>

              {/* Rincian Harga Satuan & Subtotal Format Ribuan */}
              <div className="text-right">
                <div className="text-[11px] text-[#57534E]">
                  @ <span className="tabular-nums font-medium">{formatRupiah(item.harga_satuan)}</span>
                </div>
                <div className="text-sm md:text-base font-extrabold text-[#9A3412] tabular-nums">
                  {formatRupiah(item.subtotal)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tambah Item Manual */}
      <div className="px-5 py-3 border-t border-[#E7E0D3] bg-[#FDF6E2]/10">
        <button
          onClick={addItem}
          type="button"
          className="flex items-center gap-2 text-xs text-[#9A3412] hover:text-[#7C2D12] font-bold transition-colors min-h-[40px] cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah item manual
        </button>
      </div>

      {/* Footer Total & Aksi Konfirmasi (Susunan 2 Tingkat - Anti Kepotong) */}
      <div className="px-5 py-4 flex flex-col gap-3.5 bg-[#FDF6E2]/40 border-t border-[#E7E0D3]">
        {/* Tingkat 1: Total Pembayaran Jelas & Rapi */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#57534E]">Total Pembayaran</p>
            <p className="text-[11px] text-[#78716C]">{items.length} item di pesanan</p>
          </div>
          <p className="text-xl md:text-2xl font-extrabold text-[#9A3412] tabular-nums tracking-tight">
            {formatRupiah(calculatedTotal)}
          </p>
        </div>

        {/* Tingkat 2: Tombol Aksi Lapang & Proporsional */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onCancel}
            type="button"
            className="px-4 py-2.5 rounded-xl border border-[#E7E0D3] bg-white text-sm font-semibold text-[#57534E] hover:bg-[#FDF6E2] hover:text-[#1C1917] transition-all min-h-[48px] flex items-center justify-center cursor-pointer shrink-0"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(items.filter((i) => i.nama.trim()), calculatedTotal)}
            disabled={items.filter((i) => i.nama.trim()).length === 0}
            type="button"
            className="flex-1 px-5 py-2.5 rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] active:bg-[#6c2710] text-[#FFFBEB] text-sm font-bold shadow-xs hover:shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            Simpan Transaksi
          </button>
        </div>
      </div>
    </div>
  );
}
