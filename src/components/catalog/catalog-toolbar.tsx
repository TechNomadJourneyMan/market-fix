'use client';

import * as React from 'react';
import { List, Map as MapIcon, SlidersHorizontal, X } from 'lucide-react';
import type { Category, Cuisine, District, SortOption, VenueQuery } from '@/types';
import { SORT_OPTIONS } from '@/types';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/client';
import { countActiveFilters } from '@/lib/venue-filters';
import { useCatalogParams } from '@/hooks/use-catalog-params';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FiltersPanel, AMENITY_OPTIONS } from './filters-panel';

interface CatalogToolbarProps {
  query: VenueQuery;
  view: 'list' | 'map';
  total: number;
  categories: Category[];
  cuisines: Cuisine[];
  districts: District[];
}

export function CatalogToolbar({
  query,
  view,
  total,
  categories,
  cuisines,
  districts,
}: CatalogToolbarProps) {
  const { patch, setView, reset } = useCatalogParams(query, view);
  const t = useT('catalog');
  const tCommon = useT('common');
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const activeCount = countActiveFilters(query);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto min-w-0 text-sm text-muted-foreground">
          {t('found')}{' '}
          <span className="font-semibold text-foreground">
            {tCommon('counts.venues', { count: total })}
          </span>
        </p>

        {/* Фильтры в шторке — одинаково работает на мобильных и на десктопе */}
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <SlidersHorizontal />
              {t('filters.title')}
              {activeCount > 0 ? (
                <Badge variant="default" size="sm">
                  {activeCount}
                </Badge>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[92vw] max-w-md">
            <SheetHeader>
              <SheetTitle>{t('filters.title')}</SheetTitle>
            </SheetHeader>
            <SheetBody>
              <FiltersPanel
                query={query}
                categories={categories}
                cuisines={cuisines}
                districts={districts}
                activeCount={activeCount}
              />
            </SheetBody>
            <SheetFooter>
              <Button variant="outline" className="flex-1" onClick={reset}>
                {t('filters.reset')}
              </Button>
              <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
                {t('showCount', { count: total })}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Select
          value={query.sort ?? 'popularity'}
          onValueChange={(value) => patch({ sort: value as SortOption })}
        >
          <SelectTrigger className="h-9 w-auto min-w-[11rem] max-w-full text-sm">
            <SelectValue placeholder={t('sort.label')} />
          </SelectTrigger>
          <SelectContent align="end">
            {SORT_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                hint={t(`sort.${option.value}Hint`)}
              >
                {t(`sort.${option.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex rounded-xl border p-0.5">
          <ViewButton
            isActive={view === 'list'}
            onClick={() => setView('list')}
            label={t('view.list')}
          >
            <List className="size-4" />
          </ViewButton>
          <ViewButton
            isActive={view === 'map'}
            onClick={() => setView('map')}
            label={t('view.map')}
          >
            <MapIcon className="size-4" />
          </ViewButton>
        </div>
      </div>

      <ActiveFilterChips
        query={query}
        view={view}
        categories={categories}
        cuisines={cuisines}
        districts={districts}
      />
    </div>
  );
}

function ViewButton({
  isActive,
  onClick,
  label,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      className={cn(
        'flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors',
        isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
      <span className="hidden whitespace-nowrap sm:inline">{label}</span>
    </button>
  );
}

/** Чипы применённых фильтров — видно, что именно сузило выдачу, и можно снять по одному. */
function ActiveFilterChips({
  query,
  view,
  categories,
  cuisines,
  districts,
}: {
  query: VenueQuery;
  view: 'list' | 'map';
  categories: Category[];
  cuisines: Cuisine[];
  districts: District[];
}) {
  const { patch, toggleInList, reset } = useCatalogParams(query, view);
  const t = useT('catalog');

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  query.categoryIds?.forEach((id) => {
    const category = categories.find((item) => item.id === id);
    if (category) {
      chips.push({
        key: `cat-${id}`,
        label: category.name,
        onRemove: () => toggleInList('categoryIds', id),
      });
    }
  });

  query.cuisineIds?.forEach((id) => {
    const cuisine = cuisines.find((item) => item.id === id);
    if (cuisine) {
      chips.push({
        key: `cui-${id}`,
        label: cuisine.name,
        onRemove: () => toggleInList('cuisineIds', id),
      });
    }
  });

  query.districtIds?.forEach((id) => {
    const district = districts.find((item) => item.id === id);
    if (district) {
      chips.push({
        key: `dis-${id}`,
        label: district.name,
        onRemove: () => toggleInList('districtIds', id),
      });
    }
  });

  query.amenities?.forEach((amenity) => {
    const option = AMENITY_OPTIONS.find((item) => item.value === amenity);
    if (option) {
      chips.push({
        key: `am-${amenity}`,
        label: t(`amenities.${option.value}`),
        onRemove: () => toggleInList('amenities', amenity),
      });
    }
  });

  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    chips.push({
      key: 'price',
      label: t('chips.price', {
        min: query.priceMin ?? 0,
        max: query.priceMax ?? '∞',
      }),
      onRemove: () => patch({ priceMin: undefined, priceMax: undefined }),
    });
  }

  if (query.ratingMin !== undefined) {
    chips.push({
      key: 'rating',
      label: t('chips.rating', { value: query.ratingMin }),
      onRemove: () => patch({ ratingMin: undefined }),
    });
  }

  if (query.guests !== undefined) {
    chips.push({
      key: 'guests',
      label: t('chips.guests', { count: query.guests }),
      onRemove: () => patch({ guests: undefined }),
    });
  }

  const flags: [keyof typeof query, string][] = [
    ['banquet', t('quickFilters.banquet')],
    ['petsAllowed', t('quickFilters.petsAllowed')],
    ['hasPromotion', t('quickFilters.hasPromotion')],
    ['openToday', t('quickFilters.openToday')],
    ['availableNow', t('quickFilters.availableNow')],
  ];

  flags.forEach(([key, label]) => {
    if (query[key]) {
      chips.push({
        key: String(key),
        label,
        onRemove: () => patch({ [key]: undefined }),
      });
    }
  });

  if (query.query) {
    chips.push({
      key: 'q',
      label: t('chips.query', { query: query.query }),
      onRemove: () => patch({ query: undefined }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="group inline-flex max-w-full items-center gap-1.5 rounded-full border bg-secondary/60 px-3 py-1 text-xs font-medium transition-colors hover:bg-secondary"
        >
          <span className="min-w-0 truncate">{chip.label}</span>
          <X className="size-3 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
        </button>
      ))}
      {chips.length > 1 ? (
        <button
          type="button"
          onClick={reset}
          className="ml-1 text-xs font-medium text-primary hover:underline"
        >
          {t('filters.resetAll')}
        </button>
      ) : null}
    </div>
  );
}
