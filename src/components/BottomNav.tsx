'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FoodTrayIcon, ReceiptIcon } from '@/components/icons/PurwakartaIcons';

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
    icon: <FoodTrayIcon size={20} strokeWidth={2} />,
  },
  {
    href: '/dashboard/riwayat',
    label: 'Riwayat',
    icon: <ReceiptIcon size={20} strokeWidth={2} />,
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
    label: 'Insights',
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

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E7E0D3] shadow-lg">
      <div className="flex items-center justify-around py-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all relative min-h-[48px] min-w-[48px] ${
                isActive
                  ? 'text-[#9A3412] font-bold'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              {item.icon}
              <span className="text-[11px] leading-none font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 w-8 h-1 rounded-full bg-[#9A3412]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
