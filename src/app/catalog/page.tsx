import type { Metadata } from 'next';
import { SearchX, Sparkles } from 'lucide-react';

import { parseVenueQuery } from '@/lib/query-params';
import { countActiveFilters } from '@/lib/venue-filters';
import { searchVenues } from '@/server/repositories/venues';
import {
  getCategories,
  getCuisines,
  getDistricts,
} from '@/server/repositories/taxonomy';
import { DEMO_USER_LOCATION } from '@/data/seed/users';

import { SearchBar } from '@/components/search/search-bar';
import { QuickFilters } from '@/components/catalog/quick-filters';
import { CatalogToolbar } from '@/components/catalog/catalog-toolbar';
import { FiltersPanel } from '@/components/catalog/filters-panel';
import { Pagination } from '@/components/catalog/pagination';
import { MapView } from '@/components/catalog/map-view';
import { VenueCard } from '@/components/venue/venue-card';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = {
  title: 'Каталог заведений Алматы',
  description:
    'Рестораны, кафе, бары, банкетные залы и лофты Алматы. Фильтры по кухне, цене, району и удобствам, сортировка по рейтингу и расстоянию.',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Заголовок подстраивается под фильтры — страница всегда объясняет, что показывает. */
function buildTitle(params: Record<string, string | string[] | undefined>, categoryName?: string) {
  const q = typeof params.q === 'string' ? params.q : undefined;
  if (q) return `Результаты по запросу «${q}»`;
  if (categoryName) return categoryName;
  if (params.promo) return 'Заведения с акциями';
  if (params.availableNow) return 'Свободно прямо сейчас';
  if (params.banquet) return 'Банкетные площадки';
  return 'Каталог заведений';
}

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = parseVenueQuery(params);

  const categories = getCategories();
  const cuisines = getCuisines();
  const districts = getDistricts();

  const result = searchVenues({ ...query, perPage: query.perPage ?? 12 });
  const view = params.view === 'map' ? 'map' : 'list';
  const activeCount = countActiveFilters(query);

  const selectedCategory =
    query.categoryIds?.length === 1
      ? categories.find((category) => category.id === query.categoryIds![0])
      : undefined;

  const title = buildTitle(params, selectedCategory?.name);

  return (
    <div className="container py-6 sm:py-8">
      {/* ——— Шапка каталога ——— */}
      <header className="space-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {selectedCategory?.description ??
              'Живые отзывы, честные цены и бронирование без звонков — выбирайте спокойно.'}
          </p>
        </div>

        <SearchBar
          variant="compact"
          defaultValue={query.query ?? ''}
          placeholder="Название, кухня, район или повод"
          className="max-w-2xl"
        />

        <QuickFilters query={query} />
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[268px_minmax(0,1fr)]">
        {/* ——— Боковые фильтры (десктоп) ——— */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <FiltersPanel
              query={query}
              categories={categories}
              cuisines={cuisines}
              districts={districts}
              activeCount={activeCount}
            />
          </div>
        </aside>

        {/* ——— Результаты ——— */}
        <div className="min-w-0 space-y-5">
          <CatalogToolbar
            query={query}
            view={view}
            total={result.total}
            categories={categories}
            cuisines={cuisines}
            districts={districts}
          />

          {result.total === 0 ? (
            <EmptyState
              icon={<SearchX />}
              title="По этим условиям ничего не нашлось"
              description="Попробуйте убрать часть фильтров или расширить бюджет — в городе точно есть подходящее место. Или доверьте выбор AI-подбору."
              action={{ label: 'Сбросить фильтры', href: '/catalog' }}
              secondaryAction={{ label: 'Подобрать с AI', href: '/ai' }}
            />
          ) : view === 'map' ? (
            <MapView
              venues={result.allMatches.slice(0, 60)}
              origin={query.near ?? DEMO_USER_LOCATION}
            />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((venue, index) => (
                  <VenueCard key={venue.id} venue={venue} priority={index < 3} />
                ))}
              </div>

              <Pagination
                query={query}
                page={result.page}
                totalPages={result.totalPages}
              />

              {/* Подсказка после последней страницы — не оставляем тупик */}
              {!result.hasMore ? (
                <div className="rounded-2xl border border-dashed bg-muted/30 px-5 py-6 text-center">
                  <p className="flex items-center justify-center gap-2 text-sm font-medium">
                    <Sparkles className="size-4 text-primary" />
                    Не то, что искали?
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    Опишите вечер словами — AI-подбор учтёт бюджет, компанию и повод и
                    предложит пять точных вариантов с объяснением.
                  </p>
                  <a
                    href="/ai"
                    className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    Попробовать AI-подбор →
                  </a>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
