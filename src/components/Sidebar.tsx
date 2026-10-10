'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  {
    href: '/dashboard',
    label: 'Kasir',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    ),
  },
  {
    href: '/dashboard/menu',
    label: 'Menu',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 6h18" />
        <path d="M3 12h18" />
        <path d="M3 18h18" />
      </svg>
    ),
  },
  {
    href: '/dashboard/riwayat',
    label: 'Riwayat',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: '/dashboard/rekap',
    label: 'Rekap',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: '/dashboard/insights',
    label: 'AI Insights',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
      </svg>
    ),
    highlight: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { store, loading } = useAuth();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E7E0D3] shadow-xs select-none">
      {/* Header Logo & Identitas Juragan Purwakarta */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#E7E0D3]">
        <div className="w-10 h-10 rounded-xl bg-[#9A3412] flex items-center justify-center shadow-xs">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFBEB"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight text-[#1C1917]">
              Sikasep
            </span>
            <span className="text-[10px] font-semibold text-[#78350F] bg-[#FDF6E2] px-1.5 py-0.2 rounded">
              POS
            </span>
          </div>
          <p className="text-[12px] text-[#57534E] truncate font-medium mt-0.5">
            {loading ? 'Memuat...' : store?.name ? `Sampurasun, ${store.name}` : 'Sampurasun, Juragan!'}
          </p>
        </div>
      </div>

      {/* Navigasi Utama */}
      <nav className="flex-1 px-3 py-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all min-h-[48px] ${
                isActive
                  ? 'bg-[#FDF6E2] text-[#9A3412] border-r-2 border-[#9A3412] shadow-xs'
                  : 'text-[#57534E] hover:bg-[#FFFBEB] hover:text-[#1C1917]'
              }`}
            >
              <span className={isActive ? 'text-[#9A3412]' : 'text-[#78350F]'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.highlight && !isActive && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#FDF6E2] text-[#78350F] border border-[#E7E0D3] font-bold">
                  AI
                </span>
              )}
              {isActive && (
                <span className="ml-auto w-2 h-2 rounded-full bg-[#9A3412]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Action Bar */}
      <div className="px-3 pb-5 border-t border-[#E7E0D3] pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#57534E] hover:text-[#B91C1C] hover:bg-[#FEE2E2]/60 transition-all w-full min-h-[48px]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Keluar Kasir</span>
        </button>
      </div>
    </aside>
  );
}
