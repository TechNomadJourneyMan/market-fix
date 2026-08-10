import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  bootstrapAdminEngine,
  getVenueRatingSnapshot,
} from '@/server/repositories/admin';
import { getVenueListItems } from '@/server/repositories/venues';
import { buildCompareInsight, RATING_CRITERIA, factorScore } from '@/lib/compare';
import { formatPrice } from '@/lib/format';
import { getCuisineNames } from '@/server/mappers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookVenueButton } from '@/components/booking/book-venue-button';
import { CompareToggle } from '@/components/compare/compare-toggle';

export const metadata = {
  title: 'Сравнение заведений',
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  bootstrapAdminEngine();
  const params = await searchParams;
  const ids = (params.ids ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (ids.length < 2) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-semibold">Сравнение</h1>
        <p className="mt-2 text-muted-foreground">Выберите минимум 2 заведения на странице рейтинга или в каталоге.</p>
        <Button asChild className="mt-6">
          <Link href="/ratings">К рейтингу</Link>
        </Button>
      </div>
    );
  }

  const venues = getVenueListItems(ids);
  if (venues.length < 2) notFound();

  const enriched = venues.map((venue) => ({
    ...venue,
    snapshot: getVenueRatingSnapshot(venue.id),
  }));
  const insight = buildCompareInsight(enriched);

  return (
    <div className="container space-y-8 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Сравнение</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {enriched.length} заведения · похожее и отличия ниже
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/ratings">Вернуться к рейтингу</Link>
        </Button>
      </div>

      <section className="grid gap-4 rounded-2xl border bg-card p-5 shadow-soft md:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Чем похожи
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {insight.similar.length ? (
              insight.similar.map((item) => (
                <li key={item} className="rounded-xl border border-success/20 bg-success/5 px-3 py-2">
                  {item}
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">Явных сходств мало — места довольно разные.</li>
            )}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Чем отличаются
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {insight.different.length ? (
              insight.different.map((item) => (
                <li key={item} className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                  {item}
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">Сильных отличий не найдено.</li>
            )}
          </ul>
        </div>
      </section>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b bg-secondary/40 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Параметр</th>
              {enriched.map((venue) => (
                <th key={venue.id} className="px-4 py-3 font-medium">
                  <Link href={`/venue/${venue.slug}`} className="hover:underline">
                    {venue.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-4 py-3 text-muted-foreground">Фото</td>
              {enriched.map((venue) => (
                <td key={venue.id} className="px-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={venue.coverImage} alt="" className="h-20 w-28 rounded-xl object-cover" />
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="px-4 py-3 text-muted-foreground">Рейтинг /10</td>
              {enriched.map((venue) => (
                <td key={venue.id} className="px-4 py-3 font-semibold">
                  {(venue.snapshot?.layers.finalScore ?? venue.rating.score * 2).toFixed(1)}
                  <Badge variant="outline" className="ml-2">
                    ★ {venue.rating.score.toFixed(1)}
                  </Badge>
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="px-4 py-3 text-muted-foreground">Цена</td>
              {enriched.map((venue) => (
                <td key={venue.id} className="px-4 py-3">
                  {formatPrice(venue.averagePrice)}
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="px-4 py-3 text-muted-foreground">Кухня</td>
              {enriched.map((venue) => (
                <td key={venue.id} className="px-4 py-3">
                  {getCuisineNames(venue.cuisineIds).join(', ') || '—'}
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="px-4 py-3 text-muted-foreground">Район</td>
              {enriched.map((venue) => (
                <td key={venue.id} className="px-4 py-3">
                  {venue.location.districtName}
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="px-4 py-3 text-muted-foreground">Вместимость</td>
              {enriched.map((venue) => (
                <td key={venue.id} className="px-4 py-3">
                  до {venue.capacity}
                </td>
              ))}
            </tr>
            {RATING_CRITERIA.map((criterion) => (
              <tr key={criterion.key} className="border-b">
                <td className="px-4 py-3 text-muted-foreground">{criterion.label}</td>
                {enriched.map((venue) => {
                  const score = factorScore(venue.snapshot, criterion.key);
                  const best = Math.max(
                    ...enriched.map((item) => factorScore(item.snapshot, criterion.key)),
                  );
                  return (
                    <td
                      key={venue.id}
                      className={`px-4 py-3 ${score === best && score > 0 ? 'font-semibold text-primary' : ''}`}
                    >
                      {score ? score.toFixed(1) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="px-4 py-3 text-muted-foreground">Действия</td>
              {enriched.map((venue) => (
                <td key={venue.id} className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/venue/${venue.slug}`}>Открыть</Link>
                    </Button>
                    <BookVenueButton venue={venue} />
                    <CompareToggle venueId={venue.id} venueName={venue.name} />
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
