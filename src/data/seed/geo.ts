import type { City, District } from '@/types';

const NOW = '2026-01-10T09:00:00.000Z';

export const CITIES: City[] = [
  {
    id: 'city-almaty',
    slug: 'almaty',
    name: 'Алматы',
    country: 'Казахстан',
    timezone: 'Asia/Almaty',
    center: { lat: 43.2389, lng: 76.8897 },
    bounds: {
      southWest: { lat: 43.155, lng: 76.79 },
      northEast: { lat: 43.345, lng: 77.0 },
    },
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const DEFAULT_CITY_ID = CITIES[0].id;

/**
 * Районы Алматы. isCentral используется AI-подбором и фильтром «центр».
 */
export const DISTRICTS: District[] = [
  {
    id: 'district-medeu',
    slug: 'medeu',
    name: 'Медеуский',
    cityId: DEFAULT_CITY_ID,
    isCentral: true,
    center: { lat: 43.2465, lng: 76.9553 },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'district-almaly',
    slug: 'almaly',
    name: 'Алмалинский',
    cityId: DEFAULT_CITY_ID,
    isCentral: true,
    center: { lat: 43.2551, lng: 76.9253 },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'district-gold',
    slug: 'zolotoy-kvadrat',
    name: 'Золотой квадрат',
    cityId: DEFAULT_CITY_ID,
    isCentral: true,
    center: { lat: 43.2441, lng: 76.9455 },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'district-bostandyk',
    slug: 'bostandyk',
    name: 'Бостандыкский',
    cityId: DEFAULT_CITY_ID,
    isCentral: false,
    center: { lat: 43.2154, lng: 76.9006 },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'district-auezov',
    slug: 'auezov',
    name: 'Ауэзовский',
    cityId: DEFAULT_CITY_ID,
    isCentral: false,
    center: { lat: 43.2205, lng: 76.8553 },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'district-zhetysu',
    slug: 'zhetysu',
    name: 'Жетысуский',
    cityId: DEFAULT_CITY_ID,
    isCentral: false,
    center: { lat: 43.2903, lng: 76.9002 },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'district-turksib',
    slug: 'turksib',
    name: 'Турксибский',
    cityId: DEFAULT_CITY_ID,
    isCentral: false,
    center: { lat: 43.3105, lng: 76.9605 },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'district-nauryzbay',
    slug: 'nauryzbay',
    name: 'Наурызбайский',
    cityId: DEFAULT_CITY_ID,
    isCentral: false,
    center: { lat: 43.1802, lng: 76.8205 },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'district-foothills',
    slug: 'predgorya',
    name: 'Предгорья',
    cityId: DEFAULT_CITY_ID,
    isCentral: false,
    center: { lat: 43.1755, lng: 76.9702 },
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const DISTRICT_BY_ID = new Map(DISTRICTS.map((d) => [d.id, d]));
export const CITY_BY_ID = new Map(CITIES.map((c) => [c.id, c]));

export const CENTRAL_DISTRICT_IDS = DISTRICTS.filter((d) => d.isCentral).map((d) => d.id);
