'use client';

import { CalendarCheck, Clock, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import type { BookingTarget } from '@/store/use-booking-store';
import type { Venue } from '@/types';
import { formatPrice, formatRating, formatReviews } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/primitives';
import { useBookingStore } from '@/store/use-booking-store';
import { FavoriteButton } from './favorite-button';

function toTarget(venue: Venue, categoryName: string): BookingTarget {
  return {
    id: venue.id,
    slug: venue.slug,
    name: venue.name,
    coverImage: venue.coverImage,
    address: venue.location.address,
    averagePrice: venue.averagePrice,
    rating: venue.rating.score,
    reviewsCount: venue.rating.count,
    categoryName,
    capacity: venue.capacity,
  };
}

/** Липкая карточка бронирования — главный CTA детальной страницы. */
export function VenueBookingCard({
  venue,
  categoryName,
}: {
  venue: Venue;
  categoryName: string;
}) {
  const openBooking = useBookingStore((state) => state.open);
  const target = toTarget(venue, categoryName);

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-2xl font-semibold tracking-tight">
            {formatPrice(venue.averagePrice)}
          </p>
          <p className="text-xs text-muted-foreground">средний чек на человека</p>
        </div>
        <span className="text-right text-xs">
          <span className="block font-semibold">{formatRating(venue.rating.score)} ★</span>
          <span className="block text-muted-foreground">
            {formatReviews(venue.rating.count)}
          </span>
        </span>
      </div>

      {venue.promotion ? (
        <div className="mt-4 rounded-xl bg-gradient-to-r from-rose-500/10 to-orange-500/10 p-3">
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
            {venue.promotion.title} · −{venue.promotion.discountPercent}%
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {venue.promotion.description}
          </p>
        </div>
      ) : null}

      <div className="mt-5 space-y-2.5">
        <Button size="lg" className="w-full" onClick={() => openBooking(target)}>
          <CalendarCheck />
          Забронировать стол
        </Button>
        <FavoriteButton
          venueId={venue.id}
          venueName={venue.name}
          variant="outline"
          withLabel
          className="h-11 w-full"
        />
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Бронирование бесплатно. Подтверждение за 15 минут.
      </p>

      <Separator className="my-5" />

      <ul className="space-y-3 text-sm">
        <li className="flex items-start gap-2.5">
          <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span>
            Вместимость до {venue.capacity} гостей
            <span className="block text-xs text-muted-foreground">
              {venue.tables.length} столов в {new Set(venue.tables.map((t) => t.zone)).size}{' '}
              зонах
            </span>
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span>
            Стол держат 20 минут
            <span className="block text-xs text-muted-foreground">
              Отмена бесплатна за 2 часа до визита
            </span>
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <TrendingUp className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span>
            {venue.stats.bookings30d} броней за месяц
            <span className="block text-xs text-muted-foreground">
              Популярное место — лучше бронировать заранее
            </span>
          </span>
        </li>
      </ul>

      <div className="mt-5 flex items-center justify-center">
        <Badge variant="success" className="gap-1.5">
          <ShieldCheck className="size-3" />
          Заведение проверено платформой
        </Badge>
      </div>
    </div>
  );
}

/** Нижняя панель на мобильных — CTA всегда под рукой. */
export function VenueMobileBar({
  venue,
  categoryName,
}: {
  venue: Venue;
  categoryName: string;
}) {
  const openBooking = useBookingStore((state) => state.open);

  return (
    <div className="fixed inset-x-0 bottom-[3.75rem] z-30 border-t glass-strong p-3 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{formatPrice(venue.averagePrice)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {formatRating(venue.rating.score)} ★ · {formatReviews(venue.rating.count)}
          </p>
        </div>
        <FavoriteButton
          venueId={venue.id}
          venueName={venue.name}
          variant="outline"
        />
        <Button onClick={() => openBooking(toTarget(venue, categoryName))}>
          Забронировать
        </Button>
      </div>
    </div>
  );
}
