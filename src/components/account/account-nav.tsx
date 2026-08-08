'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  CalendarCheck,
  Heart,
  History,
  Settings,
  Sparkles,
  Star,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const ITEMS = [
  { href: '/account', label: 'Профиль', icon: User, exact: true },
  { href: '/account/bookings', label: 'Бронирования', icon: CalendarCheck },
  { href: '/account/favorites', label: 'Избранное', icon: Heart },
  { href: '/account/recommendations', label: 'Рекомендации', icon: Star },
  { href: '/account/ai', label: 'AI-советы', icon: Sparkles },
  { href: '/account/searches', label: 'История поиска', icon: History },
  { href: '/account/notifications', label: 'Уведомления', icon: Bell },
  { href: '/account/settings', label: 'Настройки', icon: Settings },
];

export function AccountNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  return (
    <nav>
      {/* Мобильный вариант — горизонтальная лента */}
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
              {item.href === '/account/notifications' && unreadCount > 0 ? (
                <Badge variant="destructive" size="sm">
                  {unreadCount}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Десктопный вариант — вертикальный список */}
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
                {item.href === '/account/notifications' && unreadCount > 0 ? (
                  <Badge variant="destructive" size="sm">
                    {unreadCount}
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
