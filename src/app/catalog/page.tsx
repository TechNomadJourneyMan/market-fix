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
import { getTranslator } from '@/i18n/server';
import type { Translator } from '@/i18n/translate';

import { SearchBar } from '@/components/search/search-bar';
import { QuickFilters } from '@/components/catalog/quick-filters';
import { CatalogToolbar } from '@/components/catalog/catalog-toolbar';
import { FiltersPanel } from '@/components/catalog/filters-panel';
import { Pagination } from '@/components/catalog/pagination';
import { MapView } from '@/components/catalog/map-view';
import { VenueCard } from '@/components/venue/venue-card';
import { EmptyState } from '@/components/ui/empty-state';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator('catalog');
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Заголовок подстраивается под фильтры — страница всегда объясняет, что показывает. */
function buildTitle(
  params: Record<string, string | string[] | undefined>,
  t: Translator,
  categoryName?: string,
) {
  const q = typeof params.q === 'string' ? params.q : undefined;
  if (q) return t('title.query', { query: q });
  if (categoryName) return categoryName;
  if (params.promo) return t('title.promo');
  if (params.availableNow) return t('title.availableNow');
  if (params.banquet) return t('title.banquet');
  return t('title.default');
}

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = parseVenueQuery(params);
  const t = await getTranslator('catalog');

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

  const title = buildTitle(params, t, selectedCategory?.name);

  return (
    <div className="container py-6 sm:py-8">
      {/* ——— Шапка каталога ——— */}
      <header className="space-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {selectedCategory?.description ?? t('subtitle')}
          </p>
        </div>

        <SearchBar
          variant="compact"
          defaultValue={query.query ?? ''}
          placeholder={t('searchPlaceholder')}
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
              title={t('empty.title')}
              description={t('empty.description')}
              action={{ label: t('empty.action'), href: '/catalog' }}
              secondaryAction={{ label: t('empty.secondaryAction'), href: '/ai' }}
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
                    <Sparkles className="size-4 shrink-0 text-primary" />
                    {t('aiHint.title')}
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    {t('aiHint.description')}
                  </p>
                  <a
                    href="/ai"
                    className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    {t('aiHint.action')}
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
