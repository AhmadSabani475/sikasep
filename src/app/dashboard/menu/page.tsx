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

  const filteredItems = menuItems.filter((item) =>
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
      toast.success('Menu berhasil diperbarui!');
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
    <div className="flex flex-col h-full bg-[#FFFBEB] text-[#1C1917]">
      <header className="px-6 py-5 border-b border-[#E7E0D3] bg-[#FFFBEB]/90 backdrop-blur-xs sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1C1917]">Daftar Menu</h1>
            <p className="text-xs text-[#78716C] mt-0.5">
              {loading ? 'Memuat katalog...' : `${activeCount} menu aktif dari ${menuItems.length} total item`}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            disabled={!store}
            className="flex items-center gap-2 px-5 py-2.5 min-h-[48px] rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] text-[#FFFBEB] text-sm font-semibold shadow-xs hover:shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78716C]"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari menu toko..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FFFFFF] border border-[#E7E0D3] text-[#1C1917] placeholder:text-[#A8A29E] text-sm focus:outline-hidden focus:border-[#9A3412] focus:ring-1 focus:ring-[#9A3412] transition-colors"
          />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-4 shadow-2xs hover:border-[#9A3412]/40 transition-all animate-fade-in group flex flex-col justify-between"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3
                        className={`font-bold text-base truncate ${
                          !item.is_active ? 'text-[#A8A29E] line-through' : 'text-[#1C1917]'
                        }`}
                      >
                        {item.name}
                      </h3>
                      <p className="text-base font-bold text-[#9A3412] mt-0.5 tabular-nums">
                        {formatRupiah(item.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle(item.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                        item.is_active ? 'bg-[#9A3412]' : 'bg-[#E7E0D3]'
                      }`}
                      aria-label={item.is_active ? 'Nonaktifkan menu' : 'Aktifkan menu'}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-[#FFFBEB] shadow-xs transition-transform ${
                          item.is_active ? 'left-6.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-[#F5EBE1]">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsModalOpen(true);
                      }}
                      className="flex-1 min-h-[44px] flex items-center justify-center py-2 text-xs font-semibold text-[#57534E] hover:text-[#9A3412] rounded-xl hover:bg-[#FDF6E2] border border-[#E7E0D3] transition-colors cursor-pointer"
                    >
                      Ubah
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 min-h-[44px] flex items-center justify-center py-2 text-xs font-semibold text-[#B91C1C] hover:text-[#991B1B] rounded-xl hover:bg-[#FEE2E2]/60 border border-[#FECACA] transition-colors cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in bg-[#FFFFFF] border border-[#E7E0D3] rounded-2xl p-8">
                <div className="w-14 h-14 rounded-2xl bg-[#FDF6E2] border border-[#E7E0D3] flex items-center justify-center mb-3 text-[#9A3412]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <p className="text-base font-bold text-[#1C1917]">Tidak ada menu ditemukan</p>
                <p className="text-xs text-[#78716C] mt-1">
                  {searchQuery ? 'Coba gunakan kata kunci pencarian yang lain' : 'Mulai tambahkan menu toko Anda'}
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
