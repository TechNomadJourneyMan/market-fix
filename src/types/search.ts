import type { ID } from './common';
import type { Coordinates } from './location';
import type { PriceLevel, VenueAmenity } from './venue';

/** Сортировка каталога — набор строго по ТЗ. */
export type SortOption = 'rating' | 'price_asc' | 'price_desc' | 'distance' | 'popularity';

export const SORT_OPTIONS: { value: SortOption; label: string; hint: string }[] = [
  { value: 'popularity', label: 'По популярности', hint: 'Выбор большинства гостей' },
  { value: 'rating', label: 'По рейтингу', hint: 'Сначала с лучшими оценками' },
  { value: 'price_asc', label: 'По цене: сначала дешевле', hint: 'Экономный вариант' },
  { value: 'price_desc', label: 'По цене: сначала дороже', hint: 'Премиальный сегмент' },
  { value: 'distance', label: 'По расстоянию', hint: 'Ближайшие к вам' },
];

/**
 * Полный набор фильтров каталога.
 * Все поля опциональны — фильтр применяется только если задан.
 */
export interface VenueFilters {
  /** Полнотекстовый запрос: название, кухня, район, теги. */
  query?: string;
  categoryIds?: ID[];
  cuisineIds?: ID[];
  districtIds?: ID[];
  cityId?: ID;
  /** Средний чек на человека, ₸ */
  priceMin?: number;
  priceMax?: number;
  priceLevels?: PriceLevel[];
  /** Минимальный рейтинг: 4.0 / 4.5 */
  ratingMin?: number;
  /** Вместимость не меньше указанного числа гостей. */
  guests?: number;
  amenities?: VenueAmenity[];

  /** ——— Быстрые фильтры из ТЗ ——— */
  /** Банкет */
  banquet?: boolean;
  /** Можно с животными */
  petsAllowed?: boolean;
  /** Акции */
  hasPromotion?: boolean;
  /** Сегодня открыто */
  openToday?: boolean;
  /** Свободно сейчас */
  availableNow?: boolean;

  /** Радиус поиска от точки, км. */
  radiusKm?: number;
  near?: Coordinates;
}

export interface VenueQuery extends VenueFilters {
  sort?: SortOption;
  page?: number;
  perPage?: number;
}

/** Быстрый фильтр-чип в шапке каталога. */
export interface QuickFilter {
  key: keyof VenueFilters;
  label: string;
  icon: string;
}

export const QUICK_FILTERS: QuickFilter[] = [
  { key: 'availableNow', label: 'Свободно сейчас', icon: 'Zap' },
  { key: 'openToday', label: 'Сегодня открыто', icon: 'Clock' },
  { key: 'hasPromotion', label: 'Акции', icon: 'BadgePercent' },
  { key: 'banquet', label: 'Банкет', icon: 'PartyPopper' },
  { key: 'petsAllowed', label: 'Можно с животными', icon: 'PawPrint' },
];

/** История поиска в кабинете пользователя. */
export interface SearchHistoryEntry {
  id: ID;
  userId: ID;
  query: string;
  filters: VenueFilters;
  resultsCount: number;
  createdAt: string;
}

/** Подсказка в строке поиска. */
export interface SearchSuggestion {
  kind: 'venue' | 'category' | 'cuisine' | 'district' | 'query';
  id: string;
  label: string;
  sublabel?: string;
  icon: string;
  href: string;
}
