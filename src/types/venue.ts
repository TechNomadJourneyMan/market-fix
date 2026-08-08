import type { Entity, ID, TimeString, WeekDay } from './common';
import type { Location } from './location';

/** Уровень цены: 1..4 → ₸ … ₸₸₸₸ */
export type PriceLevel = 1 | 2 | 3 | 4;

export interface VenuePhoto {
  id: ID;
  url: string;
  alt: string;
  /** Тег позволяет строить вкладки галереи: зал, кухня, терраса… */
  tag?: 'interior' | 'food' | 'exterior' | 'event' | 'other';
  width: number;
  height: number;
}

export interface WorkingHoursEntry {
  day: WeekDay;
  /** Выходной — opensAt/closesAt игнорируются. */
  isClosed: boolean;
  opensAt: TimeString;
  closesAt: TimeString;
  /** Заведение работает после полуночи (закрытие «завтра»). */
  isOvernight: boolean;
}

export type WorkingHours = WorkingHoursEntry[];

/**
 * Удобства заведения. Ключи совпадают с фильтрами каталога —
 * это позволяет фильтровать без маппинга.
 */
export type VenueAmenity =
  | 'banquet'
  | 'pets'
  | 'parking'
  | 'wifi'
  | 'kids'
  | 'vip'
  | 'music'
  | 'terrace'
  | 'delivery'
  | 'catering'
  | 'card_payment'
  | 'accessible'
  | 'hookah'
  | 'sports_broadcast'
  | 'halal';

export interface VenueRating {
  /** Средняя оценка 0..5 */
  score: number;
  count: number;
  /** Разбивка по критериям — для детальной страницы. */
  breakdown: {
    food: number;
    service: number;
    atmosphere: number;
    price: number;
  };
  /** Гистограмма 5→1 */
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export interface VenueTable {
  id: ID;
  name: string;
  seats: number;
  zone: 'main' | 'terrace' | 'vip' | 'bar';
}

export interface VenueStats {
  views30d: number;
  bookings30d: number;
  favorites: number;
  /** Конверсия просмотр → бронь, 0..1 */
  conversionRate: number;
  /** Средний чек, ₸ */
  averageCheck: number;
  revenue30d: number;
}

export interface Venue extends Entity {
  slug: string;
  name: string;
  /** Короткий «продающий» подзаголовок для карточки. */
  tagline: string;
  description: string;
  businessId: ID;
  categoryId: ID;
  cuisineIds: ID[];
  location: Location;
  photos: VenuePhoto[];
  coverImage: string;
  rating: VenueRating;
  priceLevel: PriceLevel;
  /** Средний чек на человека, ₸ — основа фильтра по цене. */
  averagePrice: number;
  capacity: number;
  tables: VenueTable[];
  amenities: VenueAmenity[];
  workingHours: WorkingHours;
  phone: string;
  email: string;
  website?: string;
  instagram?: string;
  /** Есть активная акция → бейдж «Акция» и фильтр. */
  promotion?: VenuePromotion;
  /** Заведение подтверждено платформой. */
  isVerified: boolean;
  isFeatured: boolean;
  /** Публикация: черновик не показывается в каталоге. */
  status: 'published' | 'draft' | 'archived';
  /** Признак популярности — вес в сортировке «по популярности». */
  popularityScore: number;
  stats: VenueStats;
  tags: string[];
}

export interface VenuePromotion {
  id: ID;
  title: string;
  description: string;
  discountPercent: number;
  validUntil: string;
}

/**
 * Облегчённая проекция для списков и карты.
 * Держим отдельно, чтобы в будущем API отдавал меньше данных.
 */
export interface VenueListItem {
  id: ID;
  slug: string;
  name: string;
  tagline: string;
  categoryId: ID;
  categoryName: string;
  cuisineIds: ID[];
  coverImage: string;
  photos: string[];
  rating: VenueRating;
  priceLevel: PriceLevel;
  averagePrice: number;
  location: Location;
  amenities: VenueAmenity[];
  workingHours: WorkingHours;
  promotion?: VenuePromotion;
  isVerified: boolean;
  isFeatured: boolean;
  popularityScore: number;
  capacity: number;
  tags: string[];
  /** Заполняется на лету, когда известна точка отсчёта пользователя. */
  distanceKm?: number;
}

/** Текущий статус работы — вычисляется в lib/venue/hours.ts */
export interface OpenStatus {
  isOpen: boolean;
  /** «Открыто до 23:00» / «Откроется в 10:00» */
  label: string;
  closesAt?: TimeString;
  opensAt?: TimeString;
  /** Закроется менее чем через час. */
  closingSoon: boolean;
}
