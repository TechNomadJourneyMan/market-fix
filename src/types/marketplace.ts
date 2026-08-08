import type { Entity, ID } from './common';
import type { IconName } from './category';
import type { Coordinates } from './location';

/**
 * Вертикали маркетплейса помимо бронирования заведений:
 * доставка, аренда, услуги, подарки и смежные сценарии.
 */
export type MarketplaceVertical =
  | 'delivery'
  | 'rental'
  | 'services'
  | 'gifts'
  | 'catering'
  | 'transport'
  | 'events'
  | 'other';

export interface MarketplaceCategory extends Entity {
  slug: string;
  vertical: MarketplaceVertical;
  name: string;
  description: string;
  icon: IconName;
  gradient: string;
  coverImage: string;
  listingCount: number;
}

export interface MarketplaceListing extends Entity {
  slug: string;
  categoryId: ID;
  vertical: MarketplaceVertical;
  name: string;
  tagline: string;
  description: string;
  providerName: string;
  coverImage: string;
  /** Цена «от», ₸ */
  priceFrom: number;
  priceUnit: string;
  /** Короткий ярлык цены для карточек */
  priceLabel: string;
  rating: { score: number; count: number };
  location: {
    districtId: ID;
    districtName: string;
    address: string;
    coordinates: Coordinates;
  };
  tags: string[];
  features: string[];
  /** ETA доставки в минутах, если применимо */
  deliveryEtaMinutes?: number;
  isVerified: boolean;
  isPopular: boolean;
  /** CTA на карточке: Заказать / Арендовать / Выбрать */
  ctaLabel: string;
  /** Связанное заведение, если сервис от партнёра-ресторана */
  venueId?: ID;
  venueSlug?: string;
}
