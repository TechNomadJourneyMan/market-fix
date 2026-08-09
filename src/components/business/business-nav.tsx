'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  CalendarRange,
  Images,
  LayoutDashboard,
  MessageSquare,
  Package,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/client';
import { Badge } from '@/components/ui/badge';

const ITEMS: {
  href: string;
  key: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
}[] = [
  { href: '/business', key: 'dashboard', icon: LayoutDashboard, exact: true },
  { href: '/business/venues', key: 'venues', icon: Store },
  { href: '/business/bookings', key: 'bookings', icon: CalendarRange },
  { href: '/business/menu', key: 'menu', icon: UtensilsCrossed },
  { href: '/business/products', key: 'products', icon: Package },
  { href: '/business/photos', key: 'photos', icon: Images },
  { href: '/business/reviews', key: 'reviews', icon: MessageSquare },
  { href: '/business/analytics', key: 'analytics', icon: BarChart3 },
];

export function BusinessNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  const t = useT('business');

  return (
    <nav>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
        {ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="whitespace-nowrap">{t(`nav.${item.key}`)}</span>
            </Link>
          );
        })}
      </div>

      <ul className="hidden space-y-1 lg:block">
        {ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                )}
              >
                <item.icon className="size-[18px] shrink-0" />
                <span className="min-w-0 flex-1">{t(`nav.${item.key}`)}</span>
                {item.href === '/business/bookings' && pendingCount > 0 ? (
                  <Badge variant="warning" size="sm" className="shrink-0">
                    {pendingCount}
                  </Badge>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
