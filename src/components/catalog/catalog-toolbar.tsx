'use client';

import * as React from 'react';
import { List, Map as MapIcon, SlidersHorizontal, X } from 'lucide-react';
import type { Category, Cuisine, District, SortOption, VenueQuery } from '@/types';
import { SORT_OPTIONS } from '@/types';
import { cn } from '@/lib/utils';
import { formatVenues } from '@/lib/format';
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
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const activeCount = countActiveFilters(query);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-muted-foreground">
          Найдено <span className="font-semibold text-foreground">{formatVenues(total)}</span>
        </p>

        {/* Фильтры в шторке — одинаково работает на мобильных и на десктопе */}
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <SlidersHorizontal />
              Фильтры
              {activeCount > 0 ? (
                <Badge variant="default" size="sm">
                  {activeCount}
                </Badge>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[92vw] max-w-md">
            <SheetHeader>
              <SheetTitle>Фильтры</SheetTitle>
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
                Сбросить
              </Button>
              <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
                Показать {total}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Select
          value={query.sort ?? 'popularity'}
          onValueChange={(value) => patch({ sort: value as SortOption })}
        >
          <SelectTrigger className="h-9 w-auto min-w-[11rem] text-sm">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent align="end">
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} hint={option.hint}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex rounded-xl border p-0.5">
          <ViewButton
            isActive={view === 'list'}
            onClick={() => setView('list')}
            label="Списком"
          >
            <List className="size-4" />
          </ViewButton>
          <ViewButton isActive={view === 'map'} onClick={() => setView('map')} label="На карте">
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
      <span className="hidden sm:inline">{label}</span>
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
        label: option.label,
        onRemove: () => toggleInList('amenities', amenity),
      });
    }
  });

  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    chips.push({
      key: 'price',
      label: `Цена: ${query.priceMin ?? 0}–${query.priceMax ?? '∞'} ₸`,
      onRemove: () => patch({ priceMin: undefined, priceMax: undefined }),
    });
  }

  if (query.ratingMin !== undefined) {
    chips.push({
      key: 'rating',
      label: `Рейтинг от ${query.ratingMin}`,
      onRemove: () => patch({ ratingMin: undefined }),
    });
  }

  if (query.guests !== undefined) {
    chips.push({
      key: 'guests',
      label: `${query.guests} гостей`,
      onRemove: () => patch({ guests: undefined }),
    });
  }

  const flags: [keyof typeof query, string][] = [
    ['banquet', 'Банкет'],
    ['petsAllowed', 'Можно с животными'],
    ['hasPromotion', 'Акции'],
    ['openToday', 'Сегодня открыто'],
    ['availableNow', 'Свободно сейчас'],
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
      label: `«${query.query}»`,
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
          className="group inline-flex items-center gap-1.5 rounded-full border bg-secondary/60 px-3 py-1 text-xs font-medium transition-colors hover:bg-secondary"
        >
          {chip.label}
          <X className="size-3 text-muted-foreground transition-colors group-hover:text-foreground" />
        </button>
      ))}
      {chips.length > 1 ? (
        <button
          type="button"
          onClick={reset}
          className="ml-1 text-xs font-medium text-primary hover:underline"
        >
          Сбросить всё
        </button>
      ) : null}
    </div>
  );
}
