import type { Entity, ID } from './common';

export type BusinessPlan = 'free' | 'pro' | 'premium';

export interface BusinessOwner {
  userId: ID;
  name: string;
  email: string;
  phone: string;
  position: string;
  avatar: string;
}

export interface Business extends Entity {
  slug: string;
  name: string;
  legalName: string;
  /** БИН/ИИН — заглушка, поле готово под реальную верификацию. */
  taxId: string;
  logo: string;
  description: string;
  owner: BusinessOwner;
  venueIds: ID[];
  plan: BusinessPlan;
  isVerified: boolean;
  /** Комиссия платформы в процентах — участвует в расчёте на странице оплаты. */
  commissionPercent: number;
  joinedAt: string;
}

/** Агрегаты для дашборда бизнеса. */
export interface BusinessDashboardMetrics {
  views: number;
  viewsDelta: number;
  bookings: number;
  bookingsDelta: number;
  revenue: number;
  revenueDelta: number;
  conversionRate: number;
  conversionDelta: number;
  averageCheck: number;
  rating: number;
  reviewsCount: number;
  newReviews: number;
  occupancyRate: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface BusinessAnalytics {
  views: TimeSeriesPoint[];
  bookings: TimeSeriesPoint[];
  revenue: TimeSeriesPoint[];
  /** Распределение источников трафика. */
  sources: { label: string; value: number }[];
  /** Загрузка по часам — помогает настроить расписание. */
  hourlyLoad: { hour: number; value: number }[];
  topVenues: { venueId: ID; name: string; bookings: number; revenue: number }[];
}
