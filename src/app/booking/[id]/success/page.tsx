import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Info,
  MapPin,
  Navigation,
  Share2,
  Users,
} from 'lucide-react';

import { getBookingById } from '@/server/repositories/bookings';
import { getPaymentByBooking } from '@/server/repositories/payments';
import { getVenueById, getSimilarVenues } from '@/server/repositories/venues';
import { formatDateWithWeekday, formatGuests, formatPrice } from '@/lib/format';
import { getDirectionsUrl } from '@/lib/geo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/primitives';
import { ScrollRow } from '@/components/ui/section';
import { VenueCardMini } from '@/components/venue/venue-card';

export const metadata: Metadata = {
  title: 'Бронирование подтверждено',
};

export default async function BookingSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = getBookingById(id);
  if (!booking) notFound();

  const venue = getVenueById(booking.venueId);
  const payment = getPaymentByBooking(booking.id);
  const similar = venue ? getSimilarVenues(venue, 6) : [];

  return (
    <div className="container max-w-3xl py-10 sm:py-16">
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-success/12 text-success">
          <CheckCircle2 className="size-8" />
        </span>

        <h1 className="mt-5 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          Готово! Стол ваш
        </h1>
        <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-muted-foreground">
          Мы отправили подтверждение на {booking.guest.email} и передали заведению все детали.
          Номер брони —{' '}
          <span className="font-semibold text-foreground">{booking.reference}</span>
        </p>
      </div>

      {/* Заглушка эквайринга — прямое требование ТЗ */}
      {payment ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed bg-muted/40 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="text-sm">
            <p className="font-medium">Эквайринг будет подключен позже</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Это демонстрационный платёж на {formatPrice(payment.amount)}. Реальное списание
              не производилось — платёжный провайдер подключается на следующем этапе.
            </p>
          </div>
        </div>
      ) : null}

      {/* Карточка брони */}
      <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="flex gap-4 border-b p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={booking.venueImage}
            alt={booking.venueName}
            className="size-24 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/venue/${booking.venueSlug}`}>
                  <p className="truncate text-lg font-semibold hover:text-primary">
                    {booking.venueName}
                  </p>
                </Link>
                <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 size-3 shrink-0" />
                  {booking.venueAddress}
                </p>
              </div>
              <Badge variant="success" className="shrink-0">
                Подтверждено
              </Badge>
            </div>
          </div>
        </div>

        <dl className="grid gap-4 p-5 sm:grid-cols-3">
          <Detail icon={CalendarDays} label="Дата" value={formatDateWithWeekday(booking.date)} />
          <Detail icon={Clock} label="Время" value={booking.time} />
          <Detail icon={Users} label="Гости" value={formatGuests(booking.guests)} />
        </dl>

        {booking.comment ? (
          <>
            <Separator />
            <div className="p-5">
              <p className="text-xs font-medium text-muted-foreground">
                Ваш комментарий передан заведению
              </p>
              <p className="mt-1 text-sm">«{booking.comment}»</p>
            </div>
          </>
        ) : null}

        {booking.total > 0 ? (
          <>
            <Separator />
            <div className="flex items-center justify-between p-5">
              <span className="text-sm text-muted-foreground">Оплачено</span>
              <span className="text-lg font-semibold">{formatPrice(booking.total)}</span>
            </div>
          </>
        ) : null}
      </div>

      {/* Действия */}
      <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
        {venue ? (
          <Button asChild variant="outline">
            <a
              href={getDirectionsUrl(venue.location.coordinates, venue.name)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation />
              Доехать
            </a>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/account/bookings">
            <CalendarDays />
            Мои бронирования
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/venue/${booking.venueSlug}`}>
            <Share2 />
            Открыть заведение
          </Link>
        </Button>
      </div>

      {/* Что дальше */}
      <div className="mt-8 rounded-2xl border bg-muted/30 p-5">
        <p className="text-sm font-semibold">Что дальше</p>
        <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
          <li className="flex gap-2.5">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold text-primary">
              1
            </span>
            Заведение подтвердит бронь в течение 15 минут — придёт уведомление.
          </li>
          <li className="flex gap-2.5">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold text-primary">
              2
            </span>
            Накануне визита напомним о брони и подскажем, когда выезжать.
          </li>
          <li className="flex gap-2.5">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold text-primary">
              3
            </span>
            После визита сможете оставить отзыв и получить бонусные баллы.
          </li>
        </ul>
      </div>

      {similar.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">
            Может пригодиться в следующий раз
          </h2>
          <ScrollRow>
            {similar.map((item) => (
              <VenueCardMini key={item.id} venue={item} />
            ))}
          </ScrollRow>
        </section>
      ) : null}
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}
