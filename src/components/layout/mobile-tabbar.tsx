'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, Home, LayoutGrid, ShoppingBag, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/client';
import { selectCartCount, useCartStore } from '@/store/use-cart-store';

/** Booking-first mobile nav: home / catalog / AI / cart. */
const TABS = [
  { href: '/', key: 'home', icon: Home },
  { href: '/catalog', key: 'catalog', icon: LayoutGrid },
  { href: '/catalog?availableNow=1', key: 'book', icon: CalendarCheck },
  { href: '/ai', key: 'ai', icon: Sparkles },
  { href: '/cart', key: 'cart', icon: ShoppingBag },
] as const;

/** Нижняя навигация — основной способ перемещения на мобильных. */
export function MobileTabBar() {
  const pathname = usePathname();
  const t = useT('layout');
  const cartCount = useCartStore(selectCartCount);

  // В кабинете бизнеса, админке и на экранах auth своя навигация.
  if (
    pathname.startsWith('/business') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth')
  ) {
    return null;
  }

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
                  'relative flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <tab.icon className={cn('size-5', isActive && 'fill-primary/15')} />
                <span className="w-full truncate text-center leading-tight">
                  {t(`tabbar.${tab.key}`)}
                </span>
                {tab.href === '/cart' && cartCount > 0 ? (
                  <span className="absolute right-2 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
