import type { Entity, ID, ISODateString } from './common';

export type UserRole = 'guest' | 'user' | 'business' | 'admin';

export interface UserPreferences {
  favoriteCategoryIds: ID[];
  favoriteCuisineIds: ID[];
  /** Комфортный средний чек — используется AI-подбором и рекомендациями. */
  budgetPerPerson: number;
  preferredDistrictIds: ID[];
  /** Обычный размер компании. */
  typicalPartySize: number;
  dietary: string[];
}

export interface NotificationSettings {
  bookingUpdates: boolean;
  promotions: boolean;
  recommendations: boolean;
  reviewReplies: boolean;
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface UserSettings {
  language: 'ru' | 'kk' | 'en';
  theme: 'light' | 'dark' | 'system';
  currency: 'KZT';
  notifications: NotificationSettings;
  /** Разрешение на использование геолокации для сортировки «по расстоянию». */
  allowGeolocation: boolean;
}

export interface User extends Entity {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: UserRole;
  cityId: ID;
  /** Дата регистрации — «с нами с 2023» в профиле. */
  joinedAt: ISODateString;
  preferences: UserPreferences;
  settings: UserSettings;
  /** Бонусные баллы — задел под программу лояльности. */
  loyaltyPoints: number;
  businessId?: ID;
}

export type NotificationKind =
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'booking_cancelled'
  | 'promo'
  | 'recommendation'
  | 'review_reply'
  | 'system';

export interface AppNotification extends Entity {
  userId: ID;
  kind: NotificationKind;
  title: string;
  text: string;
  isRead: boolean;
  /** Куда ведёт клик по уведомлению. */
  href?: string;
  venueId?: ID;
}
