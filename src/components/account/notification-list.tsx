'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BadgePercent,
  BellRing,
  CalendarCheck,
  CheckCheck,
  Info,
  MessageSquareHeart,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { AppNotification, NotificationKind } from '@/types';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/format';
import { Button } from '@/components/ui/button';

const KIND_META: Record<
  NotificationKind,
  { icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  booking_confirmed: { icon: CalendarCheck, className: 'bg-success/12 text-success' },
  booking_reminder: { icon: BellRing, className: 'bg-primary/10 text-primary' },
  booking_cancelled: { icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  promo: { icon: BadgePercent, className: 'bg-warning/15 text-warning' },
  recommendation: { icon: Sparkles, className: 'bg-accent/12 text-accent' },
  review_reply: { icon: MessageSquareHeart, className: 'bg-primary/10 text-primary' },
  system: { icon: Info, className: 'bg-secondary text-muted-foreground' },
};

export function NotificationList({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  const router = useRouter();
  const [readIds, setReadIds] = React.useState<string[]>([]);
  const [allRead, setAllRead] = React.useState(false);

  const unreadCount = notifications.filter(
    (item) => !item.isRead && !readIds.includes(item.id) && !allRead,
  ).length;

  const markAll = async () => {
    setAllRead(true);
    await apiClient.post('/api/notifications', { all: true });
    router.refresh();
  };

  const markOne = async (id: string) => {
    setReadIds((current) => [...current, id]);
    await apiClient.post('/api/notifications', { id });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {unreadCount > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border bg-primary/[0.04] px-4 py-3">
          <p className="text-sm">
            <span className="font-semibold">{unreadCount}</span> непрочитанных
          </p>
          <Button variant="ghost" size="sm" onClick={markAll}>
            <CheckCheck />
            Отметить всё прочитанным
          </Button>
        </div>
      ) : null}

      <ul className="divide-y rounded-2xl border">
        {notifications.map((notification) => {
          const meta = KIND_META[notification.kind];
          const isRead = notification.isRead || readIds.includes(notification.id) || allRead;

          const content = (
            <div
              className={cn(
                'flex gap-3 p-4 transition-colors',
                !isRead && 'bg-primary/[0.03]',
                notification.href && 'hover:bg-secondary/50',
              )}
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl',
                  meta.className,
                )}
              >
                <meta.icon className="size-[18px]" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className={cn('text-sm', isRead ? 'font-medium' : 'font-semibold')}>
                    {notification.title}
                  </p>
                  {!isRead ? (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {notification.text}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {formatRelativeTime(notification.createdAt)}
                </p>
              </div>
            </div>
          );

          return (
            <li key={notification.id}>
              {notification.href ? (
                <Link href={notification.href} onClick={() => markOne(notification.id)}>
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => markOne(notification.id)}
                  className="block w-full text-left"
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
