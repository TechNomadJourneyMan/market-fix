import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from 'lucide-react';

import { getBookingById } from '@/server/repositories/bookings';
import { buildPaymentBreakdown, PAYMENT_METHODS } from '@/server/repositories/payments';
import { formatDateWithWeekday, formatGuests, formatPrice } from '@/lib/format';
import { PaymentForm } from '@/components/checkout/payment-form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Оплата бронирования',
  description: 'Проверьте детали заказа и подтвердите оплату депозита.',
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const booking = getBookingById(bookingId);
  if (!booking) notFound();

  const breakdown = buildPaymentBreakdown(bookingId);
  if (!breakdown) notFound();

  return (
    <div className="container max-w-5xl py-8 sm:py-12">
      <Link
        href={`/venue/${booking.venueSlug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Вернуться к заведению
      </Link>

      <header className="mt-4 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Осталось подтвердить оплату
        </h1>
        <p className="text-sm text-muted-foreground">
          Бронь {booking.reference} держим за вами. После оплаты статус сменится на
          «Подтверждено», а депозит зачтётся в счёт заведения.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
        {/* ——— Способ оплаты ——— */}
        <div className="space-y-5">
          <h2 className="text-lg font-semibold tracking-tight">Способ оплаты</h2>
          <PaymentForm
            bookingId={booking.id}
            total={breakdown.total}
            methods={PAYMENT_METHODS}
          />
        </div>

        {/* ——— Заказ ——— */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
            <div className="flex gap-3 border-b p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={booking.venueImage}
                alt={booking.venueName}
                className="size-20 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{booking.venueName}</p>
                <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 size-3 shrink-0" />
                  <span className="line-clamp-2">{booking.venueAddress}</span>
                </p>
                <Badge variant="warning" size="sm" className="mt-1.5">
                  Ожидает оплаты
                </Badge>
              </div>
            </div>

            <dl className="space-y-2.5 border-b p-4 text-sm">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                <dt className="sr-only">Дата</dt>
                <dd>{formatDateWithWeekday(booking.date)}</dd>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <dt className="sr-only">Время</dt>
                <dd>{booking.time}</dd>
              </div>
              <div className="flex items-center gap-2.5">
                <Users className="size-4 shrink-0 text-muted-foreground" />
                <dt className="sr-only">Гости</dt>
                <dd>{formatGuests(booking.guests)}</dd>
              </div>
              {booking.comment ? (
                <div className="rounded-xl bg-muted/50 p-2.5 text-xs text-muted-foreground">
                  «{booking.comment}»
                </div>
              ) : null}
            </dl>

            {/* Расчёт: заказ → стоимость → комиссия → итого (по ТЗ) */}
            <div className="space-y-2.5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Заказ
              </p>

              {breakdown.lines.map((line, index) => (
                <div key={index} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block">{line.label}</span>
                    {line.note ? (
                      <span className="block text-xs text-muted-foreground">{line.note}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-medium">{formatPrice(line.amount)}</span>
                </div>
              ))}

              <Separator className="my-3" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Стоимость</span>
                <span className="font-medium">{formatPrice(breakdown.subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Комиссия сервиса · {breakdown.commissionPercent}%
                </span>
                <span className="font-medium">{formatPrice(breakdown.commission)}</span>
              </div>

              {breakdown.discount > 0 ? (
                <div className="flex items-center justify-between text-sm text-success">
                  <span>Скидка по акции</span>
                  <span className="font-medium">−{formatPrice(breakdown.discount)}</span>
                </div>
              ) : null}

              <Separator className="my-3" />

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">Итого</span>
                <span className="text-xl font-semibold tracking-tight">
                  {formatPrice(breakdown.total)}
                </span>
              </div>

              <p className="pt-1 text-xs text-muted-foreground">
                Депозит вычитается из финального счёта в заведении. При отмене за 2 часа до
                визита возвращается полностью.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
