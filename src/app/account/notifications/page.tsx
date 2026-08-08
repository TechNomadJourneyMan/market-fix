import type { Metadata } from 'next';
import { Bell } from 'lucide-react';

import { getCurrentUser, getNotifications } from '@/server/repositories/users';
import { NotificationList } from '@/components/account/notification-list';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: 'Уведомления' };

export default function NotificationsPage() {
  const user = getCurrentUser();
  const notifications = getNotifications(user.id);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Уведомления</h1>
        <p className="text-sm text-muted-foreground">
          Напоминания о бронях, ответы заведений и подходящие акции
        </p>
      </header>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell />}
          title="Уведомлений нет"
          description="Здесь появятся напоминания о бронях и предложения, которые вам подойдут."
          action={{ label: 'Открыть каталог', href: '/catalog' }}
        />
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </div>
  );
}
