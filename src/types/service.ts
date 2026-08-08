import type { Entity, ID } from './common';
import type { IconName } from './category';

/** Группы услуг из ТЗ: меню, товары, услуги, банкет, кейтеринг, доставка, VIP… */
export type ServiceGroup =
  | 'dining'
  | 'events'
  | 'delivery'
  | 'entertainment'
  | 'comfort'
  | 'rental'
  | 'gifts'
  | 'services';

export interface Service extends Entity {
  venueId: ID;
  slug: string;
  name: string;
  description: string;
  icon: IconName;
  group: ServiceGroup;
  /** Цена «от», ₸. null → «по запросу». */
  priceFrom: number | null;
  /** Единица: «за час», «за персону», «за мероприятие». */
  priceUnit?: string;
  isHighlighted: boolean;
  isAvailable: boolean;
}

export interface MenuItem extends Entity {
  venueId: ID;
  sectionId: ID;
  name: string;
  description: string;
  price: number;
  weight?: string;
  image?: string;
  isPopular: boolean;
  isVegetarian: boolean;
  isSpicy: boolean;
  allergens: string[];
}

export interface MenuSection extends Entity {
  venueId: ID;
  name: string;
  order: number;
}

export interface Menu {
  venueId: ID;
  sections: MenuSection[];
  items: MenuItem[];
}
