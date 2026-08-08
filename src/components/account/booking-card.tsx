'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  CalendarDays,
  Clock,
  CreditCard,
  MapPin,
  MessageSquare,
  Navigation,
  Users,
  X,
} from 'lucide-react';
import type { Booking, BookingStatus } from '@/types';
import { apiClient } from '@/lib/api-client';
import { formatDateWithWeekday, formatGuests, formatPrice } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const STATUS_META: Record<
  BookingStatus,
  { label: string; variant: 'default' | 'success' | 'warning' | 'secondary' | 'destructive' }
> = {
  pending: { label: 'Ожидает подтверждения', variant: 'warning' },
  awaiting_payment: { label: 'Ожидает оплаты', variant: 'warning' },
  confirmed: { label: 'Подтверждено', variant: 'success' },
  completed: { label: 'Состоялось', variant: 'secondary' },
  cancelled: { label: 'Отменено', variant: 'destructive' },
  no_show: { label: 'Не пришли', variant: 'destructive' },
};

export function BookingCard({ booking }: { booking: Booking }) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = React.useState(false);
  const status = STATUS_META[booking.status];

  const canCancel = booking.status === 'confirmed' || booking.status === 'pending';
  const needsPayment = booking.status === 'awaiting_payment';

  const cancel = async () => {
    setIsCancelling(true);
    try {
      await apiClient.patch(`/api/bookings/${booking.id}`, { status: 'cancelled' });
      toast.success('Бронь отменена');
      router.refresh();
    } catch {
      toast.error('Не удалось отменить бронь');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-card">
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        <Link href={`/venue/${booking.venueSlug}`} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={booking.venueImage}
            alt={booking.venueName}
            loading="lazy"
            className="h-36 w-full rounded-xl object-cover sm:size-28"
          />
        </Link>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/venue/${booking.venueSlug}`}>
                <p className="truncate font-semibold hover:text-primary">
                  {booking.venueName}
                </p>
              </Link>
              <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                <MapPin className="mt-0.5 size-3 shrink-0" />
                <span className="line-clamp-1">{booking.venueAddress}</span>
              </p>
            </div>
            <Badge variant={status.variant} className="shrink-0">
              {status.label}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-muted-foreground" />
              {formatDateWithWeekday(booking.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" />
              {booking.time}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5 text-muted-foreground" />
              {formatGuests(booking.guests)}
            </span>
            {booking.total > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CreditCard className="size-3.5 text-muted-foreground" />
                {formatPrice(booking.total)}
              </span>
            ) : null}
          </div>

          {booking.comment ? (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MessageSquare className="mt-0.5 size-3 shrink-0" />
              «{booking.comment}»
            </p>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Номер брони: <span className="font-medium text-foreground">{booking.reference}</span>
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {needsPayment ? (
              <Button asChild size="sm">
                <Link href={`/checkout/${booking.id}`}>
                  <CreditCard />
                  Оплатить депозит
                </Link>
              </Button>
            ) : null}

            {booking.status === 'confirmed' ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/venue/${booking.venueSlug}#location`}>
                  <Navigation />
                  Как доехать
                </Link>
              </Button>
            ) : null}

            {booking.status === 'completed' && !booking.hasReview ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/venue/${booking.venueSlug}#reviews`}>Оставить отзыв</Link>
              </Button>
            ) : null}

            {booking.status === 'completed' ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/venue/${booking.venueSlug}`}>Забронировать снова</Link>
              </Button>
            ) : null}

            {canCancel ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={cancel}
                isLoading={isCancelling}
                className="ml-auto text-muted-foreground hover:text-destructive"
              >
                <X />
                Отменить
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
