'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, Sparkles, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { selectCartCount, useCartStore } from '@/store/use-cart-store';

const TABS = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/catalog', label: 'Поиск', icon: Search },
  { href: '/ai', label: 'AI', icon: Sparkles },
  { href: '/merge', label: 'Merge', icon: Users },
  { href: '/cart', label: 'Корзина', icon: ShoppingBag },
];

/** Нижняя навигация — основной способ перемещения на мобильных. */
export function MobileTabBar() {
  const pathname = usePathname();
  const cartCount = useCartStore(selectCartCount);

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
                  'relative flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <tab.icon className={cn('size-5', isActive && 'fill-primary/15')} />
                {tab.label}
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
