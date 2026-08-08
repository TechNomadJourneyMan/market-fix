import type { Coordinates, PriceLevel, VenueAmenity } from '@/types';
import { createRandom, hashString } from '@/lib/utils';
import { DISTRICTS } from './geo';
import type { HoursProfile } from './hours';
import {
  ALMATY_CATALOG,
  FEATURED_SLUGS,
  type CatalogCategory,
  type CatalogVenue,
  type PriceSegment,
} from './almaty-catalog';

/**
 * Исходные данные заведений. Всё остальное (фото, столы, статистика,
 * распределение оценок) достраивается детерминированно в builders/venue.ts.
 */
export interface VenueSeed {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  categoryId: string;
  cuisineIds: string[];
  districtId: string;
  businessKey: string;
  coordinates: Coordinates;
  address: string;
  landmark?: string;
  averagePrice: number;
  priceLevel: PriceLevel;
  capacity: number;
  ratingScore: number;
  ratingCount: number;
  amenities: VenueAmenity[];
  tags: string[];
  hoursProfile: HoursProfile;
  isFeatured?: boolean;
  promotion?: { title: string; description: string; discountPercent: number };
  photoTags?: ('interior' | 'food' | 'exterior' | 'event')[];
  phone?: string;
  website?: string;
  instagram?: string;
  externalId?: string;
}

const CATEGORY_MAP: Record<CatalogCategory, string> = {
  Ресторан: 'cat-restaurant',
  Кафе: 'cat-cafe',
  Бар: 'cat-bar',
  Паб: 'cat-bar',
  Развлечения: 'cat-karaoke',
};

const PRICE_LEVEL_MAP: Record<PriceSegment, PriceLevel> = {
  budget_mid: 1,
  mid: 2,
  upper_mid: 3,
  premium: 4,
  unknown: 2,
};

const AVG_CHECK_BY_SEGMENT: Record<PriceSegment, number> = {
  budget_mid: 3500,
  mid: 8000,
  upper_mid: 15000,
  premium: 20000,
  unknown: 8000,
};

const CUISINE_KEYWORDS: [RegExp, string][] = [
  [/итальян/i, 'cui-italian'],
  [/япон/i, 'cui-japanese'],
  [/грузин/i, 'cui-georgian'],
  [/казах/i, 'cui-kazakh'],
  [/узбек/i, 'cui-uzbek'],
  [/инд/i, 'cui-indian'],
  [/турец/i, 'cui-turkish'],
  [/американ/i, 'cui-american'],
  [/автор/i, 'cui-author'],
  [/франц/i, 'cui-french'],
  [/корей/i, 'cui-korean'],
  [/европ/i, 'cui-european'],
  [/морепродукт|seafood|рыб/i, 'cui-european'],
  [/центральноаз/i, 'cui-uzbek'],
  [/панази|азиат/i, 'cui-asian'],
  [/ближневост/i, 'cui-eastern'],
  [/русск/i, 'cui-european'],
  [/мясн|steak|стейк|бургер/i, 'cui-american'],
  [/коктейл|bar food|барн/i, 'cui-european'],
  [/local cuisine/i, 'cui-author'],
];

function mapCuisineIds(cuisine: string): string[] {
  const ids = new Set<string>();
  CUISINE_KEYWORDS.forEach(([pattern, id]) => {
    if (pattern.test(cuisine)) ids.add(id);
  });
  if (ids.size === 0) ids.add('cui-european');
  return [...ids];
}

function hoursForCategory(category: CatalogCategory, subcategory: string): HoursProfile {
  if (category === 'Развлечения') return 'karaoke';
  if (category === 'Кафе') {
    return /brunch|завтрак/i.test(subcategory) ? 'daytime' : 'daytime';
  }
  if (category === 'Бар' || category === 'Паб') {
    return /cocktail|nightlife/i.test(subcategory) ? 'bar' : 'bar';
  }
  return 'restaurant';
}

function amenitiesFor(entry: CatalogVenue): VenueAmenity[] {
  const base: VenueAmenity[] = ['card_payment', 'wifi'];
  const scenarios = entry.scenarios.toLowerCase();

  if (entry.category === 'Ресторан') {
    base.push('banquet');
    if (/семья|дет/i.test(scenarios)) base.push('kids');
    if (/турист/i.test(scenarios)) base.push('halal');
  }
  if (entry.category === 'Кафе') {
    base.push('delivery', 'terrace');
    if (/ноутбук/i.test(scenarios)) base.push('wifi');
  }
  if (entry.category === 'Бар' || entry.category === 'Паб') {
    base.push('music');
    if (/спорт/i.test(scenarios)) base.push('sports_broadcast');
    if (/террас/i.test(scenarios)) base.push('terrace');
  }
  if (entry.category === 'Развлечения') {
    base.push('music', 'vip', 'banquet', 'parking');
  }
  if (/делов/i.test(scenarios)) base.push('vip');
  if (/банкет|свадьб|мероприят/i.test(scenarios)) base.push('banquet', 'catering');
  if (/доставк/i.test(scenarios)) base.push('delivery');
  if (/live music/i.test(scenarios)) base.push('music');
  if (entry.priceSegment === 'premium') base.push('vip');
  if (entry.cuisine.includes('Казах')) base.push('halal');

  return [...new Set(base)];
}

function photoTagsFor(categoryId: string): VenueSeed['photoTags'] {
  if (categoryId === 'cat-bar') return ['interior', 'food', 'interior', 'event'];
  if (categoryId === 'cat-karaoke') return ['interior', 'event', 'interior', 'food'];
  if (categoryId === 'cat-cafe') return ['food', 'interior', 'food', 'interior'];
  return ['food', 'interior', 'food', 'exterior'];
}

function buildTagline(entry: CatalogVenue): string {
  const parts = [entry.subcategory, entry.cuisine.split(',')[0]?.trim()].filter(Boolean);
  return parts.join(' · ');
}

function buildDescription(entry: CatalogVenue): string {
  return `${entry.name} — ${entry.subcategory.toLowerCase()} в Алматы. ${entry.cuisine}. Подходит для: ${entry.scenarios.toLowerCase()}. Каталог MVP, данные требуют полевой проверки перед production-запуском.`;
}

function coordsFor(entry: CatalogVenue): Coordinates {
  if (entry.lat != null && entry.lng != null) {
    return { lat: entry.lat, lng: entry.lng };
  }
  const district = DISTRICTS.find((d) => d.id === entry.districtId) ?? DISTRICTS[0];
  const random = createRandom(hashString(entry.id));
  const jitter = () => (random() - 0.5) * 0.012;
  return {
    lat: Number((district.center.lat + jitter()).toFixed(6)),
    lng: Number((district.center.lng + jitter()).toFixed(6)),
  };
}

function ratingFor(entry: CatalogVenue): { score: number; count: number } {
  if (entry.rating != null && entry.reviewCount != null) {
    return { score: entry.rating, count: entry.reviewCount };
  }
  const random = createRandom(hashString(`${entry.slug}-rating`));
  const base = entry.priceSegment === 'premium' ? 4.5 : entry.priceSegment === 'upper_mid' ? 4.4 : 4.2;
  const score = Number((base + (random() - 0.5) * 0.4).toFixed(1));
  const count = Math.round(180 + random() * 520);
  return { score: Math.min(5, Math.max(3.8, score)), count };
}

function capacityFor(entry: CatalogVenue): number {
  if (entry.capacity != null) return entry.capacity;
  const random = createRandom(hashString(`${entry.slug}-cap`));
  if (entry.category === 'Развлечения') return Math.round(120 + random() * 80);
  if (entry.category === 'Кафе') return Math.round(40 + random() * 50);
  if (entry.category === 'Бар' || entry.category === 'Паб') return Math.round(80 + random() * 70);
  return Math.round(60 + random() * 90);
}

function addressFor(entry: CatalogVenue): string {
  if (entry.address) return entry.address;
  const district = DISTRICTS.find((d) => d.id === entry.districtId);
  return `${district?.name ?? 'Алматы'}, ${entry.name}`;
}

function tagsFrom(entry: CatalogVenue): string[] {
  return entry.scenarios
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
}

function mapCatalogEntry(entry: CatalogVenue): VenueSeed {
  const categoryId = CATEGORY_MAP[entry.category];
  const priceLevel = PRICE_LEVEL_MAP[entry.priceSegment];
  const averagePrice = entry.averageCheck ?? AVG_CHECK_BY_SEGMENT[entry.priceSegment];
  const rating = ratingFor(entry);
  const districtId = entry.districtId ?? 'district-almaly';

  return {
    slug: entry.slug,
    name: entry.name,
    tagline: buildTagline(entry),
    description: buildDescription(entry),
    categoryId,
    cuisineIds: mapCuisineIds(entry.cuisine),
    districtId,
    businessKey: entry.businessKey,
    coordinates: coordsFor(entry),
    address: addressFor(entry),
    averagePrice,
    priceLevel,
    capacity: capacityFor(entry),
    ratingScore: rating.score,
    ratingCount: rating.count,
    amenities: amenitiesFor(entry),
    tags: tagsFrom(entry),
    hoursProfile: hoursForCategory(entry.category, entry.subcategory),
    isFeatured: FEATURED_SLUGS.has(entry.slug),
    photoTags: photoTagsFor(categoryId),
    phone: entry.phone,
    website: entry.website,
    instagram: entry.instagram,
    externalId: entry.externalId ?? entry.id,
  };
}

export function buildVenueSeeds(): VenueSeed[] {
  return ALMATY_CATALOG.map(mapCatalogEntry);
}

export const VENUE_SEEDS: VenueSeed[] = buildVenueSeeds();
