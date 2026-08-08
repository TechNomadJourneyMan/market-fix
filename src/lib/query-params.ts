import type { PriceLevel, SortOption, VenueAmenity, VenueQuery } from '@/types';
import { CATEGORIES, CUISINES } from '@/data/seed/categories';
import { DISTRICTS } from '@/data/seed/geo';

/**
 * Двусторонняя сериализация фильтров каталога в URL.
 * URL — единственный источник правды для состояния каталога:
 * ссылку можно скопировать, поделиться и открыть с тем же результатом.
 */

const VALID_SORTS: SortOption[] = ['rating', 'price_asc', 'price_desc', 'distance', 'popularity'];

const categoryBySlug = new Map(CATEGORIES.map((item) => [item.slug, item.id]));
const categoryById = new Map(CATEGORIES.map((item) => [item.id, item.slug]));
const cuisineBySlug = new Map(CUISINES.map((item) => [item.slug, item.id]));
const cuisineById = new Map(CUISINES.map((item) => [item.id, item.slug]));
const districtBySlug = new Map(DISTRICTS.map((item) => [item.slug, item.id]));
const districtById = new Map(DISTRICTS.map((item) => [item.id, item.slug]));

export type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function readParam(params: SearchParamsInput, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function readList(params: SearchParamsInput, key: string): string[] {
  const raw = readParam(params, key);
  if (!raw) return [];
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

function readNumber(params: SearchParamsInput, key: string): number | undefined {
  const raw = readParam(params, key);
  if (raw === undefined || raw === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function readFlag(params: SearchParamsInput, key: string): boolean | undefined {
  const raw = readParam(params, key);
  return raw === '1' || raw === 'true' ? true : undefined;
}

export function parseVenueQuery(params: SearchParamsInput): VenueQuery {
  const categorySlugs = readList(params, 'category');
  const cuisineSlugs = readList(params, 'cuisine');
  const districtSlugs = readList(params, 'district');
  const amenities = readList(params, 'amenities') as VenueAmenity[];
  const priceLevels = readList(params, 'level')
    .map(Number)
    .filter((level) => level >= 1 && level <= 4) as PriceLevel[];

  const sortRaw = readParam(params, 'sort') as SortOption | undefined;

  const query: VenueQuery = {
    query: readParam(params, 'q')?.trim() || undefined,
    categoryIds: categorySlugs
      .map((slug) => categoryBySlug.get(slug))
      .filter((id): id is string => Boolean(id)),
    cuisineIds: cuisineSlugs
      .map((slug) => cuisineBySlug.get(slug))
      .filter((id): id is string => Boolean(id)),
    districtIds: districtSlugs
      .map((slug) => districtBySlug.get(slug))
      .filter((id): id is string => Boolean(id)),
    priceMin: readNumber(params, 'priceMin'),
    priceMax: readNumber(params, 'priceMax'),
    priceLevels: priceLevels.length ? priceLevels : undefined,
    ratingMin: readNumber(params, 'rating'),
    guests: readNumber(params, 'guests'),
    amenities: amenities.length ? amenities : undefined,
    banquet: readFlag(params, 'banquet'),
    petsAllowed: readFlag(params, 'pets'),
    hasPromotion: readFlag(params, 'promo'),
    openToday: readFlag(params, 'openToday'),
    availableNow: readFlag(params, 'availableNow'),
    radiusKm: readNumber(params, 'radius'),
    sort: sortRaw && VALID_SORTS.includes(sortRaw) ? sortRaw : 'popularity',
    page: readNumber(params, 'page') ?? 1,
    perPage: readNumber(params, 'perPage'),
  };

  // Пустые массивы не должны считаться активным фильтром.
  if (!query.categoryIds?.length) delete query.categoryIds;
  if (!query.cuisineIds?.length) delete query.cuisineIds;
  if (!query.districtIds?.length) delete query.districtIds;

  return query;
}

/** Обратная операция: состояние фильтров → строка запроса. */
export function serializeVenueQuery(query: VenueQuery): string {
  const params = new URLSearchParams();

  if (query.query) params.set('q', query.query);

  const categories = (query.categoryIds ?? [])
    .map((id) => categoryById.get(id))
    .filter(Boolean);
  if (categories.length) params.set('category', categories.join(','));

  const cuisines = (query.cuisineIds ?? []).map((id) => cuisineById.get(id)).filter(Boolean);
  if (cuisines.length) params.set('cuisine', cuisines.join(','));

  const districts = (query.districtIds ?? []).map((id) => districtById.get(id)).filter(Boolean);
  if (districts.length) params.set('district', districts.join(','));

  if (query.priceMin !== undefined) params.set('priceMin', String(query.priceMin));
  if (query.priceMax !== undefined) params.set('priceMax', String(query.priceMax));
  if (query.priceLevels?.length) params.set('level', query.priceLevels.join(','));
  if (query.ratingMin !== undefined) params.set('rating', String(query.ratingMin));
  if (query.guests !== undefined) params.set('guests', String(query.guests));
  if (query.amenities?.length) params.set('amenities', query.amenities.join(','));

  if (query.banquet) params.set('banquet', '1');
  if (query.petsAllowed) params.set('pets', '1');
  if (query.hasPromotion) params.set('promo', '1');
  if (query.openToday) params.set('openToday', '1');
  if (query.availableNow) params.set('availableNow', '1');
  if (query.radiusKm !== undefined) params.set('radius', String(query.radiusKm));

  if (query.sort && query.sort !== 'popularity') params.set('sort', query.sort);
  if (query.page && query.page > 1) params.set('page', String(query.page));

  return params.toString();
}

export function buildCatalogHref(query: VenueQuery) {
  const search = serializeVenueQuery(query);
  return search ? `/catalog?${search}` : '/catalog';
}

export { categoryById, categoryBySlug, cuisineById, districtById };
