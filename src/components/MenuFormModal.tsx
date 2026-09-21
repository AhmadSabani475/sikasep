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
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="glass rounded-2xl w-full max-w-md p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold">
            {editItem ? 'Edit Menu' : 'Tambah Menu Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
            aria-label="Tutup"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="menu-name" className="block text-sm font-medium text-text-secondary mb-1.5">
              Nama Menu
            </label>
            <input
              id="menu-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sate Maranggi Spesial"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-surface-700 border border-white/5 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
            />
          </div>

          <div>
            <label htmlFor="menu-price" className="block text-sm font-medium text-text-secondary mb-1.5">
              Harga (Rp)
            </label>
            <input
              id="menu-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="15000"
              required
              min={0}
              className="w-full px-4 py-3 rounded-xl bg-surface-700 border border-white/5 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-medium text-text-secondary hover:bg-white/5 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl gradient-primary text-white text-sm font-semibold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all"
            >
              {editItem ? 'Simpan Perubahan' : 'Tambah Menu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
