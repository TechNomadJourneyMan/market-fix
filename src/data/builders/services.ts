import type { Service, ServiceGroup, Venue, VenueAmenity } from '@/types';
import { createRandom, hashString } from '@/lib/utils';

const NOW = '2026-01-10T09:00:00.000Z';

interface ServiceTemplate {
  slug: string;
  name: string;
  description: string;
  icon: string;
  group: ServiceGroup;
  /** Множитель от среднего чека заведения. null → «по запросу». */
  priceFactor: number | null;
  priceUnit?: string;
  highlighted?: boolean;
}

/** Услуги, привязанные к удобствам заведения. */
const AMENITY_SERVICES: Partial<Record<VenueAmenity, ServiceTemplate>> = {
  banquet: {
    slug: 'banquet',
    name: 'Банкет',
    description: 'Отдельный зал, согласованное меню и ведущий. Организуем под ключ.',
    icon: 'PartyPopper',
    group: 'events',
    priceFactor: 1.6,
    priceUnit: 'с гостя',
    highlighted: true,
  },
  catering: {
    slug: 'catering',
    name: 'Кейтеринг',
    description: 'Привезём кухню на вашу площадку: посуда, персонал и подача включены.',
    icon: 'ChefHat',
    group: 'events',
    priceFactor: 1.9,
    priceUnit: 'с гостя',
    highlighted: true,
  },
  delivery: {
    slug: 'delivery',
    name: 'Доставка',
    description: 'Курьер по городу за 45–60 минут. Бесплатно от 8 000 ₸.',
    icon: 'Bike',
    group: 'delivery',
    priceFactor: 0.15,
    priceUnit: 'доставка',
  },
  vip: {
    slug: 'vip',
    name: 'VIP-зона',
    description: 'Приватный зал с отдельным входом и персональным официантом.',
    icon: 'Crown',
    group: 'comfort',
    priceFactor: 3.5,
    priceUnit: 'за зал',
    highlighted: true,
  },
  music: {
    slug: 'music',
    name: 'Живая музыка',
    description: 'Музыканты и диджей-сеты по вечерам. Афиша обновляется еженедельно.',
    icon: 'Music',
    group: 'entertainment',
    priceFactor: null,
  },
  kids: {
    slug: 'kids',
    name: 'Детская зона',
    description: 'Игровая комната, детское меню и стульчики для малышей.',
    icon: 'Baby',
    group: 'comfort',
    priceFactor: null,
  },
  parking: {
    slug: 'parking',
    name: 'Парковка',
    description: 'Бесплатные места для гостей на охраняемой территории.',
    icon: 'CircleParking',
    group: 'comfort',
    priceFactor: null,
  },
  wifi: {
    slug: 'wifi',
    name: 'Wi-Fi',
    description: 'Бесплатный высокоскоростной интернет во всём зале.',
    icon: 'Wifi',
    group: 'comfort',
    priceFactor: null,
  },
  terrace: {
    slug: 'terrace',
    name: 'Летняя терраса',
    description: 'Открытая веранда с подогревом — работает круглый год.',
    icon: 'Sun',
    group: 'comfort',
    priceFactor: null,
  },
  hookah: {
    slug: 'hookah',
    name: 'Кальян',
    description: 'Авторские миксы от кальянного мастера, более 40 вкусов.',
    icon: 'Flame',
    group: 'entertainment',
    priceFactor: 0.55,
    priceUnit: 'за кальян',
    highlighted: true,
  },
  pets: {
    slug: 'pets',
    name: 'Можно с животными',
    description: 'Миска с водой и лакомство для питомца — бесплатно.',
    icon: 'PawPrint',
    group: 'comfort',
    priceFactor: null,
  },
  sports_broadcast: {
    slug: 'sports',
    name: 'Спортивные трансляции',
    description: 'Матчи на больших экранах со звуком. Бронь столов в день игры.',
    icon: 'Tv',
    group: 'entertainment',
    priceFactor: null,
  },
  accessible: {
    slug: 'accessible',
    name: 'Доступная среда',
    description: 'Пандус, широкие проходы и адаптированная уборная.',
    icon: 'Accessibility',
    group: 'comfort',
    priceFactor: null,
  },
  halal: {
    slug: 'halal',
    name: 'Халяль',
    description: 'Сертифицированное халяль-меню и отдельная линия приготовления.',
    icon: 'BadgeCheck',
    group: 'dining',
    priceFactor: null,
  },
  card_payment: {
    slug: 'card-payment',
    name: 'Оплата картой',
    description: 'Принимаем карты, Apple Pay и QR. Счёт можно разделить.',
    icon: 'CreditCard',
    group: 'comfort',
    priceFactor: null,
  },
};

/** Базовые услуги, которые есть у любого заведения общепита. */
const BASE_SERVICES: ServiceTemplate[] = [
  {
    slug: 'menu',
    name: 'Меню',
    description: 'Основное меню зала — подаём с момента открытия и до закрытия кухни.',
    icon: 'BookOpen',
    group: 'dining',
    priceFactor: null,
    highlighted: true,
  },
  {
    slug: 'reservation',
    name: 'Бронирование стола',
    description: 'Бесплатное подтверждение за 15 минут. Держим стол 20 минут после времени брони.',
    icon: 'CalendarCheck',
    group: 'dining',
    priceFactor: null,
    highlighted: true,
  },
];

const CATEGORY_SERVICES: Record<string, ServiceTemplate[]> = {
  'cat-banquet': [
    {
      slug: 'wedding',
      name: 'Свадьба под ключ',
      description: 'Декор, ведущий, торт и координатор дня. Дегустация меню — бесплатно.',
      icon: 'HeartHandshake',
      group: 'events',
      priceFactor: 2.4,
      priceUnit: 'с гостя',
      highlighted: true,
    },
    {
      slug: 'decor',
      name: 'Оформление зала',
      description: 'Флористика, текстиль и световое оформление под вашу палитру.',
      icon: 'Sparkles',
      group: 'events',
      priceFactor: 12,
      priceUnit: 'за зал',
    },
  ],
  'cat-karaoke': [
    {
      slug: 'private-room',
      name: 'Приватная кабинка',
      description: 'Отдельная комната на 4–20 человек со студийным звуком.',
      icon: 'DoorClosed',
      group: 'entertainment',
      priceFactor: 1.2,
      priceUnit: 'за час',
      highlighted: true,
    },
  ],
  'cat-club': [
    {
      slug: 'table-stage',
      name: 'Стол у сцены',
      description: 'Лучший обзор танцпола, депозит включает бар-меню.',
      icon: 'Armchair',
      group: 'entertainment',
      priceFactor: 4,
      priceUnit: 'депозит',
      highlighted: true,
    },
  ],
  'cat-loft': [
    {
      slug: 'venue-rent',
      name: 'Аренда площадки',
      description: 'Свет, звук и проектор включены. Можно со своим кейтерингом.',
      icon: 'Building2',
      group: 'events',
      priceFactor: 9,
      priceUnit: 'за час',
      highlighted: true,
    },
    {
      slug: 'photo-shoot',
      name: 'Фотосъёмка',
      description: 'Локация для съёмок в утренние часы, есть гримёрная.',
      icon: 'Camera',
      group: 'events',
      priceFactor: 6,
      priceUnit: 'за час',
    },
  ],
  'cat-bakery': [
    {
      slug: 'custom-cake',
      name: 'Торт на заказ',
      description: 'Собираем за 48 часов, макет согласуем в мессенджере.',
      icon: 'CakeSlice',
      group: 'dining',
      priceFactor: 4.5,
      priceUnit: 'за кг',
      highlighted: true,
    },
    {
      slug: 'masterclass',
      name: 'Мастер-класс',
      description: 'Роспись пряников и сборка капкейков для детей и взрослых.',
      icon: 'Palette',
      group: 'events',
      priceFactor: 2.2,
      priceUnit: 'с участника',
    },
  ],
  'cat-coffee': [
    {
      slug: 'beans',
      name: 'Зёрна с собой',
      description: 'Свежая обжарка каждые три дня, помол под ваш способ заваривания.',
      icon: 'Package',
      group: 'dining',
      priceFactor: 2.5,
      priceUnit: 'за 250 г',
    },
  ],
};

export function buildServices(venue: Venue): Service[] {
  const random = createRandom(hashString(`${venue.slug}-services`));
  const templates: ServiceTemplate[] = [
    ...BASE_SERVICES,
    ...(CATEGORY_SERVICES[venue.categoryId] ?? []),
    ...venue.amenities
      .map((amenity) => AMENITY_SERVICES[amenity])
      .filter((template): template is ServiceTemplate => Boolean(template)),
  ];

  const seen = new Set<string>();
  return templates
    .filter((template) => {
      if (seen.has(template.slug)) return false;
      seen.add(template.slug);
      return true;
    })
    .map((template) => ({
      id: `${venue.slug}-service-${template.slug}`,
      venueId: venue.id,
      slug: template.slug,
      name: template.name,
      description: template.description,
      icon: template.icon,
      group: template.group,
      priceFrom:
        template.priceFactor === null
          ? null
          : roundPrice(venue.averagePrice * template.priceFactor),
      priceUnit: template.priceUnit,
      isHighlighted: Boolean(template.highlighted),
      isAvailable: template.priceFactor === null ? true : random() > 0.08,
      createdAt: NOW,
      updatedAt: NOW,
    }));
}

function roundPrice(value: number) {
  if (value >= 100000) return Math.round(value / 5000) * 5000;
  if (value >= 10000) return Math.round(value / 500) * 500;
  return Math.round(value / 100) * 100;
}
