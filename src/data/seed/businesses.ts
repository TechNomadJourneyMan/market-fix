import type { Business, BusinessPlan } from '@/types';

const NOW = '2026-01-10T09:00:00.000Z';

interface BusinessSeed {
  key: string;
  name: string;
  legalName: string;
  description: string;
  plan: BusinessPlan;
  commissionPercent: number;
  isVerified: boolean;
  joinedAt: string;
  owner: { name: string; email: string; phone: string; position: string };
}

export const BUSINESS_SEEDS: BusinessSeed[] = [
  {
    key: 'night-city',
    name: 'Night City Group',
    legalName: 'ТОО «Найт Сити Групп»',
    description:
      'Сеть баров, караоке и клубов Алматы. Шесть площадок, более 40 000 гостей в год.',
    plan: 'premium',
    commissionPercent: 8,
    isVerified: true,
    joinedAt: '2023-03-14T10:00:00.000Z',
    owner: {
      name: 'Алишер Ким',
      email: 'alisher@nightcity.kz',
      phone: '+7 701 447 12 09',
      position: 'Управляющий партнёр',
    },
  },
  {
    key: 'alta-group',
    name: 'Alta Restaurant Group',
    legalName: 'ТОО «Альта Ресторан Групп»',
    description: 'Рестораны высокой кухни и стейк-хаусы премиального сегмента.',
    plan: 'premium',
    commissionPercent: 10,
    isVerified: true,
    joinedAt: '2022-11-02T10:00:00.000Z',
    owner: {
      name: 'Азамат Тлеуов',
      email: 'a.tleuov@altagroup.kz',
      phone: '+7 707 210 88 41',
      position: 'Шеф-повар и совладелец',
    },
  },
  {
    key: 'famiglia',
    name: 'Famiglia',
    legalName: 'ИП «Фамилия»',
    description: 'Итальянская остерия с собственной пекарней.',
    plan: 'pro',
    commissionPercent: 7,
    isVerified: true,
    joinedAt: '2024-01-22T10:00:00.000Z',
    owner: {
      name: 'Марина Соколова',
      email: 'marina@basilico.kz',
      phone: '+7 705 331 76 20',
      position: 'Основатель',
    },
  },
  {
    key: 'sakura-co',
    name: 'Sakura Co.',
    legalName: 'ТОО «Сакура Ко»',
    description: 'Японская кухня и суши-бары авторского формата.',
    plan: 'pro',
    commissionPercent: 8,
    isVerified: true,
    joinedAt: '2023-08-05T10:00:00.000Z',
    owner: {
      name: 'Данияр Оспанов',
      email: 'd.ospanov@sakura.kz',
      phone: '+7 702 995 03 17',
      position: 'Директор',
    },
  },
  {
    key: 'dastarkhan-holding',
    name: 'Dastarkhan Holding',
    legalName: 'ТОО «Дастархан Холдинг»',
    description: 'Национальная и грузинская кухня, банкетные направления.',
    plan: 'pro',
    commissionPercent: 7,
    isVerified: true,
    joinedAt: '2022-05-19T10:00:00.000Z',
    owner: {
      name: 'Ерлан Сагиндыков',
      email: 'erlan@dastarkhan.kz',
      phone: '+7 700 118 45 63',
      position: 'Генеральный директор',
    },
  },
  {
    key: 'street-food-kz',
    name: 'Street Food KZ',
    legalName: 'ИП «Стрит Фуд КЗ»',
    description: 'Демократичные форматы с сильной доставкой.',
    plan: 'free',
    commissionPercent: 5,
    isVerified: false,
    joinedAt: '2025-02-11T10:00:00.000Z',
    owner: {
      name: 'Нурлан Абишев',
      email: 'nurlan@streetfood.kz',
      phone: '+7 747 620 39 55',
      position: 'Владелец',
    },
  },
  {
    key: 'morning-cafe',
    name: 'Morning Cafe',
    legalName: 'ИП «Морнинг Кафе»',
    description: 'Кафе завтраков и здорового питания.',
    plan: 'pro',
    commissionPercent: 6,
    isVerified: true,
    joinedAt: '2024-06-30T10:00:00.000Z',
    owner: {
      name: 'Аружан Бекова',
      email: 'aruzhan@morningcafe.kz',
      phone: '+7 708 512 74 08',
      position: 'Сооснователь',
    },
  },
  {
    key: 'family-kitchen',
    name: 'Family Kitchen',
    legalName: 'ИП «Фэмили Китчен»',
    description: 'Домашняя кухня и семейные кафе.',
    plan: 'free',
    commissionPercent: 5,
    isVerified: false,
    joinedAt: '2025-05-08T10:00:00.000Z',
    owner: {
      name: 'Гульнара Ахметова',
      email: 'gulnara@familykitchen.kz',
      phone: '+7 777 304 61 92',
      position: 'Владелец',
    },
  },
  {
    key: 'skyline-kz',
    name: 'Skyline KZ',
    legalName: 'ТОО «Скайлайн КЗ»',
    description: 'Панорамные площадки, лофты и клубные пространства.',
    plan: 'premium',
    commissionPercent: 9,
    isVerified: true,
    joinedAt: '2023-01-27T10:00:00.000Z',
    owner: {
      name: 'Тимур Жаксыбеков',
      email: 'timur@skyline.kz',
      phone: '+7 701 880 22 74',
      position: 'CEO',
    },
  },
  {
    key: 'bean-roasters',
    name: 'Bean Roasters',
    legalName: 'ТОО «Бин Роастерс»',
    description: 'Спешелти-кофейни и собственная обжарка.',
    plan: 'pro',
    commissionPercent: 6,
    isVerified: true,
    joinedAt: '2024-03-16T10:00:00.000Z',
    owner: {
      name: 'Санжар Есимов',
      email: 'sanzhar@beantheory.kz',
      phone: '+7 705 774 18 30',
      position: 'Основатель',
    },
  },
  {
    key: 'salta-events',
    name: 'Salta Events',
    legalName: 'ТОО «Салта Ивентс»',
    description: 'Банкетные комплексы и организация торжеств под ключ.',
    plan: 'premium',
    commissionPercent: 9,
    isVerified: true,
    joinedAt: '2022-09-12T10:00:00.000Z',
    owner: {
      name: 'Салтанат Мукашева',
      email: 'saltanat@saltaevents.kz',
      phone: '+7 727 356 90 12',
      position: 'Директор',
    },
  },
  {
    key: 'silk-lounge',
    name: 'Silk Lounge',
    legalName: 'ИП «Силк Лаунж»',
    description: 'Лаунж-бары и кальянные премиального и среднего сегмента.',
    plan: 'pro',
    commissionPercent: 7,
    isVerified: true,
    joinedAt: '2024-10-04T10:00:00.000Z',
    owner: {
      name: 'Рустам Каримов',
      email: 'rustam@silklounge.kz',
      phone: '+7 707 649 25 83',
      position: 'Управляющий',
    },
  },
  {
    key: 'sweet-house',
    name: 'Sweet House',
    legalName: 'ИП «Свит Хаус»',
    description: 'Кондитерские, торты на заказ и мастер-классы.',
    plan: 'pro',
    commissionPercent: 6,
    isVerified: true,
    joinedAt: '2024-04-21T10:00:00.000Z',
    owner: {
      name: 'Дина Нурланова',
      email: 'dina@sweetridge.kz',
      phone: '+7 702 483 55 17',
      position: 'Шеф-кондитер',
    },
  },
];

/** Бизнес, под которым открывается демо-кабинет. */
export const DEMO_BUSINESS_KEY = 'night-city';

export function buildBusinesses(venueIdsByBusinessKey: Map<string, string[]>): Business[] {
  return BUSINESS_SEEDS.map((seed) => ({
    id: `biz-${seed.key}`,
    slug: seed.key,
    name: seed.name,
    legalName: seed.legalName,
    taxId: `KZ${String(Math.abs(hash(seed.key))).padStart(12, '0').slice(0, 12)}`,
    logo: `/api/photo/biz-${seed.key}/200/200`,
    description: seed.description,
    owner: {
      userId: `user-owner-${seed.key}`,
      name: seed.owner.name,
      email: seed.owner.email,
      phone: seed.owner.phone,
      position: seed.owner.position,
      avatar: `/api/avatar/${seed.key}/120`,
    },
    venueIds: venueIdsByBusinessKey.get(seed.key) ?? [],
    plan: seed.plan,
    isVerified: seed.isVerified,
    commissionPercent: seed.commissionPercent,
    joinedAt: seed.joinedAt,
    createdAt: seed.joinedAt,
    updatedAt: NOW,
  }));
}

function hash(value: string) {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) {
    result = (result * 31 + value.charCodeAt(i)) | 0;
  }
  return result;
}
