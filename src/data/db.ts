import type {
  AppNotification,
  Booking,
  Business,
  Category,
  City,
  Cuisine,
  District,
  Favorite,
  Menu,
  Product,
  Review,
  SearchHistoryEntry,
  Service,
  User,
  Venue,
} from '@/types';

import { CATEGORIES, CUISINES } from './seed/categories';
import { CITIES, DISTRICTS } from './seed/geo';
import { VENUE_SEEDS } from './seed/venue-seeds';
import { BUSINESS_SEEDS, DEMO_BUSINESS_KEY, buildBusinesses } from './seed/businesses';
import { DEMO_ADMIN_USER, DEMO_USER } from './seed/users';
import { buildVenue } from './builders/venue';
import { buildServices } from './builders/services';
import { buildMenu } from './builders/menu';
import { buildProducts } from './builders/products';
import { buildReviews } from './builders/reviews';
import { buildBookings, buildDemoUserBookings, DEMO_TODAY } from './builders/bookings';
import { buildNotifications } from './builders/notifications';
import { buildFavorites, buildSearchHistory } from './builders/personal';

/**
 * Единое in-memory хранилище демо-данных.
 *
 * Это «база данных» MVP. Слой репозиториев (src/server/repositories) обращается
 * только сюда — поэтому при подключении PostgreSQL + Prisma достаточно
 * переписать репозитории, не трогая страницы и компоненты.
 *
 * Данные детерминированы: один и тот же сид всегда даёт один и тот же результат,
 * поэтому SSR и клиент не расходятся.
 */
export interface Database {
  cities: City[];
  districts: District[];
  categories: Category[];
  cuisines: Cuisine[];
  businesses: Business[];
  venues: Venue[];
  services: Service[];
  menus: Menu[];
  products: Product[];
  reviews: Review[];
  bookings: Booking[];
  users: User[];
  favorites: Favorite[];
  searchHistory: SearchHistoryEntry[];
  notifications: AppNotification[];
}

function createDatabase(): Database {
  // 1. Заведения + связка с бизнесами.
  const venueIdsByBusinessKey = new Map<string, string[]>();
  const venues = VENUE_SEEDS.map((seed) => {
    const businessId = `biz-${seed.businessKey}`;
    const venue = buildVenue(seed, businessId);
    const list = venueIdsByBusinessKey.get(seed.businessKey) ?? [];
    list.push(venue.id);
    venueIdsByBusinessKey.set(seed.businessKey, list);
    return venue;
  });

  const businesses = buildBusinesses(venueIdsByBusinessKey);

  // 2. Категории: пересчитываем реальное количество заведений.
  const categories = CATEGORIES.map((category) => ({
    ...category,
    venueCount: venues.filter((venue) => venue.categoryId === category.id).length,
  }));

  // 3. Контент заведений.
  const services = venues.flatMap((venue) => buildServices(venue));
  const menus = venues.map((venue) => buildMenu(venue));
  const products = venues.flatMap((venue) => buildProducts(venue));

  // 4. Отзывы: 8 на заведение → 250+ суммарно (ТЗ требует минимум 100).
  const reviews = venues.flatMap((venue) => buildReviews(venue, 8));

  // 5. Брони: общая история для аналитики + личные брони демо-пользователя.
  const bookings = [...buildBookings(venues), ...buildDemoUserBookings(venues)];

  // 6. Персональные данные демо-пользователя.
  const favorites = buildFavorites(venues, DEMO_USER.id);
  const searchHistory = buildSearchHistory(DEMO_USER.id);
  const notifications = buildNotifications(venues, bookings, DEMO_USER.id);

  const owners: User[] = businesses.map((business) => ({
    id: business.owner.userId,
    name: business.owner.name,
    email: business.owner.email,
    phone: business.owner.phone,
    avatar: business.owner.avatar,
    role: 'business' as const,
    cityId: CITIES[0].id,
    joinedAt: business.joinedAt,
    preferences: {
      favoriteCategoryIds: [],
      favoriteCuisineIds: [],
      budgetPerPerson: 15000,
      preferredDistrictIds: [],
      typicalPartySize: 4,
      dietary: [],
    },
    settings: {
      language: 'ru' as const,
      theme: 'system' as const,
      currency: 'KZT' as const,
      notifications: {
        bookingUpdates: true,
        promotions: false,
        recommendations: false,
        reviewReplies: true,
        channels: { email: true, push: true, sms: true },
      },
      allowGeolocation: false,
    },
    loyaltyPoints: 0,
    businessId: business.id,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
  }));

  return {
    cities: CITIES,
    districts: DISTRICTS,
    categories,
    cuisines: CUISINES,
    businesses,
    venues,
    services,
    menus,
    products,
    reviews,
    bookings,
    users: [DEMO_USER, DEMO_ADMIN_USER, ...owners],
    favorites,
    searchHistory,
    notifications,
  };
}

/**
 * В dev-режиме Next.js перезагружает модули между запросами — храним инстанс
 * в globalThis, чтобы созданные брони не исчезали после hot reload.
 */
const globalForDb = globalThis as unknown as { __venueDb?: Database };

export const db: Database = globalForDb.__venueDb ?? createDatabase();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__venueDb = db;
}

export const DEMO_BUSINESS_ID = `biz-${DEMO_BUSINESS_KEY}`;
export const DEMO_USER_ID = DEMO_USER.id;
export { DEMO_TODAY, BUSINESS_SEEDS };
