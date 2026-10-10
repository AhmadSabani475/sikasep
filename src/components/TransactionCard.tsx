'use client';

import { useState, useCallback } from 'react';
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
}

export default function TransactionCard({
  items: initialItems,
  total: initialTotal,
  unknownItems = [],
  rawTranscript,
  onSave,
  onCancel,
  onAddUnknownItem,
}: TransactionCardProps) {
  const [items, setItems] = useState<ParsedItem[]>(initialItems);
  const [addingItem, setAddingItem] = useState<string | null>(null);

  const calculatedTotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  const updateItem = useCallback((index: number, field: keyof ParsedItem, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
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
      return updated;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        nama: '',
        jumlah: 1,
        harga_satuan: 0,
        subtotal: 0,
        is_custom: true,
      },
    ]);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-[#E7E0D3] overflow-hidden shadow-2xs">
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-[#57534E] border-b border-[#E7E0D3] bg-[#FDF6E2]/20">
              <th className="text-left px-5 py-3 font-semibold">Item</th>
              <th className="text-center px-3 py-3 font-semibold w-20">Qty</th>
              <th className="text-right px-3 py-3 font-semibold w-28">Harga</th>
              <th className="text-right px-3 py-3 font-semibold w-28">Subtotal</th>
              <th className="w-12 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-[#E7E0D3]/60 hover:bg-[#FDF6E2]/30 transition-colors">
                <td className="px-5 py-3">
                  <input
                    type="text"
                    value={item.nama}
                    onChange={(e) => updateItem(index, 'nama', e.target.value)}
                    className={`bg-transparent text-[#1C1917] text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#9A3412]/20 rounded px-1.5 py-1 border border-transparent focus:border-[#9A3412] ${
                      item.is_custom ? 'text-[#9A3412] font-semibold' : 'font-medium'
                    }`}
                    placeholder="Nama item"
                  />
                </td>
                <td className="px-3 py-3 text-center">
                  <input
                    type="number"
                    value={item.jumlah}
                    onChange={(e) => updateItem(index, 'jumlah', e.target.value)}
                    min={1}
                    className="bg-[#FDF6E2]/50 border border-[#E7E0D3] text-[#1C1917] text-sm text-center w-14 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#9A3412] focus:bg-white"
                  />
                </td>
                <td className="px-3 py-3 text-right">
                  <input
                    type="number"
                    value={item.harga_satuan}
                    onChange={(e) => updateItem(index, 'harga_satuan', e.target.value)}
                    min={0}
                    className="bg-[#FDF6E2]/50 border border-[#E7E0D3] text-[#1C1917] text-sm text-right w-24 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#9A3412] focus:bg-white font-mono"
                  />
                </td>
                <td className="px-3 py-3 text-right font-bold text-[#9A3412] tabular-nums">
                  {formatRupiah(item.subtotal)}
                </td>
                <td className="px-2 py-3">
                  <button
                    onClick={() => removeItem(index)}
                    className="w-10 h-10 rounded-lg text-[#57534E] hover:text-[#B91C1C] hover:bg-[#FEE2E2] transition-all flex items-center justify-center cursor-pointer"
                    aria-label={`Hapus ${item.nama}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-b border-[#E7E0D3] bg-[#FDF6E2]/10">
        <button
          onClick={addItem}
          className="flex items-center gap-2 text-xs text-[#9A3412] hover:text-[#7C2D12] font-bold transition-colors min-h-[36px] cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah item manual
        </button>
      </div>

      <div className="px-5 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FDF6E2]/30">
        <div>
          <p className="text-xs font-semibold text-[#57534E]">Total Pembayaran</p>
          <p className="text-xl font-extrabold text-[#9A3412] tabular-nums">{formatRupiah(calculatedTotal)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-[#E7E0D3] bg-white text-sm font-semibold text-[#57534E] hover:bg-[#FDF6E2] hover:text-[#1C1917] transition-all min-h-[48px] flex items-center justify-center cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(items.filter((i) => i.nama.trim()), calculatedTotal)}
            disabled={items.filter((i) => i.nama.trim()).length === 0}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] active:bg-[#6c2710] text-[#FFFBEB] text-sm font-bold shadow-sm hover:shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center cursor-pointer"
          >
            Simpan Transaksi
          </button>
        </div>
      </div>
    </div>
  );
}
