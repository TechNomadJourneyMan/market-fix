import type { Product, ProductKind, Venue } from '@/types';
import { createRandom, hashString } from '@/lib/utils';

const NOW = '2026-01-10T09:00:00.000Z';

interface ProductTemplate {
  name: string;
  description: string;
  kind: ProductKind;
  factor: number;
  discounted?: boolean;
}

const COMMON_PRODUCTS: ProductTemplate[] = [
  {
    name: 'Подарочный сертификат 10 000 ₸',
    description: 'Электронный сертификат — придёт на почту сразу после оплаты. Действует год.',
    kind: 'certificate',
    factor: 0,
  },
  {
    name: 'Подарочный сертификат 25 000 ₸',
    description: 'Отличный подарок без выбора блюда. Можно потратить частями.',
    kind: 'certificate',
    factor: 0,
  },
];

const BY_CATEGORY: Record<string, ProductTemplate[]> = {
  'cat-restaurant': [
    { name: 'Сет для дома на двоих', description: 'Закуска, два основных и десерт — забирайте с собой', kind: 'set', factor: 1.7, discounted: true },
    { name: 'Депозит на банкет', description: 'Бронь банкетного зала на дату. Засчитывается в счёт', kind: 'deposit', factor: 5 },
  ],
  'cat-cafe': [
    { name: 'Абонемент на 10 завтраков', description: 'Выгоднее на 20%, действует три месяца', kind: 'set', factor: 9, discounted: true },
  ],
  'cat-coffee': [
    { name: 'Зёрна «Эфиопия Иргачеффе», 250 г', description: 'Свежая обжарка, помол под ваш метод', kind: 'merch', factor: 2.4 },
    { name: 'Керамическая кружка', description: 'Ручная работа, 300 мл, с логотипом кофейни', kind: 'merch', factor: 2.1 },
    { name: 'Абонемент на 20 кофе', description: 'Любой напиток из меню, экономия 25%', kind: 'set', factor: 15, discounted: true },
  ],
  'cat-bar': [
    { name: 'Набор бокалов, 2 шт.', description: 'Фирменные бокалы с гравировкой', kind: 'merch', factor: 1.6 },
    { name: 'Депозит на стол', description: 'Гарантированный стол в пятницу и субботу', kind: 'deposit', factor: 3 },
  ],
  'cat-bakery': [
    { name: 'Торт на заказ, 2 кг', description: 'Ваш дизайн, сборка за 48 часов', kind: 'set', factor: 9 },
    { name: 'Набор эклеров, 6 шт.', description: 'Шесть вкусов в подарочной коробке', kind: 'set', factor: 2.6, discounted: true },
    { name: 'Пряничный набор для росписи', description: 'Пряники, глазурь и кисти — праздник дома', kind: 'merch', factor: 1.9 },
  ],
  'cat-banquet': [
    { name: 'Бронь даты (депозит)', description: 'Фиксирует дату и цену меню на полгода', kind: 'deposit', factor: 8 },
  ],
  'cat-karaoke': [
    { name: 'Депозит на кабинку', description: 'Приватная комната на вечер пятницы', kind: 'deposit', factor: 3.5 },
  ],
  'cat-club': [
    { name: 'Депозит на VIP-ложу', description: 'Ложа с отдельным входом и хостес', kind: 'deposit', factor: 6 },
  ],
  'cat-lounge': [
    { name: 'Кальянный набор с собой', description: 'Табак и уголь для домашней сессии', kind: 'merch', factor: 1.4 },
  ],
  'cat-loft': [
    { name: 'Депозит на аренду площадки', description: 'Фиксирует дату мероприятия', kind: 'deposit', factor: 7 },
  ],
};

const FIXED_PRICES: Record<string, number> = {
  'Подарочный сертификат 10 000 ₸': 10000,
  'Подарочный сертификат 25 000 ₸': 25000,
};

function roundPrice(value: number) {
  if (value >= 20000) return Math.round(value / 1000) * 1000;
  return Math.round(value / 100) * 100;
}

export function buildProducts(venue: Venue): Product[] {
  const random = createRandom(hashString(`${venue.slug}-products`));
  const templates = [...(BY_CATEGORY[venue.categoryId] ?? []), ...COMMON_PRODUCTS];

  return templates.map((template, index) => {
    const price = FIXED_PRICES[template.name] ?? roundPrice(venue.averagePrice * template.factor);
    const inStock = random() > 0.12;
    return {
      id: `${venue.slug}-product-${index}`,
      venueId: venue.id,
      name: template.name,
      description: template.description,
      kind: template.kind,
      price,
      oldPrice: template.discounted ? roundPrice(price * 1.25) : undefined,
      image: `/api/photo/${venue.slug}-product-${index}/600/600`,
      inStock,
      stockCount: inStock ? 3 + Math.floor(random() * 40) : 0,
      isPopular: index === 0 || random() > 0.75,
      createdAt: NOW,
      updatedAt: NOW,
    };
  });
}
