'use client';

import * as React from 'react';
import { RotateCcw } from 'lucide-react';
import type {
  Category,
  Cuisine,
  District,
  PriceLevel,
  VenueAmenity,
  VenueQuery,
} from '@/types';
import { cn } from '@/lib/utils';
import { formatPrice, formatGuests } from '@/lib/format';
import { useCatalogParams } from '@/hooks/use-catalog-params';
import { Button } from '@/components/ui/button';
import { Checkbox, Separator, Slider } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/icon';
import { Label } from '@/components/ui/label';

export const AMENITY_OPTIONS: { value: VenueAmenity; label: string; icon: string }[] = [
  { value: 'parking', label: 'Парковка', icon: 'CircleParking' },
  { value: 'wifi', label: 'Wi-Fi', icon: 'Wifi' },
  { value: 'terrace', label: 'Летняя терраса', icon: 'Sun' },
  { value: 'kids', label: 'Детская зона', icon: 'Baby' },
  { value: 'vip', label: 'VIP-зал', icon: 'Crown' },
  { value: 'music', label: 'Живая музыка', icon: 'Music' },
  { value: 'delivery', label: 'Доставка', icon: 'Bike' },
  { value: 'catering', label: 'Кейтеринг', icon: 'ChefHat' },
  { value: 'hookah', label: 'Кальян', icon: 'Flame' },
  { value: 'halal', label: 'Халяль', icon: 'BadgeCheck' },
  { value: 'accessible', label: 'Доступная среда', icon: 'Accessibility' },
  { value: 'sports_broadcast', label: 'Трансляции матчей', icon: 'Tv' },
];

const PRICE_LEVELS: { value: PriceLevel; label: string; hint: string }[] = [
  { value: 1, label: '₸', hint: 'до 5 000' },
  { value: 2, label: '₸₸', hint: '5–12 тыс' },
  { value: 3, label: '₸₸₸', hint: '12–18 тыс' },
  { value: 4, label: '₸₸₸₸', hint: 'от 18 тыс' },
];

const RATING_OPTIONS = [4.8, 4.5, 4.0];
const GUEST_OPTIONS = [2, 4, 6, 10, 20, 50, 100];

const PRICE_MIN = 0;
const PRICE_MAX = 25000;

interface FiltersPanelProps {
  query: VenueQuery;
  categories: Category[];
  cuisines: Cuisine[];
  districts: District[];
  activeCount: number;
  className?: string;
  onApplied?: () => void;
}

export function FiltersPanel({
  query,
  categories,
  cuisines,
  districts,
  activeCount,
  className,
  onApplied,
}: FiltersPanelProps) {
  const { patch, toggleInList, reset } = useCatalogParams(query);

  // Слайдер цены обновляем локально, а в URL пишем по отпусканию — иначе будет дёргаться.
  const [priceRange, setPriceRange] = React.useState<[number, number]>([
    query.priceMin ?? PRICE_MIN,
    query.priceMax ?? PRICE_MAX,
  ]);

  React.useEffect(() => {
    setPriceRange([query.priceMin ?? PRICE_MIN, query.priceMax ?? PRICE_MAX]);
  }, [query.priceMin, query.priceMax]);

  const commitPrice = (value: number[]) => {
    const [min, max] = value as [number, number];
    patch({
      priceMin: min > PRICE_MIN ? min : undefined,
      priceMax: max < PRICE_MAX ? max : undefined,
    });
    onApplied?.();
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          Фильтры
          {activeCount > 0 ? (
            <span className="ml-1.5 text-muted-foreground">· {activeCount}</span>
          ) : null}
        </p>
        {activeCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
              onApplied?.();
            }}
          >
            <RotateCcw /> Сбросить
          </Button>
        ) : null}
      </div>

      {/* ——— Категории ——— */}
      <FilterGroup title="Категория">
        <div className="space-y-1">
          {categories.map((category) => {
            const isChecked = query.categoryIds?.includes(category.id) ?? false;
            return (
              <label
                key={category.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-secondary/60"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleInList('categoryIds', category.id)}
                />
                <Icon name={category.icon} className="size-4 text-muted-foreground" />
                <span className="flex-1 text-sm">{category.name}</span>
                <span className="text-xs text-muted-foreground">{category.venueCount}</span>
              </label>
            );
          })}
        </div>
      </FilterGroup>

      <Separator />

      {/* ——— Кухня ——— */}
      <FilterGroup title="Кухня">
        <div className="flex flex-wrap gap-1.5">
          {cuisines.map((cuisine) => {
            const isActive = query.cuisineIds?.includes(cuisine.id) ?? false;
            return (
              <button
                key={cuisine.id}
                type="button"
                onClick={() => toggleInList('cuisineIds', cuisine.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'hover:border-foreground/20 hover:bg-secondary',
                )}
              >
                <Icon name={cuisine.icon} className="size-3.5 shrink-0 opacity-80" aria-hidden />
                {cuisine.name}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <Separator />

      {/* ——— Цена ——— */}
      <FilterGroup title="Средний чек на человека">
        <div className="space-y-4 px-1">
          <Slider
            value={priceRange}
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={500}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            onValueCommit={commitPrice}
            aria-label="Диапазон цены"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="rounded-lg bg-secondary px-2 py-1 font-medium">
              {formatPrice(priceRange[0])}
            </span>
            <span className="text-muted-foreground">—</span>
            <span className="rounded-lg bg-secondary px-2 py-1 font-medium">
              {priceRange[1] >= PRICE_MAX ? 'без лимита' : formatPrice(priceRange[1])}
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {PRICE_LEVELS.map((level) => {
            const isActive = query.priceLevels?.includes(level.value) ?? false;
            return (
              <button
                key={level.value}
                type="button"
                onClick={() => {
                  const current = query.priceLevels ?? [];
                  const next = isActive
                    ? current.filter((item) => item !== level.value)
                    : [...current, level.value];
                  patch({ priceLevels: next.length ? next : undefined });
                }}
                className={cn(
                  'rounded-xl border px-1 py-2 text-center transition-all',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'hover:border-foreground/20 hover:bg-secondary',
                )}
              >
                <span className="block text-sm font-semibold">{level.label}</span>
                <span className="block text-[10px] text-muted-foreground">{level.hint}</span>
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <Separator />

      {/* ——— Рейтинг ——— */}
      <FilterGroup title="Рейтинг">
        <div className="flex flex-wrap gap-1.5">
          {RATING_OPTIONS.map((rating) => {
            const isActive = query.ratingMin === rating;
            return (
              <button
                key={rating}
                type="button"
                onClick={() => patch({ ratingMin: isActive ? undefined : rating })}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'hover:border-foreground/20 hover:bg-secondary',
                )}
              >
                от {rating.toFixed(1).replace('.', ',')} ★
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <Separator />

      {/* ——— Количество гостей ——— */}
      <FilterGroup title="Размер компании">
        <div className="flex flex-wrap gap-1.5">
          {GUEST_OPTIONS.map((guests) => {
            const isActive = query.guests === guests;
            return (
              <button
                key={guests}
                type="button"
                onClick={() => patch({ guests: isActive ? undefined : guests })}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'hover:border-foreground/20 hover:bg-secondary',
                )}
              >
                {guests >= 20 ? `${guests}+` : formatGuests(guests)}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <Separator />

      {/* ——— Район ——— */}
      <FilterGroup title="Район">
        <div className="space-y-1">
          {districts.map((district) => {
            const isChecked = query.districtIds?.includes(district.id) ?? false;
            return (
              <label
                key={district.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-secondary/60"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleInList('districtIds', district.id)}
                />
                <span className="flex-1 text-sm">{district.name}</span>
                {district.isCentral ? (
                  <span className="text-[10px] font-medium text-primary">центр</span>
                ) : null}
              </label>
            );
          })}
        </div>
      </FilterGroup>

      <Separator />

      {/* ——— Удобства ——— */}
      <FilterGroup title="Удобства">
        <div className="space-y-1">
          {AMENITY_OPTIONS.map((amenity) => {
            const isChecked = query.amenities?.includes(amenity.value) ?? false;
            return (
              <label
                key={amenity.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-secondary/60"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleInList('amenities', amenity.value)}
                />
                <Icon name={amenity.icon} className="size-4 text-muted-foreground" />
                <span className="text-sm">{amenity.label}</span>
              </label>
            );
          })}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </Label>
      {children}
    </div>
  );
}
