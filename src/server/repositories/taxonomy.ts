import type { Category, City, Cuisine, District, SearchSuggestion } from '@/types';
import { db } from '@/data/db';

export function getCategories(): Category[] {
  return db.categories;
}

export function getPopularCategories(): Category[] {
  return db.categories.filter((category) => category.isPopular);
}

export function getCategoryBySlug(slug: string): Category | null {
  return db.categories.find((category) => category.slug === slug) ?? null;
}

export function getCuisines(): Cuisine[] {
  return db.cuisines;
}

export function getDistricts(): District[] {
  return db.districts;
}

export function getCities(): City[] {
  return db.cities;
}

/**
 * Подсказки для строки поиска: заведения, категории, кухни, районы.
 * Порядок — от самого конкретного к самому общему.
 */
export function getSearchSuggestions(query: string, limit = 8): SearchSuggestion[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return getDefaultSuggestions();

  const suggestions: SearchSuggestion[] = [];

  db.venues
    .filter((venue) => venue.name.toLowerCase().includes(needle))
    .slice(0, 4)
    .forEach((venue) => {
      suggestions.push({
        kind: 'venue',
        id: venue.id,
        label: venue.name,
        sublabel: `${venue.location.districtName} · ${venue.tagline}`,
        icon: 'MapPin',
        href: `/venue/${venue.slug}`,
      });
    });

  db.categories
    .filter((category) => category.name.toLowerCase().includes(needle))
    .slice(0, 3)
    .forEach((category) => {
      suggestions.push({
        kind: 'category',
        id: category.id,
        label: category.name,
        sublabel: `${category.venueCount} мест`,
        icon: category.icon,
        href: `/catalog?category=${category.slug}`,
      });
    });

  db.cuisines
    .filter((cuisine) => cuisine.name.toLowerCase().includes(needle))
    .slice(0, 3)
    .forEach((cuisine) => {
      suggestions.push({
        kind: 'cuisine',
        id: cuisine.id,
        label: `${cuisine.name} кухня`,
        icon: 'ChefHat',
        href: `/catalog?cuisine=${cuisine.slug}`,
      });
    });

  db.districts
    .filter((district) => district.name.toLowerCase().includes(needle))
    .slice(0, 2)
    .forEach((district) => {
      suggestions.push({
        kind: 'district',
        id: district.id,
        label: district.name,
        sublabel: 'Район',
        icon: 'Map',
        href: `/catalog?district=${district.slug}`,
      });
    });

  // Всегда даём возможность искать введённый текст как есть.
  suggestions.push({
    kind: 'query',
    id: 'free-query',
    label: `Искать «${query.trim()}»`,
    icon: 'Search',
    href: `/catalog?q=${encodeURIComponent(query.trim())}`,
  });

  return suggestions.slice(0, limit);
}

function getDefaultSuggestions(): SearchSuggestion[] {
  return [
    { kind: 'query', id: 'd1', label: 'Ужин на двоих', sublabel: 'Романтические места', icon: 'Heart', href: '/catalog?q=свидание' },
    { kind: 'query', id: 'd2', label: 'Банкет на 50 гостей', sublabel: 'Залы для торжеств', icon: 'PartyPopper', href: '/catalog?banquet=1&guests=50' },
    { kind: 'query', id: 'd3', label: 'Завтрак рядом', sublabel: 'Открыто сейчас', icon: 'Coffee', href: '/catalog?category=kofeyni&availableNow=1' },
    { kind: 'query', id: 'd4', label: 'Со скидкой сегодня', sublabel: 'Акции недели', icon: 'BadgePercent', href: '/catalog?promo=1' },
  ];
}
