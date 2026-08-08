import type { Metadata } from 'next';
import Link from 'next/link';
import { History, Search } from 'lucide-react';

import { getCurrentUser, getSearchHistory } from '@/server/repositories/users';
import { buildCatalogHref } from '@/lib/query-params';
import { formatRelativeTime, formatVenues } from '@/lib/format';
import { CATEGORY_BY_ID, CUISINE_BY_ID } from '@/data/seed/categories';
import { DISTRICT_BY_ID } from '@/data/seed/geo';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: 'История поиска' };

/** Человекочитаемое описание сохранённых фильтров. */
function describeFilters(filters: Record<string, unknown>): string[] {
  const parts: string[] = [];

  (filters.categoryIds as string[] | undefined)?.forEach((id) => {
    const name = CATEGORY_BY_ID.get(id)?.name;
    if (name) parts.push(name);
  });
  (filters.cuisineIds as string[] | undefined)?.forEach((id) => {
    const name = CUISINE_BY_ID.get(id)?.name;
    if (name) parts.push(name);
  });
  (filters.districtIds as string[] | undefined)?.forEach((id) => {
    const name = DISTRICT_BY_ID.get(id)?.name;
    if (name) parts.push(name);
  });

  if (filters.guests) parts.push(`${filters.guests} гостей`);
  if (filters.priceMax) parts.push(`до ${filters.priceMax} ₸`);
  if (filters.hasPromotion) parts.push('Акции');
  if (filters.openToday) parts.push('Сегодня открыто');
  if (filters.availableNow) parts.push('Свободно сейчас');
  if (filters.radiusKm) parts.push(`в радиусе ${filters.radiusKm} км`);
  if ((filters.amenities as string[] | undefined)?.length) parts.push('с удобствами');

  return parts;
}

export default function SearchHistoryPage() {
  const user = getCurrentUser();
  const history = getSearchHistory(user.id);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">История поиска</h1>
        <p className="text-sm text-muted-foreground">
          Повторите любой запрос в один клик — фильтры сохранены
        </p>
      </header>

      {history.length === 0 ? (
        <EmptyState
          icon={<History />}
          title="Вы ещё ничего не искали"
          description="Здесь появятся ваши запросы с фильтрами, чтобы к ним можно было вернуться."
          action={{ label: 'Начать поиск', href: '/catalog' }}
        />
      ) : (
        <ul className="divide-y rounded-2xl border">
          {history.map((entry) => {
            const chips = describeFilters(entry.filters as Record<string, unknown>);
            const href = buildCatalogHref(entry.filters);

            return (
              <li key={entry.id}>
                <Link
                  href={href}
                  className="flex items-start gap-3 p-4 transition-colors hover:bg-secondary/50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                    <Search className="size-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {entry.query || 'Поиск по фильтрам'}
                    </p>
                    {chips.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {chips.map((chip) => (
                          <Badge key={chip} variant="secondary" size="sm">
                            {chip}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {formatVenues(entry.resultsCount)} · {formatRelativeTime(entry.createdAt)}
                    </p>
                  </div>

                  <span className="shrink-0 self-center text-sm font-medium text-primary">
                    Повторить →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
