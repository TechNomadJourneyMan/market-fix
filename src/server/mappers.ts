import type { Venue, VenueListItem } from '@/types';
import { CATEGORY_BY_ID, CUISINE_BY_ID } from '@/data/seed/categories';

/**
 * Полная сущность → облегчённая проекция для списков и карты.
 * Когда появится реальная БД, тот же контракт будет отдавать SQL-выборка.
 */
export function toVenueListItem(venue: Venue, distanceKm?: number): VenueListItem {
  return {
    id: venue.id,
    slug: venue.slug,
    name: venue.name,
    tagline: venue.tagline,
    categoryId: venue.categoryId,
    categoryName: CATEGORY_BY_ID.get(venue.categoryId)?.name ?? '',
    cuisineIds: venue.cuisineIds,
    coverImage: venue.coverImage,
    photos: venue.photos.slice(0, 5).map((photo) => photo.url),
    rating: venue.rating,
    priceLevel: venue.priceLevel,
    averagePrice: venue.averagePrice,
    location: venue.location,
    amenities: venue.amenities,
    workingHours: venue.workingHours,
    promotion: venue.promotion,
    isVerified: venue.isVerified,
    isFeatured: venue.isFeatured,
    popularityScore: venue.popularityScore,
    capacity: venue.capacity,
    tags: venue.tags,
    distanceKm,
  };
}

/** Названия кухонь заведения — для карточек и чипов. */
export function getCuisineNames(cuisineIds: string[]) {
  return cuisineIds
    .map((id) => CUISINE_BY_ID.get(id)?.name)
    .filter((name): name is string => Boolean(name));
}
