import type { Metadata } from 'next';
import { Gift } from 'lucide-react';

import {
  getCurrentUser,
  getUnreadNotificationCount,
  getUserStats,
} from '@/server/repositories/users';
import { formatNumber, formatDateFull } from '@/lib/format';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/badge';
import { AccountNav } from '@/components/account/account-nav';

export const metadata: Metadata = {
  title: { default: 'Личный кабинет', template: '%s · Кабинет · Мезгіл' },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  const stats = getUserStats(user.id);
  const unreadCount = getUnreadNotificationCount(user.id);

  return (
    <div className="container py-6 sm:py-10">
      {/* ——— Шапка профиля ——— */}
      <header className="flex flex-col gap-4 rounded-3xl border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
        <Avatar className="size-16 sm:size-20">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{user.name}</h1>
          <p className="text-sm text-muted-foreground">
            {user.email} · с нами с {formatDateFull(user.joinedAt.slice(0, 10))}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary">{stats.totalBookings} бронирований</Badge>
            <Badge variant="secondary">{stats.favorites} в избранном</Badge>
            <Badge variant="secondary">{stats.reviews} отзывов</Badge>
          </div>
        </div>

        <div className="shrink-0 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 p-4 text-center sm:min-w-[9rem]">
          <Gift className="mx-auto size-5 text-primary" />
          <p className="mt-1.5 text-xl font-semibold tracking-tight">
            {formatNumber(stats.loyaltyPoints)}
          </p>
          <p className="text-xs text-muted-foreground">бонусных баллов</p>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[236px_minmax(0,1fr)] lg:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AccountNav unreadCount={unreadCount} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
