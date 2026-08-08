import type { Entity, ID } from './common';

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';

export type PaymentMethodKind = 'card' | 'apple_pay' | 'google_pay' | 'kaspi' | 'cash_on_site';

export interface PaymentMethod {
  kind: PaymentMethodKind;
  label: string;
  description: string;
  icon: string;
  /** В демо доступен только «оплата на месте» и «карта» (заглушка). */
  isAvailable: boolean;
}

/** Разбивка суммы — то, что показывает страница оплаты по ТЗ. */
export interface PaymentBreakdown {
  /** Позиции заказа. */
  lines: { label: string; note?: string; amount: number }[];
  subtotal: number;
  commissionPercent: number;
  commission: number;
  discount: number;
  total: number;
}

export interface Payment extends Entity {
  bookingId: ID;
  reference: string;
  amount: number;
  commission: number;
  status: PaymentStatus;
  method: PaymentMethodKind;
  breakdown: PaymentBreakdown;
  /** В демо всегда true — реальный эквайринг подключается позже. */
  isDemo: boolean;
  paidAt?: string;
}
