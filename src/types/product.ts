import type { Entity, ID } from './common';

/** Товары заведения: сертификаты, мерч, наборы, депозиты на банкет. */
export type ProductKind = 'certificate' | 'merch' | 'set' | 'deposit';

export interface Product extends Entity {
  venueId: ID;
  name: string;
  description: string;
  kind: ProductKind;
  price: number;
  oldPrice?: number;
  image: string;
  inStock: boolean;
  stockCount: number;
  isPopular: boolean;
}
