import type {
  Menu,
  Paginated,
  Product,
  Service,
  Venue,
  VenueListItem,
  VenueQuery,
} from '@/types';
import { db } from '@/data/db';
import { DEMO_USER_LOCATION } from '@/data/seed/users';
import { distanceKm } from '@/lib/geo';
import { matchesFilters, sortVenues } from '@/lib/venue-filters';
import { toVenueListItem } from '../mappers';

const DEFAULT_PER_PAGE = 12;

function publishedVenues() {
  return db.venues.filter((venue) => venue.status === 'published');
}

/** Проекция с посчитанным расстоянием от точки отсчёта пользователя. */
function toListItems(venues: Venue[], near = DEMO_USER_LOCATION): VenueListItem[] {
  return venues.map((venue) =>
    toVenueListItem(venue, Number(distanceKm(near, venue.location.coordinates).toFixed(2))),
  );
}

export interface VenueSearchResult extends Paginated<VenueListItem> {
  /** Все совпавшие заведения — нужны карте, которая показывает выдачу целиком. */
  allMatches: VenueListItem[];
}

export function searchVenues(query: VenueQuery = {}, now = new Date()): VenueSearchResult {
  const near = query.near ?? DEMO_USER_LOCATION;
  const items = toListItems(publishedVenues(), near);

  const matched = items.filter((venue) => matchesFilters(venue, query, now));
  const sorted = sortVenues(matched, query.sort ?? 'popularity');

  const perPage = query.perPage ?? DEFAULT_PER_PAGE;
  const page = Math.max(1, query.page ?? 1);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;

  return {
    items: sorted.slice(start, start + perPage),
    allMatches: sorted,
    total,
    page,
    perPage,
    totalPages,
    hasMore: page < totalPages,
  };
}

export function getVenueBySlug(slug: string): Venue | null {
  return db.venues.find((venue) => venue.slug === slug) ?? null;
}

export function getVenueById(id: string): Venue | null {
  return db.venues.find((venue) => venue.id === id) ?? null;
}

export function getVenueListItems(ids: string[]): VenueListItem[] {
  const byId = new Map(db.venues.map((venue) => [venue.id, venue]));
  return ids
    .map((id) => byId.get(id))
    .filter((venue): venue is Venue => Boolean(venue))
    .map((venue) =>
      toVenueListItem(
        venue,
        Number(distanceKm(DEMO_USER_LOCATION, venue.location.coordinates).toFixed(2)),
      ),
    );
}

export function getFeaturedVenues(limit = 8): VenueListItem[] {
  const featured = publishedVenues().filter((venue) => venue.isFeatured);
  return sortVenues(toListItems(featured), 'popularity').slice(0, limit);
}

export function getTrendingVenues(limit = 8): VenueListItem[] {
  return sortVenues(toListItems(publishedVenues()), 'popularity').slice(0, limit);
}

export function getTopRatedVenues(limit = 8): VenueListItem[] {
  return sortVenues(toListItems(publishedVenues()), 'rating').slice(0, limit);
}

export function getVenuesWithPromotions(limit = 8): VenueListItem[] {
  const promo = publishedVenues().filter((venue) => venue.promotion);
  return sortVenues(toListItems(promo), 'popularity').slice(0, limit);
}

export function getNewVenues(limit = 8): VenueListItem[] {
  // В демо «новизну» задаёт меньшее число отзывов при хорошем рейтинге.
  const candidates = publishedVenues()
    .filter((venue) => venue.rating.score >= 4.4)
    .sort((a, b) => a.rating.count - b.rating.count);
  return toListItems(candidates).slice(0, limit);
}

/** Похожие заведения: та же категория или кухня, близкий ценовой сегмент. */
export function getSimilarVenues(venue: Venue, limit = 6): VenueListItem[] {
  const scored = publishedVenues()
    .filter((candidate) => candidate.id !== venue.id)
    .map((candidate) => {
      let score = 0;
      if (candidate.categoryId === venue.categoryId) score += 40;
      score += candidate.cuisineIds.filter((id) => venue.cuisineIds.includes(id)).length * 18;
      if (candidate.location.districtId === venue.location.districtId) score += 14;
      if (Math.abs(candidate.priceLevel - venue.priceLevel) <= 1) score += 12;
      score += candidate.rating.score * 4;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);

  return toListItems(scored);
}

export function getVenueServices(venueId: string): Service[] {
  return db.services
    .filter((service) => service.venueId === venueId)
    .sort((a, b) => Number(b.isHighlighted) - Number(a.isHighlighted));
}

export function getVenueMenu(venueId: string): Menu | null {
  return db.menus.find((menu) => menu.venueId === venueId) ?? null;
}

export function getVenueProducts(venueId: string): Product[] {
  return db.products.filter((product) => product.venueId === venueId);
}

export function getAllVenueSlugs(): string[] {
  return publishedVenues().map((venue) => venue.slug);
}

export function getVenuesByBusiness(businessId: string): Venue[] {
  return db.venues.filter((venue) => venue.businessId === businessId);
}

/** Границы карты по текущей выдаче. */
export function getVenueCount(): number {
  return publishedVenues().length;
}
