import type { Payment, PaymentBreakdown, PaymentMethod, PaymentMethodKind } from '@/types';
import { db } from '@/data/db';
import { getBookingById, getCommissionPercent } from './bookings';
import { getVenueById } from './venues';

/**
 * Демо-платежи. Реальный эквайринг (Stripe) подключается заменой этого модуля:
 * контракт (breakdown + статусы) уже совпадает с моделью PaymentIntent.
 */
const payments: Payment[] = [];

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    kind: 'card',
    label: 'Банковская карта',
    description: 'Visa, Mastercard, МИР · защищённый платёж',
    icon: 'CreditCard',
    isAvailable: true,
  },
  {
    kind: 'kaspi',
    label: 'Kaspi Pay',
    description: 'Оплата через приложение по QR-коду',
    icon: 'QrCode',
    isAvailable: true,
  },
  {
    kind: 'apple_pay',
    label: 'Apple Pay',
    description: 'Оплата в одно касание',
    icon: 'Smartphone',
    isAvailable: true,
  },
  {
    kind: 'cash_on_site',
    label: 'Оплата на месте',
    description: 'Депозит не списывается, счёт оплачивается в заведении',
    icon: 'Wallet',
    isAvailable: true,
  },
];

/** Разбивка суммы для страницы оплаты: заказ → стоимость → комиссия → итого. */
export function buildPaymentBreakdown(bookingId: string): PaymentBreakdown | null {
  const booking = getBookingById(bookingId);
  if (!booking) return null;

  const venue = getVenueById(booking.venueId);
  const commissionPercent = getCommissionPercent(booking.venueId);

  const lines: PaymentBreakdown['lines'] = [];

  if (booking.subtotal > 0) {
    const extrasTotal = booking.extras.reduce(
      (sum, extra) => sum + extra.price * extra.quantity,
      0,
    );
    const deposit = booking.subtotal - extrasTotal;

    if (deposit > 0) {
      lines.push({
        label: 'Депозит за бронь',
        note: `${booking.guests} чел. · засчитывается в счёт заведения`,
        amount: deposit,
      });
    }

    booking.extras.forEach((extra) => {
      lines.push({
        label: extra.name,
        note: extra.quantity > 1 ? `${extra.quantity} × ${extra.price} ₸` : undefined,
        amount: extra.price * extra.quantity,
      });
    });
  } else {
    lines.push({
      label: 'Бронирование стола',
      note: `${venue?.name ?? ''} · без предоплаты`,
      amount: 0,
    });
  }

  const subtotal = booking.subtotal;
  const commission = Math.round((subtotal * commissionPercent) / 100);
  const promotionDiscount = venue?.promotion
    ? Math.round((subtotal * venue.promotion.discountPercent) / 100 / 2)
    : 0;

  return {
    lines,
    subtotal,
    commissionPercent,
    commission,
    discount: promotionDiscount,
    total: Math.max(0, subtotal + commission - promotionDiscount),
  };
}

/**
 * Демо-оплата: всегда успешна, эквайринг не вызывается.
 * После неё бронь переходит в статус confirmed.
 */
export function createDemoPayment(bookingId: string, method: PaymentMethodKind): Payment | null {
  const booking = getBookingById(bookingId);
  const breakdown = buildPaymentBreakdown(bookingId);
  if (!booking || !breakdown) return null;

  const now = new Date().toISOString();
  const payment: Payment = {
    id: `payment-${Date.now().toString(36)}`,
    bookingId,
    reference: `PAY-${booking.reference.replace('VN-', '')}`,
    amount: breakdown.total,
    commission: breakdown.commission,
    status: 'succeeded',
    method,
    breakdown,
    isDemo: true,
    paidAt: now,
    createdAt: now,
    updatedAt: now,
  };

  payments.push(payment);

  const stored = db.bookings.find((item) => item.id === bookingId);
  if (stored) {
    stored.paymentId = payment.id;
    stored.status = 'confirmed';
    stored.updatedAt = now;
  }

  return payment;
}

export function getPaymentByBooking(bookingId: string): Payment | null {
  return payments.find((payment) => payment.bookingId === bookingId) ?? null;
}
