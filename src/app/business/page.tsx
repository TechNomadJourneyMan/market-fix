import Link from 'next/link';
import {
  ArrowRight,
  CalendarRange,
  Eye,
  MessageSquare,
  Percent,
  Star,
  Users,
  Wallet,
} from 'lucide-react';

import {
  getBusinessAnalytics,
  getCurrentBusiness,
  getDashboardMetrics,
  getUpcomingBusinessBookings,
} from '@/server/repositories/business';
import { getBusinessReviews } from '@/server/repositories/reviews';
import { formatPercent, formatPriceCompact } from '@/lib/format';
import {
  formatDateI18n,
  formatNumberI18n,
  formatPriceI18n,
  formatRatingI18n,
} from '@/i18n/format';
import { getLocale, getTranslator } from '@/i18n/server';

import { MetricCard } from '@/components/business/metric-card';
import { AreaChart, BarList } from '@/components/business/charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default async function BusinessDashboardPage() {
  const t = await getTranslator('business');
  const locale = await getLocale();
  const business = getCurrentBusiness();
  const metrics = getDashboardMetrics(business.id);
  const analytics = getBusinessAnalytics(business.id, 30);
  const upcoming = getUpcomingBusinessBookings(business.id, 6);
  const reviews = getBusinessReviews(business.id, 3);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('dashboard.description')}</p>
      </header>

      {/* ——— Метрики ——— */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t('dashboard.metrics.views')}
          value={formatNumberI18n(metrics.views, locale)}
          delta={metrics.viewsDelta}
          icon={Eye}
        />
        <MetricCard
          label={t('dashboard.metrics.bookings')}
          value={formatNumberI18n(metrics.bookings, locale)}
          delta={metrics.bookingsDelta}
          icon={CalendarRange}
        />
        <MetricCard
          label={t('dashboard.metrics.revenue')}
          value={formatPriceCompact(metrics.revenue)}
          delta={metrics.revenueDelta}
          icon={Wallet}
        />
        <MetricCard
          label={t('dashboard.metrics.conversion')}
          value={formatPercent(metrics.conversionRate, 1)}
          delta={metrics.conversionDelta}
          hint={t('dashboard.metrics.conversionHint')}
          icon={Percent}
        />
      </section>

      {/* ——— График ——— */}
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{t('dashboard.chartTitle')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.chartSubtitle', {
                bookings: formatNumberI18n(metrics.bookings, locale),
                averageCheck: formatPriceI18n(metrics.averageCheck, locale),
              })}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/business/analytics">
              <span className="whitespace-nowrap">{t('dashboard.fullAnalytics')}</span>
              <ArrowRight />
            </Link>
          </Button>
        </div>

        <AreaChart data={analytics.bookings} className="mt-5" height={190} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ——— Ближайшие брони ——— */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="min-w-0 text-base font-semibold">
              {t('dashboard.upcomingTitle')}
            </h2>
            <Link
              href="/business/bookings"
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              {t('dashboard.all')}
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarRange />}
              title={t('dashboard.upcomingEmpty.title')}
              description={t('dashboard.upcomingEmpty.description')}
              compact
            />
          ) : (
            <ul className="divide-y rounded-2xl border">
              {upcoming.map((booking) => (
                <li key={booking.id} className="flex items-center gap-3 p-3.5">
                  <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary text-center">
                    <span className="text-xs font-semibold leading-none">
                      {booking.date.slice(8, 10)}
                    </span>
                    <span className="mt-0.5 text-[9px] uppercase text-muted-foreground">
                      {formatDateI18n(booking.date, locale, { month: 'short' })}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{booking.guest.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {booking.venueName} · {booking.time} ·{' '}
                      {t('common:counts.guests', { count: booking.guests })}
                    </p>
                  </div>

                  <Badge
                    variant={booking.status === 'confirmed' ? 'success' : 'warning'}
                    size="sm"
                    className="shrink-0"
                  >
                    {booking.status === 'confirmed'
                      ? t('dashboard.statusShort.confirmed')
                      : t('dashboard.statusShort.pending')}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ——— Источники ——— */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Откуда приходят гости</h2>
          <div className="rounded-2xl border bg-card p-5">
            <BarList data={analytics.sources} />
            <p className="mt-4 text-xs text-muted-foreground">
              AI-подбор приводит {analytics.sources[2]?.value ?? 0}% гостей — это самый
              быстрорастущий канал.
            </p>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ——— Объекты ——— */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-base font-semibold">Объекты по доходу</h2>
            <Link
              href="/business/venues"
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              Управлять →
            </Link>
          </div>
          <ul className="divide-y rounded-2xl border">
            {analytics.topVenues.map((venue, index) => (
              <li key={venue.venueId} className="flex items-center gap-3 p-3.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{venue.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {venue.bookings} броней за месяц
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {formatPriceCompact(venue.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ——— Отзывы ——— */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              {t('dashboard.reviewsTitle')}
              <Badge variant="secondary" size="sm">
                <Star className="size-2.5 fill-amber-400 text-amber-400" />
                {formatRatingI18n(metrics.rating, locale)}
              </Badge>
            </h2>
            <Link
              href="/business/reviews"
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              {t('dashboard.allReviews', {
                count: formatNumberI18n(metrics.reviewsCount, locale),
              })}
            </Link>
          </div>

          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{review.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {review.author.name} · {review.venueName}
                    </p>
                  </div>
                  <Badge variant={review.rating >= 4 ? 'success' : 'warning'} size="sm">
                    {review.rating} ★
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {review.text}
                </p>
                {!review.reply ? (
                  <Button asChild variant="ghost" size="sm" className="mt-2 -ml-2">
                    <Link href="/business/reviews">
                      <MessageSquare />
                      Ответить
                    </Link>
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ——— Заполняемость ——— */}
      <section className="rounded-2xl border bg-gradient-to-br from-primary/[0.05] to-accent/[0.05] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl brand-gradient text-white">
              <Users className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                Заполняемость {formatPercent(metrics.occupancyRate)}
              </p>
              <p className="text-xs text-muted-foreground">
                Доля состоявшихся броней от всех заявок за период
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/business/analytics">Как это улучшить</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
