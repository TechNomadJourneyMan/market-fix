import type { Favorite, SearchHistoryEntry, Venue } from '@/types';
import { DEMO_NOW } from '../now';

/** Избранное демо-пользователя — подобрано под его предпочтения в профиле. */
const FAVORITE_SLUGS: { slug: string; note?: string; daysAgo: number }[] = [
  { slug: 'terra-alta', note: 'Сюда на годовщину', daysAgo: 4 },
  { slug: 'almaty-speak', note: 'Проверить коктейльный сет', daysAgo: 9 },
  { slug: 'basilico', daysAgo: 15 },
  { slug: 'sweet-ridge', note: 'Заказать торт на ДР мамы', daysAgo: 21 },
  { slug: 'bean-theory', daysAgo: 33 },
  { slug: 'loft-kok-tobe', note: 'Вариант для корпоратива', daysAgo: 47 },
  { slug: 'sakura-hills', daysAgo: 62 },
];

const BASE_DATE = DEMO_NOW;

function daysAgoIso(days: number) {
  const date = new Date(BASE_DATE);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export function buildFavorites(venues: Venue[], userId: string): Favorite[] {
  const bySlug = new Map(venues.map((venue) => [venue.slug, venue]));
  return FAVORITE_SLUGS.flatMap((entry, index) => {
    const venue = bySlug.get(entry.slug);
    if (!venue) return [];
    return [
      {
        id: `fav-${index}`,
        userId,
        venueId: venue.id,
        note: entry.note,
        createdAt: daysAgoIso(entry.daysAgo),
      },
    ];
  });
}

export function buildSearchHistory(userId: string): SearchHistoryEntry[] {
  const entries: Omit<SearchHistoryEntry, 'id' | 'userId'>[] = [
    {
      query: 'итальянский ресторан для компании',
      filters: { query: 'итальянский', cuisineIds: ['cui-italian'], guests: 8, priceMax: 12000 },
      resultsCount: 4,
      createdAt: daysAgoIso(1),
    },
    {
      query: 'где позавтракать в центре',
      filters: { query: 'завтрак', districtIds: ['district-gold', 'district-almaly'], openToday: true },
      resultsCount: 7,
      createdAt: daysAgoIso(3),
    },
    {
      query: '',
      filters: { categoryIds: ['cat-banquet'], guests: 120, hasPromotion: true },
      resultsCount: 3,
      createdAt: daysAgoIso(8),
    },
    {
      query: 'кофейня с розетками',
      filters: { query: 'коворкинг', categoryIds: ['cat-coffee'], amenities: ['wifi'] },
      resultsCount: 3,
      createdAt: daysAgoIso(12),
    },
    {
      query: 'кальянная рядом',
      filters: { categoryIds: ['cat-lounge'], radiusKm: 3, availableNow: true },
      resultsCount: 2,
      createdAt: daysAgoIso(19),
    },
    {
      query: 'торт на заказ',
      filters: { query: 'торт', categoryIds: ['cat-bakery'] },
      resultsCount: 2,
      createdAt: daysAgoIso(26),
    },
  ];

  return entries.map((entry, index) => ({
    id: `search-${index}`,
    userId,
    ...entry,
  }));
}
