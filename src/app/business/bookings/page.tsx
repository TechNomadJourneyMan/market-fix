import type { Metadata } from 'next';
import { CalendarRange } from 'lucide-react';

import { getCurrentBusiness } from '@/server/repositories/business';
import { getBusinessBookings } from '@/server/repositories/bookings';
import { DEMO_TODAY } from '@/data/builders/bookings';
import { toDateKey, formatPrice } from '@/lib/format';
import { BusinessBookingsTable } from '@/components/business/bookings-table';
import { MetricCard } from '@/components/business/metric-card';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: 'Бронирования' };

export default function BusinessBookingsPage() {
  const business = getCurrentBusiness();
  const bookings = getBusinessBookings(business.id);
  const todayKey = toDateKey(DEMO_TODAY);

  const today = bookings.filter((booking) => booking.date === todayKey);
  const pending = bookings.filter((booking) => booking.status === 'pending');
  const upcoming = bookings.filter(
    (booking) => booking.date >= todayKey && booking.status !== 'cancelled',
  );
  const revenue = bookings
    .filter((booking) => booking.status === 'completed' || booking.status === 'confirmed')
    .reduce((sum, booking) => sum + booking.subtotal, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Бронирования</h1>
        <p className="text-sm text-muted-foreground">
          Все заявки по вашим объектам — с гостями, комментариями и статусами
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Сегодня" value={String(today.length)} hint="броней на сегодня" />
        <MetricCard label="Ожидают ответа" value={String(pending.length)} hint="нужно подтвердить" />
        <MetricCard label="Предстоящие" value={String(upcoming.length)} hint="в ближайшие дни" />
        <MetricCard label="Депозиты" value={formatPrice(revenue)} hint="принято через платформу" />
      </section>

      {bookings.length === 0 ? (
        <EmptyState
          icon={<CalendarRange />}
          title="Броней пока нет"
          description="Как только гости начнут бронировать столы, заявки появятся здесь."
        />
      ) : (
        <BusinessBookingsTable bookings={bookings} />
      )}
    </div>
  );
}
