'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  CalendarRange,
  Gauge,
  LayoutDashboard,
  MessageSquareWarning,
  ScrollText,
  Star,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
}[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/venues', label: 'Заведения', icon: Building2 },
  { href: '/admin/bookings', label: 'Бронирования', icon: CalendarRange },
  { href: '/admin/reviews', label: 'Отзывы / модерация', icon: MessageSquareWarning },
  { href: '/admin/ratings', label: 'Рейтинги', icon: Star },
  { href: '/admin/users', label: 'Пользователи', icon: Users },
  { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
];

export function AdminNav({ openCount = 0 }: { openCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      <div className="mb-3 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Gauge className="size-3.5" />
        Operations
      </div>
      {ITEMS.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.href === '/admin/reviews' && openCount > 0 ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  isActive ? 'bg-background/20 text-background' : 'bg-destructive/10 text-destructive',
                )}
              >
                {openCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
