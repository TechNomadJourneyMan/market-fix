import type { Metadata } from 'next';
import Link from 'next/link';
import { Eye, PenLine, Plus, Star, TrendingUp, Wallet } from 'lucide-react';

import { getBusinessVenues, getCurrentBusiness } from '@/server/repositories/business';
import { CATEGORY_BY_ID } from '@/data/seed/categories';
import {
  formatNumber,
  formatPercent,
  formatPrice,
  formatPriceCompact,
  formatRating,
} from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Мои объекты' };

export default function BusinessVenuesPage() {
  const business = getCurrentBusiness();
  const venues = getBusinessVenues(business.id);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Мои объекты</h1>
          <p className="text-sm text-muted-foreground">
            Карточки заведений, их показатели и быстрый доступ к редактированию
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/business/venues/new">
            <Plus />
            Добавить объект
          </Link>
        </Button>
      </header>

      <div className="space-y-4">
        {venues.map((venue) => {
          const category = CATEGORY_BY_ID.get(venue.categoryId);
          return (
            <article
              key={venue.id}
              className="overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-card"
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={venue.coverImage}
                  alt={venue.name}
                  loading="lazy"
                  className="h-40 w-full shrink-0 rounded-xl object-cover sm:size-32"
                />

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold">{venue.name}</h2>
                        <Badge
                          variant={venue.status === 'published' ? 'success' : 'secondary'}
                          size="sm"
                        >
                          {venue.status === 'published' ? 'Опубликовано' : 'Черновик'}
                        </Badge>
                        {venue.promotion ? (
                          <Badge variant="promo" size="sm">
                            Акция активна
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {category?.name} · {venue.location.districtName} ·{' '}
                        {venue.location.address}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/venue/${venue.slug}`}>
                          <Eye />
                          Смотреть
                        </Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/business/venues/${venue.slug}`}>
                          <PenLine />
                          Редактировать
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Metric
                      icon={Eye}
                      label="Просмотры"
                      value={formatNumber(venue.stats.views30d)}
                    />
                    <Metric
                      icon={TrendingUp}
                      label="Брони"
                      value={formatNumber(venue.stats.bookings30d)}
                    />
                    <Metric
                      icon={Wallet}
                      label="Доход"
                      value={formatPriceCompact(venue.stats.revenue30d)}
                    />
                    <Metric
                      icon={Star}
                      label="Рейтинг"
                      value={`${formatRating(venue.rating.score)} (${venue.rating.count})`}
                    />
                  </dl>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
                    <span>Средний чек: {formatPrice(venue.averagePrice)}</span>
                    <span>Вместимость: {venue.capacity}</span>
                    <span>Конверсия: {formatPercent(venue.stats.conversionRate, 1)}</span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-2.5">
      <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
    </div>
  );
}
