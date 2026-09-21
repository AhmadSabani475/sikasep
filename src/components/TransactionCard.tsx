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
    <div className="glass rounded-2xl overflow-hidden animate-slide-up">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Konfirmasi Transaksi</h3>
          <p className="text-xs text-text-muted mt-0.5">Periksa & edit sebelum menyimpan</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-accent-500/15 text-accent-400 font-medium">
          {items.length} item
        </span>
      </div>

      {rawTranscript && (
        <div className="px-5 py-3 bg-surface-700/50 border-b border-white/5">
          <p className="text-xs text-text-muted">
            <span className="font-medium text-text-secondary">Transkrip:</span>{' '}
            &ldquo;{rawTranscript}&rdquo;
          </p>
        </div>
      )}

      {unknownItems.length > 0 && (
        <div className="px-5 py-3 bg-accent-500/5 border-b border-white/5 space-y-2">
          <div className="flex items-start gap-2 text-xs text-accent-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Item tidak dikenali:</span>
          </div>
          <div className="flex flex-wrap gap-2 pl-5">
            {unknownItems.map((uItem, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-surface-700 px-2 py-1.5 rounded-lg border border-white/5">
                <span className="text-xs text-text-primary">{uItem}</span>
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
                    className="text-[10px] bg-accent-500/20 text-accent-400 px-2 py-1 rounded hover:bg-accent-500/30 transition-colors"
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
            <tr className="text-xs text-text-muted border-b border-white/5">
              <th className="text-left px-5 py-3 font-medium">Item</th>
              <th className="text-center px-3 py-3 font-medium w-20">Qty</th>
              <th className="text-right px-3 py-3 font-medium w-28">Harga</th>
              <th className="text-right px-3 py-3 font-medium w-28">Subtotal</th>
              <th className="w-10 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <input
                    type="text"
                    value={item.nama}
                    onChange={(e) => updateItem(index, 'nama', e.target.value)}
                    className={`bg-transparent text-text-primary text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary-500/30 rounded px-1 -mx-1 ${
                      item.is_custom ? 'text-accent-400' : ''
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
                    className="bg-surface-700 text-text-primary text-sm text-center w-14 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                  />
                </td>
                <td className="px-3 py-3 text-right">
                  <input
                    type="number"
                    value={item.harga_satuan}
                    onChange={(e) => updateItem(index, 'harga_satuan', e.target.value)}
                    min={0}
                    className="bg-surface-700 text-text-primary text-sm text-right w-24 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                  />
                </td>
                <td className="px-3 py-3 text-right font-medium text-text-primary">
                  {formatRupiah(item.subtotal)}
                </td>
                <td className="px-2 py-3">
                  <button
                    onClick={() => removeItem(index)}
                    className="p-1 rounded-lg text-text-muted hover:text-danger-500 hover:bg-danger-500/10 transition-all"
                    aria-label={`Hapus ${item.nama}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      <div className="px-5 py-3 border-b border-white/5">
        <button
          onClick={addItem}
          className="flex items-center gap-2 text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah item manual
        </button>
      </div>

      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted">Total</p>
          <p className="text-xl font-bold text-text-primary">{formatRupiah(calculatedTotal)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-text-secondary hover:bg-white/5 transition-all"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(items.filter((i) => i.nama.trim()), calculatedTotal)}
            disabled={items.filter((i) => i.nama.trim()).length === 0}
            className="px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Simpan Transaksi
          </button>
        </div>
      </div>
    </div>
  );
}
