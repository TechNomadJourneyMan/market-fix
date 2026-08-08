'use client';

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
import { Badge } from '@/components/ui/badge';

const ITEMS = [
  { href: '/business', label: 'Дашборд', icon: LayoutDashboard, exact: true },
  { href: '/business/venues', label: 'Мои объекты', icon: Store },
  { href: '/business/bookings', label: 'Бронирования', icon: CalendarRange },
  { href: '/business/menu', label: 'Меню и услуги', icon: UtensilsCrossed },
  { href: '/business/products', label: 'Товары', icon: Package },
  { href: '/business/photos', label: 'Фотографии', icon: Images },
  { href: '/business/reviews', label: 'Отзывы', icon: MessageSquare },
  { href: '/business/analytics', label: 'Аналитика', icon: BarChart3 },
];

export function BusinessNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();

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
              <item.icon className="size-4" />
              {item.label}
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
                <item.icon className="size-[18px]" />
                <span className="flex-1">{item.label}</span>
                {item.href === '/business/bookings' && pendingCount > 0 ? (
                  <Badge variant="warning" size="sm">
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
