import type { SortOption, VenueFilters, VenueListItem, WeekDay } from '@/types';
import { distanceKm } from './geo';
import { getOpenStatus, isWorkingOnDay } from './hours';

/**
 * Чистая логика фильтрации и сортировки — используется и сервером (репозитории),
 * и клиентом (мгновенный пересчёт счётчиков в панели фильтров).
 */

const AMENITY_BY_QUICK_FILTER = {
  banquet: 'banquet',
  petsAllowed: 'pets',
} as const;

export function matchesFilters(
  venue: VenueListItem,
  filters: VenueFilters,
  now = new Date(),
): boolean {
  if (filters.cityId && venue.location.cityId !== filters.cityId) return false;

  if (filters.categoryIds?.length && !filters.categoryIds.includes(venue.categoryId)) {
    return false;
  }

  if (filters.districtIds?.length && !filters.districtIds.includes(venue.location.districtId)) {
    return false;
  }

  // Кухня: достаточно совпадения хотя бы по одной — так выдача не схлопывается.
  if (
    filters.cuisineIds?.length &&
    !filters.cuisineIds.some((id) => venue.cuisineIds.includes(id))
  ) {
    return false;
  }

  if (filters.priceMin !== undefined && venue.averagePrice < filters.priceMin) return false;
  if (filters.priceMax !== undefined && venue.averagePrice > filters.priceMax) return false;

  if (filters.priceLevels?.length && !filters.priceLevels.includes(venue.priceLevel)) return false;

  if (filters.ratingMin !== undefined && venue.rating.score < filters.ratingMin) return false;

  if (filters.guests !== undefined && venue.capacity < filters.guests) return false;

  if (filters.amenities?.length) {
    const hasAll = filters.amenities.every((amenity) => venue.amenities.includes(amenity));
    if (!hasAll) return false;
  }

  // ——— Быстрые фильтры ———
  if (filters.banquet && !venue.amenities.includes(AMENITY_BY_QUICK_FILTER.banquet)) return false;
  if (filters.petsAllowed && !venue.amenities.includes(AMENITY_BY_QUICK_FILTER.petsAllowed)) {
    return false;
  }
  if (filters.hasPromotion && !venue.promotion) return false;

  if (filters.openToday && !isWorkingOnDay(venue.workingHours, now.getDay() as WeekDay)) {
    return false;
  }

  // «Свободно сейчас» = заведение открыто прямо в этот момент и не закрывается через минуты.
  if (filters.availableNow) {
    const status = getOpenStatus(venue.workingHours, now);
    if (!status.isOpen || status.closingSoon) return false;
  }

  if (filters.near && filters.radiusKm !== undefined) {
    const km = distanceKm(filters.near, venue.location.coordinates);
    if (km > filters.radiusKm) return false;
  }

  if (filters.query?.trim()) {
    if (!matchesQuery(venue, filters.query)) return false;
  }

  return true;
}

/** Поиск по названию, тегам, категории, району, адресу и описанию. */
export function matchesQuery(venue: VenueListItem, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    venue.name,
    venue.tagline,
    venue.categoryName,
    venue.location.districtName,
    venue.location.address,
    ...venue.tags,
  ]
    .join(' ')
    .toLowerCase();

  // Все слова запроса должны найтись — так «итальянский центр» отсекает лишнее.
  return needle
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

export function sortVenues(
  venues: VenueListItem[],
  sort: SortOption = 'popularity',
): VenueListItem[] {
  const sorted = [...venues];

  switch (sort) {
    case 'rating':
      // При равном рейтинге выше тот, у кого больше отзывов — это честнее.
      sorted.sort(
        (a, b) => b.rating.score - a.rating.score || b.rating.count - a.rating.count,
      );
      break;
    case 'price_asc':
      sorted.sort((a, b) => a.averagePrice - b.averagePrice);
      break;
    case 'price_desc':
      sorted.sort((a, b) => b.averagePrice - a.averagePrice);
      break;
    case 'distance':
      sorted.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
      break;
    case 'popularity':
    default:
      sorted.sort((a, b) => b.popularityScore - a.popularityScore);
      break;
  }

  return sorted;
}

/** Сколько фильтров реально применено — для бейджа «Фильтры · 3». */
export function countActiveFilters(filters: VenueFilters): number {
  let count = 0;
  if (filters.categoryIds?.length) count += 1;
  if (filters.cuisineIds?.length) count += 1;
  if (filters.districtIds?.length) count += 1;
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) count += 1;
  if (filters.priceLevels?.length) count += 1;
  if (filters.ratingMin !== undefined) count += 1;
  if (filters.guests !== undefined) count += 1;
  if (filters.amenities?.length) count += filters.amenities.length;
  if (filters.banquet) count += 1;
  if (filters.petsAllowed) count += 1;
  if (filters.hasPromotion) count += 1;
  if (filters.openToday) count += 1;
  if (filters.availableNow) count += 1;
  return count;
}

export function isEmptyFilters(filters: VenueFilters) {
  return countActiveFilters(filters) === 0 && !filters.query?.trim();
}
