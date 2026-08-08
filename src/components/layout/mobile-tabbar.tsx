'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, Heart, Home, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/catalog', label: 'Поиск', icon: Search },
  { href: '/ai', label: 'AI-подбор', icon: Sparkles },
  { href: '/account/favorites', label: 'Избранное', icon: Heart },
  { href: '/account/bookings', label: 'Брони', icon: CalendarCheck },
];

/** Нижняя навигация — основной способ перемещения на мобильных. */
export function MobileTabBar() {
  const pathname = usePathname();

  // В кабинете бизнеса и на экранах auth своя навигация.
  if (pathname.startsWith('/business') || pathname.startsWith('/auth')) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t glass-strong pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const isActive =
            tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <tab.icon className={cn('size-5', isActive && 'fill-primary/15')} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
