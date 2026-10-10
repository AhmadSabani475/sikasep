'use client';

import { useState } from 'react';
import type { MenuItem } from '@/types';

interface MenuFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: { name: string; price: number }) => void;
  editItem?: MenuItem | null;
}

export default function MenuFormModal({
  isOpen,
  onClose,
  onSave,
  editItem,
}: MenuFormModalProps) {
  const [name, setName] = useState(editItem?.name || '');
  const [price, setPrice] = useState(editItem?.price?.toString() || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && Number(price) > 0) {
      onSave({ name: name.trim(), price: Number(price) });
      setName('');
      setPrice('');
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl w-full max-w-md p-6 shadow-xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E7E0D3]">
          <h3 className="text-base font-bold text-[#1C1917]">
            {editItem ? 'Ubah Data Menu' : 'Tambah Menu Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#FDF6E2] transition-colors"
            aria-label="Tutup"
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
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="menu-name"
              className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5"
            >
              Nama Menu
            </label>
            <input
              id="menu-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Sate Maranggi Spesial"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-[#FFFBEB] border border-[#E7E0D3] text-[#1C1917] placeholder:text-[#A8A29E] text-sm focus:outline-hidden focus:border-[#9A3412] focus:ring-1 focus:ring-[#9A3412] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="menu-price"
              className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5"
            >
              Harga Satuan (Rp)
            </label>
            <input
              id="menu-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="15000"
              required
              min={0}
              className="w-full px-4 py-3 rounded-xl bg-[#FFFBEB] border border-[#E7E0D3] text-[#1C1917] placeholder:text-[#A8A29E] text-sm focus:outline-hidden focus:border-[#9A3412] focus:ring-1 focus:ring-[#9A3412] transition-colors tabular-nums"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] rounded-xl border border-[#E7E0D3] bg-[#FDF6E2] text-sm font-semibold text-[#57534E] hover:bg-[#E7E0D3] hover:text-[#1C1917] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[48px] rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] text-[#FFFBEB] text-sm font-semibold shadow-xs hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              {editItem ? 'Simpan Perubahan' : 'Tambah Menu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
