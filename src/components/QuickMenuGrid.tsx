'use client';

import { useState, useMemo } from 'react';
import type { MenuItem } from '@/types';
import { formatRupiah } from '@/lib/mock-data';

interface QuickMenuGridProps {
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  className?: string;
}

export function QuickMenuGrid({
  items,
  onSelectItem,
  className = '',
}: QuickMenuGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'semua' | 'makanan' | 'minuman' | 'camilan'>('semua');

  // Filter items based on active status, category, and search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Must be active if status exists
      if (item.is_active === false) return false;

      // Filter by category heuristic based on name if no explicit category
      if (selectedCategory !== 'semua') {
        const lowerName = item.name.toLowerCase();
        const isMinuman = lowerName.includes('es ') || lowerName.includes('teh') || lowerName.includes('kopi') || lowerName.includes('jus') || lowerName.includes('air');
        const isCamilan = lowerName.includes('simping') || lowerName.includes('peuyeum') || lowerName.includes('colenak') || lowerName.includes('keripik');
        
        if (selectedCategory === 'minuman' && !isMinuman) return false;
        if (selectedCategory === 'camilan' && !isCamilan) return false;
        if (selectedCategory === 'makanan' && (isMinuman || isCamilan)) return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      }

      return true;
    });
  }, [items, selectedCategory, searchQuery]);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari menu (misal: Sate Maranggi, Es Kelapa)..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-[#E7E0D3] text-[#1C1917] placeholder:text-[#57534E] text-xs md:text-sm focus:outline-none focus:border-[#9A3412] focus:ring-2 focus:ring-[#9A3412]/20 transition-all shadow-2xs"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57534E]"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57534E] hover:text-[#1C1917] text-xs p-1"
              aria-label="Hapus pencarian"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              { id: 'semua', label: 'Semua' },
              { id: 'makanan', label: 'Makanan' },
              { id: 'minuman', label: 'Minuman' },
              { id: 'camilan', label: 'Oleh-oleh' },
            ] as const
          ).map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[48px] flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'bg-[#9A3412] text-[#FFFBEB] shadow-2xs'
                    : 'bg-white text-[#57534E] border border-[#E7E0D3] hover:bg-[#FDF6E2] hover:text-[#1C1917]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Menu Terlaris (2 Kolom di Ponsel, 3-4 di Desktop) */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E7E0D3] p-8 text-center">
          <svg
            className="w-10 h-10 mx-auto text-[#78350F]/50 mb-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <p className="text-sm font-semibold text-[#1C1917]">Menu Tidak Ditemukan</p>
          <p className="text-xs text-[#57534E] mt-1">
            Ucapkan nama menu via mikrofon di bawah atau sesuaikan kata kunci pencarian.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectItem(item)}
              type="button"
              className="bg-white rounded-xl p-3 md:p-3.5 border border-[#E7E0D3] shadow-2xs hover:border-[#C2410C] hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between text-left min-h-[96px] group focus-ring relative overflow-hidden"
            >
              {/* Top Row: Name */}
              <div>
                <h4 className="font-bold text-xs md:text-sm text-[#1C1917] group-hover:text-[#9A3412] transition-colors leading-snug line-clamp-2">
                  {item.name}
                </h4>
              </div>

              {/* Bottom Row: Price & Instant Add Badge */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#E7E0D3]/60 w-full">
                <span className="text-[#9A3412] font-extrabold text-xs md:text-sm tabular-nums">
                  {formatRupiah(item.price)}
                </span>
                <span className="w-6 h-6 rounded-full bg-[#FDF6E2] text-[#9A3412] group-hover:bg-[#9A3412] group-hover:text-[#FFFBEB] flex items-center justify-center transition-all text-xs font-bold">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuickMenuGrid;
