import type { MarketplaceCategory, MarketplaceListing, MarketplaceVertical } from '@/types';
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CATEGORY_BY_SLUG,
  MARKETPLACE_LISTINGS,
} from '@/data/seed/marketplace-services';
import { DEMO_USER_LOCATION } from '@/data/seed/users';
import { distanceKm } from '@/lib/geo';

function withCounts(): MarketplaceCategory[] {
  return MARKETPLACE_CATEGORIES.map((category) => ({
    ...category,
    listingCount: MARKETPLACE_LISTINGS.filter((item) => item.categoryId === category.id)
      .length,
  }));
}

export function getMarketplaceCategories(): MarketplaceCategory[] {
  return withCounts();
}

export function getMarketplaceCategoryBySlug(slug: string) {
  return MARKETPLACE_CATEGORY_BY_SLUG.get(slug);
}

export function getMarketplaceListings(filters?: {
  vertical?: MarketplaceVertical;
  categorySlug?: string;
  q?: string;
  near?: { lat: number; lng: number };
}): (MarketplaceListing & { distanceKm: number })[] {
  const near = filters?.near ?? DEMO_USER_LOCATION;
  let items = MARKETPLACE_LISTINGS;

  if (filters?.vertical) {
    items = items.filter((item) => item.vertical === filters.vertical);
  }

  if (filters?.categorySlug) {
    const category = MARKETPLACE_CATEGORY_BY_SLUG.get(filters.categorySlug);
    if (category) {
      items = items.filter((item) => item.categoryId === category.id);
    }
  }

  if (filters?.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.tagline.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        item.providerName.toLowerCase().includes(q),
    );
  }

  return items
    .map((item) => ({
      ...item,
      distanceKm: Number(
        distanceKm(near, item.location.coordinates).toFixed(2),
      ),
    }))
    .sort((a, b) => {
      if (a.isPopular !== b.isPopular) return a.isPopular ? -1 : 1;
      return b.rating.score - a.rating.score;
    });
}

export function getMarketplaceListingBySlug(slug: string) {
  return MARKETPLACE_LISTINGS.find((item) => item.slug === slug) ?? null;
}

export function getPopularMarketplaceListings(limit = 8) {
  return getMarketplaceListings().filter((item) => item.isPopular).slice(0, limit);
}

export function getAllMarketplaceSlugs() {
  return MARKETPLACE_LISTINGS.map((item) => item.slug);
}
