import type { Metadata } from 'next';
import { CalendarCheck } from 'lucide-react';

import { getCurrentUser } from '@/server/repositories/users';
import { getUserBookings } from '@/server/repositories/bookings';
import { formatVenues } from '@/lib/format';
import { BookingCard } from '@/components/account/booking-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'История бронирований' };

export default function AccountBookingsPage() {
  const user = getCurrentUser();
  const { upcoming, past } = getUserBookings(user.id);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Бронирования</h1>
        <p className="text-sm text-muted-foreground">
          Предстоящие визиты и вся история — с номерами броней и статусами
        </p>
      </header>

      <Tabs defaultValue="upcoming" className="space-y-5">
        <TabsList>
          <TabsTrigger value="upcoming">
            Предстоящие
            <span className="ml-1 text-xs text-muted-foreground">{upcoming.length}</span>
          </TabsTrigger>
          <TabsTrigger value="past">
            История
            <span className="ml-1 text-xs text-muted-foreground">{past.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck />}
              title="Предстоящих броней нет"
              description="Самое время выбрать место на выходные — лучшие столы разбирают за 3 дня."
              action={{ label: 'Найти заведение', href: '/catalog' }}
              secondaryAction={{ label: 'Подобрать с AI', href: '/ai' }}
            />
          ) : (
            upcoming.map((booking) => <BookingCard key={booking.id} booking={booking} />)
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-3">
          {past.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck />}
              title="История пока пустая"
              description="Здесь появятся места, которые вы уже посетили — вместе с возможностью оставить отзыв."
              action={{ label: 'Открыть каталог', href: '/catalog' }}
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Вы посетили {formatVenues(new Set(past.map((b) => b.venueId)).size)}
              </p>
              {past.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
