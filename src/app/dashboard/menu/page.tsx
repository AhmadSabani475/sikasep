'use client';

import { useState, useEffect } from 'react';
import type { MenuItem } from '@/types';
import { formatRupiah } from '@/lib/mock-data';
import MenuFormModal from '@/components/MenuFormModal';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/supabase/queries';

export default function MenuPage() {
  const { store } = useAuth();
  const toast = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadMenu() {
      if (store) {
        const items = await getMenuItems(store.id);
        setMenuItems(items);
      }
      setLoading(false);
    }
    loadMenu();
  }, [store]);

  const filteredItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = menuItems.filter((i) => i.is_active).length;

  const handleAdd = async (data: { name: string; price: number }) => {
    if (!store) return;
    const newItem = await createMenuItem(store.id, data.name, data.price);
    if (newItem) {
      setMenuItems((prev) => [...prev, newItem]);
      toast.success(`${data.name} berhasil ditambahkan!`);
    } else {
      toast.error('Gagal menambah menu');
    }
  };

  const handleEdit = async (data: { name: string; price: number }) => {
    if (!editingItem) return;
    
    const updated = await updateMenuItem(editingItem.id, data);
    if (updated) {
      setMenuItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success('Menu berhasil diupdate!');
    } else {
      toast.error('Gagal mengupdate menu');
    }
    setEditingItem(null);
  };

  const handleToggle = async (id: string) => {
    const item = menuItems.find((i) => i.id === id);
    if (!item) return;
    setMenuItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_active: !i.is_active } : i))
    );

    const updated = await updateMenuItem(id, { is_active: !item.is_active });
    if (!updated) {
      setMenuItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_active: item.is_active } : i))
      );
      toast.error('Gagal mengubah status menu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus menu ini?')) return;
    
    const success = await deleteMenuItem(id);
    if (success) {
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
      toast.success('Menu berhasil dihapus');
    } else {
      toast.error('Gagal menghapus menu');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Daftar Menu</h1>
            <p className="text-xs text-text-muted mt-0.5">
              {loading ? 'Memuat...' : `${activeCount} menu aktif dari ${menuItems.length} total`}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            disabled={!store}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tambah Menu
          </button>
        </div>
      </header>
      <div className="px-6 py-4">
        <div className="relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari menu..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-800 border border-white/5 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
          />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  className="glass rounded-2xl p-4 hover:bg-white/[0.03] transition-all animate-fade-in group"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-sm truncate ${!item.is_active ? 'text-text-muted line-through' : ''}`}>
                        {item.name}
                      </h3>
                      <p className="text-lg font-bold text-primary-400 mt-0.5">
                        {formatRupiah(item.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle(item.id)}
                      className={`relative w-10 h-5.5 rounded-full transition-all shrink-0 ${
                        item.is_active ? 'bg-primary-500' : 'bg-surface-600'
                      }`}
                      aria-label={item.is_active ? 'Nonaktifkan menu' : 'Aktifkan menu'}
                    >
                      <span
                        className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-all ${
                          item.is_active ? 'left-5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsModalOpen(true);
                      }}
                      className="flex-1 py-1.5 text-xs font-medium text-text-secondary hover:text-primary-400 rounded-lg hover:bg-primary-500/10 transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 py-1.5 text-xs font-medium text-text-secondary hover:text-danger-500 rounded-lg hover:bg-danger-500/10 transition-all"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <p className="text-sm text-text-secondary font-medium">Tidak ada menu ditemukan</p>
                <p className="text-xs text-text-muted mt-1">
                  {searchQuery ? 'Coba kata kunci lain' : 'Mulai tambahkan menu toko Anda'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
      <MenuFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={editingItem ? handleEdit : handleAdd}
        editItem={editingItem}
      />
    </div>
  );
}
