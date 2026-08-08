import type { User } from '@/types';
import { DEFAULT_CITY_ID } from './geo';

const NOW = '2026-01-10T09:00:00.000Z';

/**
 * Демо-пользователь. В MVP авторизации нет — сессия эмулируется этим объектом.
 * При подключении Auth.js/Clerk этот объект заменится реальной сессией.
 */
export const DEMO_USER: User = {
  id: 'user-demo',
  name: 'Айгерим Смагулова',
  email: 'aigerim@example.kz',
  phone: '+7 701 234 56 78',
  avatar: '/api/avatar/aigerim-smagulova/160',
  role: 'user',
  cityId: DEFAULT_CITY_ID,
  joinedAt: '2024-04-18T10:00:00.000Z',
  preferences: {
    favoriteCategoryIds: ['cat-restaurant', 'cat-coffee'],
    favoriteCuisineIds: ['cui-italian', 'cui-japanese', 'cui-author'],
    budgetPerPerson: 12000,
    preferredDistrictIds: ['district-medeu', 'district-gold'],
    typicalPartySize: 4,
    dietary: [],
  },
  settings: {
    language: 'ru',
    theme: 'system',
    currency: 'KZT',
    notifications: {
      bookingUpdates: true,
      promotions: true,
      recommendations: true,
      reviewReplies: true,
      channels: { email: true, push: true, sms: false },
    },
    allowGeolocation: true,
  },
  loyaltyPoints: 2450,
  createdAt: '2024-04-18T10:00:00.000Z',
  updatedAt: NOW,
};

/** Точка отсчёта для сортировки «по расстоянию», пока нет реальной геолокации. */
export const DEMO_USER_LOCATION = { lat: 43.2451, lng: 76.9302 };
