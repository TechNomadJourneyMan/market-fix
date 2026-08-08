import type {
  Business,
  BusinessAnalytics,
  BusinessDashboardMetrics,
  PriceLevel,
  TimeSeriesPoint,
  Venue,
  VenueAmenity,
} from '@/types';
import { db, DEMO_BUSINESS_ID } from '@/data/db';
import { DEMO_TODAY } from '@/data/builders/bookings';
import { createRandom, hashString, slugify } from '@/lib/utils';
import { toDateKey } from '@/lib/format';
import { DISTRICT_BY_ID, DEFAULT_CITY_ID, CITIES } from '@/data/seed/geo';
import { buildWorkingHours, type HoursProfile } from '@/data/seed/hours';
import { pickVenuePhotoUrl } from '@/data/seed/venue-photos';
import { getBusinessBookings } from './bookings';

export interface CreateVenueInput {
  name: string;
  tagline: string;
  description: string;
  categoryId: string;
  cuisineIds: string[];
  districtId: string;
  address: string;
  phone: string;
  email: string;
  averagePrice: number;
  capacity: number;
  amenities?: VenueAmenity[];
  tags?: string[];
}

/** Текущий бизнес демо-кабинета. Заменится на выбор из сессии владельца. */
export function getCurrentBusiness(): Business {
  return db.businesses.find((business) => business.id === DEMO_BUSINESS_ID) ?? db.businesses[0];
}

export function getBusinessById(id: string): Business | null {
  return db.businesses.find((business) => business.id === id) ?? null;
}

export function getBusinessVenues(businessId: string): Venue[] {
  return db.venues.filter((venue) => venue.businessId === businessId);
}

export function getBusinessVenueBySlug(businessId: string, slug: string): Venue | null {
  return (
    db.venues.find((venue) => venue.businessId === businessId && venue.slug === slug) ?? null
  );
}

export function updateVenue(venueId: string, patch: Partial<Venue>): Venue | null {
  const venue = db.venues.find((item) => item.id === venueId);
  if (!venue) return null;
  Object.assign(venue, patch, { updatedAt: new Date().toISOString() });
  return venue;
}

function priceLevelFromAverage(averagePrice: number): PriceLevel {
  if (averagePrice < 5000) return 1;
  if (averagePrice < 12000) return 2;
  if (averagePrice < 20000) return 3;
  return 4;
}

function hoursProfileForCategory(categoryId: string): HoursProfile {
  if (categoryId === 'cat-bar' || categoryId === 'cat-lounge') return 'bar';
  if (categoryId === 'cat-cafe' || categoryId === 'cat-coffee' || categoryId === 'cat-bakery') {
    return 'daytime';
  }
  if (categoryId === 'cat-banquet') return 'banquet';
  if (categoryId === 'cat-karaoke') return 'karaoke';
  if (categoryId === 'cat-club') return 'club';
  if (categoryId === 'cat-loft') return 'loft';
  return 'restaurant';
}

/** Добавить новое заведение в кабинет бизнеса (in-memory MVP). */
export function createVenue(businessId: string, input: CreateVenueInput): Venue {
  const baseSlug = slugify(input.name) || `venue-${Date.now()}`;
  let slug = baseSlug;
  let n = 2;
  while (db.venues.some((venue) => venue.slug === slug)) {
    slug = `${baseSlug}-${n}`;
    n += 1;
  }

  const district = DISTRICT_BY_ID.get(input.districtId);
  const center = district?.center ?? CITIES[0].center;
  const jitter = createRandom(hashString(slug));
  const nowIso = new Date().toISOString();
  const tags: Array<'interior' | 'food' | 'exterior' | 'event'> = [
    'interior',
    'food',
    'exterior',
    'event',
  ];
  const photos = tags.map((tag, index) => ({
    id: `${slug}-photo-${index + 1}`,
    url: pickVenuePhotoUrl(slug, tag, index, input.categoryId),
    alt: `${input.name} — ${tag}`,
    tag,
    width: 1200,
    height: 800,
  }));

  const venue: Venue = {
    id: `venue-${slug}`,
    slug,
    name: input.name.trim(),
    tagline: input.tagline.trim(),
    description: input.description.trim(),
    businessId,
    categoryId: input.categoryId,
    cuisineIds: input.cuisineIds,
    location: {
      coordinates: {
        lat: center.lat + (jitter() - 0.5) * 0.02,
        lng: center.lng + (jitter() - 0.5) * 0.02,
      },
      address: input.address.trim(),
      cityId: DEFAULT_CITY_ID,
      cityName: CITIES[0].name,
      districtId: input.districtId,
      districtName: district?.name ?? 'Алматы',
    },
    photos,
    coverImage: photos[0].url,
    rating: {
      score: 5,
      count: 0,
      breakdown: { food: 5, service: 5, atmosphere: 5, price: 5 },
      distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
    },
    priceLevel: priceLevelFromAverage(input.averagePrice),
    averagePrice: input.averagePrice,
    capacity: input.capacity,
    tables: [
      { id: `${slug}-table-1`, name: 'Стол 1', seats: 2, zone: 'main' },
      { id: `${slug}-table-2`, name: 'Стол 2', seats: 4, zone: 'main' },
      { id: `${slug}-table-3`, name: 'VIP 1', seats: 8, zone: 'vip' },
    ],
    amenities: input.amenities?.length
      ? input.amenities
      : ['wifi', 'card_payment', 'parking'],
    workingHours: buildWorkingHours(hoursProfileForCategory(input.categoryId)),
    phone: input.phone.trim(),
    email: input.email.trim(),
    isVerified: false,
    isFeatured: false,
    status: 'published',
    popularityScore: 40,
    stats: {
      views30d: 0,
      bookings30d: 0,
      favorites: 0,
      conversionRate: 0,
      averageCheck: input.averagePrice * 2,
      revenue30d: 0,
    },
    tags: input.tags?.length ? input.tags : ['новое', 'на платформе'],
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  db.venues.unshift(venue);

  const business = db.businesses.find((item) => item.id === businessId);
  if (business && !business.venueIds.includes(venue.id)) {
    business.venueIds = [venue.id, ...business.venueIds];
    business.updatedAt = nowIso;
  }

  const category = db.categories.find((item) => item.id === input.categoryId);
  if (category) {
    category.venueCount = db.venues.filter(
      (item) => item.categoryId === category.id && item.status === 'published',
    ).length;
  }

  return venue;
}

export function getDashboardMetrics(businessId: string): BusinessDashboardMetrics {
  const venues = getBusinessVenues(businessId);
  const bookings = getBusinessBookings(businessId);
  const random = createRandom(hashString(`${businessId}-metrics`));

  const views = venues.reduce((sum, venue) => sum + venue.stats.views30d, 0);
  const revenue = venues.reduce((sum, venue) => sum + venue.stats.revenue30d, 0);
  const bookingsCount = venues.reduce((sum, venue) => sum + venue.stats.bookings30d, 0);
  const reviewsCount = venues.reduce((sum, venue) => sum + venue.rating.count, 0);
  const ratingSum = venues.reduce(
    (sum, venue) => sum + venue.rating.score * venue.rating.count,
    0,
  );

  const confirmed = bookings.filter(
    (booking) => booking.status === 'confirmed' || booking.status === 'completed',
  ).length;

  return {
    views,
    viewsDelta: Number(((random() - 0.28) * 34).toFixed(1)),
    bookings: bookingsCount,
    bookingsDelta: Number(((random() - 0.25) * 30).toFixed(1)),
    revenue,
    revenueDelta: Number(((random() - 0.22) * 26).toFixed(1)),
    conversionRate: views > 0 ? bookingsCount / views : 0,
    conversionDelta: Number(((random() - 0.4) * 12).toFixed(1)),
    averageCheck:
      bookingsCount > 0 ? Math.round(revenue / bookingsCount) : 0,
    rating: reviewsCount > 0 ? Number((ratingSum / reviewsCount).toFixed(2)) : 0,
    reviewsCount,
    newReviews: Math.round(reviewsCount * 0.04),
    occupancyRate: bookings.length > 0 ? confirmed / bookings.length : 0,
  };
}

function buildSeries(seed: string, days: number, base: number, volatility: number) {
  const random = createRandom(hashString(seed));
  const points: TimeSeriesPoint[] = [];
  let value = base;

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(DEMO_TODAY);
    date.setDate(date.getDate() - index);
    const weekday = date.getDay();
    // Пятница и суббота дают выраженный всплеск — так график читается как настоящий.
    const weekendBoost = weekday === 5 || weekday === 6 ? 1.45 : weekday === 0 ? 1.1 : 1;
    const drift = 1 + (random() - 0.46) * volatility;
    value = Math.max(base * 0.35, value * drift);
    points.push({ date: toDateKey(date), value: Math.round(value * weekendBoost) });
  }

  return points;
}

export function getBusinessAnalytics(businessId: string, days = 30): BusinessAnalytics {
  const venues = getBusinessVenues(businessId);
  const metrics = getDashboardMetrics(businessId);

  const dailyViews = Math.max(40, Math.round(metrics.views / 30));
  const dailyBookings = Math.max(2, Math.round(metrics.bookings / 30));
  const dailyRevenue = Math.max(20000, Math.round(metrics.revenue / 30));

  return {
    views: buildSeries(`${businessId}-views`, days, dailyViews, 0.22),
    bookings: buildSeries(`${businessId}-bookings`, days, dailyBookings, 0.3),
    revenue: buildSeries(`${businessId}-revenue`, days, dailyRevenue, 0.26),
    sources: [
      { label: 'Поиск на платформе', value: 42 },
      { label: 'Каталог и фильтры', value: 24 },
      { label: 'AI-подбор', value: 16 },
      { label: 'Избранное и повторные визиты', value: 11 },
      { label: 'Внешние ссылки', value: 7 },
    ],
    hourlyLoad: buildHourlyLoad(businessId),
    topVenues: venues
      .map((venue) => ({
        venueId: venue.id,
        name: venue.name,
        bookings: venue.stats.bookings30d,
        revenue: venue.stats.revenue30d,
      }))
      .sort((a, b) => b.revenue - a.revenue),
  };
}

function buildHourlyLoad(businessId: string) {
  const random = createRandom(hashString(`${businessId}-hours`));
  return Array.from({ length: 24 }, (_, hour) => {
    // Двугорбая кривая: обеденный и вечерний пики.
    const lunch = Math.exp(-((hour - 13) ** 2) / 6) * 55;
    const dinner = Math.exp(-((hour - 20) ** 2) / 8) * 100;
    const night = hour >= 22 || hour <= 2 ? 28 : 0;
    return {
      hour,
      value: Math.round(lunch + dinner + night + random() * 12),
    };
  });
}

/** Ближайшие брони для дашборда — «что сегодня». */
export function getUpcomingBusinessBookings(businessId: string, limit = 8) {
  const todayKey = toDateKey(DEMO_TODAY);
  return getBusinessBookings(businessId)
    .filter((booking) => booking.date >= todayKey && booking.status !== 'cancelled')
    .sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : a.time > b.time ? 1 : -1))
    .slice(0, limit);
}

export function getBusinessServices(businessId: string) {
  const venueIds = new Set(getBusinessVenues(businessId).map((venue) => venue.id));
  return db.services.filter((service) => venueIds.has(service.venueId));
}

export function getBusinessProducts(businessId: string) {
  const venueIds = new Set(getBusinessVenues(businessId).map((venue) => venue.id));
  return db.products.filter((product) => venueIds.has(product.venueId));
}

export function getBusinessMenus(businessId: string) {
  const venueIds = new Set(getBusinessVenues(businessId).map((venue) => venue.id));
  return db.menus.filter((menu) => venueIds.has(menu.venueId));
}
