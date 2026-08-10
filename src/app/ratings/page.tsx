import Link from 'next/link';
import { Star } from 'lucide-react';

import { bootstrapAdminEngine, listAdminRatings } from '@/server/repositories/admin';
import { toVenueListItem } from '@/server/mappers';
import { RATING_CRITERIA, factorScore } from '@/lib/compare';
import { DEMO_USER_LOCATION } from '@/data/seed/users';
import { distanceKm } from '@/lib/geo';
import { formatPrice } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookVenueButton } from '@/components/booking/book-venue-button';
import { CompareToggle } from '@/components/compare/compare-toggle';
import type { RatingFactorKey } from '@/types';

export const metadata = {
  title: 'Рейтинг заведений',
  description: 'Объективный рейтинг Market Fix с критериями и сравнением',
};

export default async function RatingsPage({
  searchParams,
}: {
  searchParams: Promise<{ criterion?: string; min?: string }>;
}) {
  bootstrapAdminEngine();
  const params = await searchParams;
  const criterion = (params.criterion as RatingFactorKey | undefined) ?? undefined;
  const min = Number(params.min ?? 0) || 0;

  let items = listAdminRatings();
  if (criterion) {
    items = items.filter(({ snapshot }) => factorScore(snapshot, criterion) >= (min || 7));
  }

  return (
    <div className="container py-8 sm:py-10">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Explainable rating
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Рейтинг заведений</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Не просто среднее звёзд. Разложение по критериям HoReCa, Bayesian-сглаживание и объяснение
          итога. Добавьте 2–4 места в сравнение.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card p-4 shadow-soft">
            <h2 className="text-sm font-semibold">Критерии</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Фильтр: критерий ≥ {min || 7}/10
            </p>
            <ul className="mt-3 space-y-1">
              <li>
                <Link
                  href="/ratings"
                  className={`block rounded-xl px-3 py-2 text-sm ${!criterion ? 'bg-foreground text-background' : 'hover:bg-secondary'}`}
                >
                  Все критерии
                </Link>
              </li>
              {RATING_CRITERIA.map((item) => (
                <li key={item.key}>
                  <Link
                    href={`/ratings?criterion=${item.key}&min=7`}
                    className={`block rounded-xl px-3 py-2 text-sm ${
                      criterion === item.key ? 'bg-foreground text-background' : 'hover:bg-secondary'
                    }`}
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className="mt-0.5 block text-[11px] opacity-70">{item.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border bg-card p-4 text-xs text-muted-foreground shadow-soft">
            <p className="font-semibold text-foreground">Как считается</p>
            <p className="mt-2">
              Raw → AI Interpretation → Scoring (Bayesian) → Editorial Override → Final. Value выше
              при лучшем соотношении цена/качество, а не при высокой цене.
            </p>
          </div>
        </aside>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Найдено {items.length} заведений</p>
          {items.map(({ venue, snapshot }, index) => {
            const listItem = toVenueListItem(
              venue,
              Number(distanceKm(DEMO_USER_LOCATION, venue.location.coordinates).toFixed(2)),
            );
            return (
              <article
                key={venue.id}
                className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-soft sm:flex-row sm:items-stretch"
              >
                <div className="flex items-center gap-3 sm:w-16 sm:flex-col sm:justify-center">
                  <span className="text-2xl font-semibold tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="text-center">
                    <div className="text-2xl font-semibold tracking-tight">
                      {(snapshot?.layers.finalScore ?? venue.rating.score * 2).toFixed(1)}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      /10
                    </div>
                  </div>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={venue.coverImage}
                  alt={venue.name}
                  className="h-28 w-full rounded-xl object-cover sm:h-auto sm:w-36"
                />

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link href={`/venue/${venue.slug}`} className="text-lg font-semibold hover:underline">
                        {venue.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {listItem.categoryName} · {venue.location.districtName} ·{' '}
                        {formatPrice(venue.averagePrice)}
                      </p>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {venue.rating.score.toFixed(1)} · {venue.rating.count}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {snapshot?.explanation ?? venue.tagline}
                  </p>

                  <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {(snapshot?.factors ?? []).slice(0, 6).map((factor) => (
                      <div key={factor.key} className="rounded-lg border px-2.5 py-1.5 text-xs">
                        <div className="flex justify-between gap-2">
                          <span>{factor.label}</span>
                          <span className="font-semibold">{factor.score.toFixed(1)}</span>
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, factor.score * 10)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/venue/${venue.slug}`}>Подробнее</Link>
                    </Button>
                    <CompareToggle venueId={venue.id} venueName={venue.name} />
                    <BookVenueButton venue={listItem} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
