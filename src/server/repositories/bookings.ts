import type {
  AvailabilityDay,
  Booking,
  CreateBookingInput,
  TimeSlot,
  WeekDay,
} from '@/types';
import { db } from '@/data/db';
import { DEMO_TODAY } from '@/data/builders/bookings';
import { parseDate, toDateKey } from '@/lib/format';
import { createRandom, hashString } from '@/lib/utils';
import { getEntryForDay, getSlotTimes, isPeakTime } from '@/lib/hours';
import { getVenueById } from './venues';

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Комиссия платформы по умолчанию, %. Реальная берётся из бизнеса заведения. */
export const DEFAULT_COMMISSION_PERCENT = 7;

export function getCommissionPercent(venueId: string) {
  const venue = getVenueById(venueId);
  if (!venue) return DEFAULT_COMMISSION_PERCENT;
  const business = db.businesses.find((item) => item.id === venue.businessId);
  return business?.commissionPercent ?? DEFAULT_COMMISSION_PERCENT;
}

/**
 * Доступность слотов на дату.
 * Занятость выводится из существующих броней + детерминированного «фонового» спроса,
 * чтобы демо выглядело живым: вечер пятницы заполнен сильнее, чем утро вторника.
 */
export function getAvailability(venueId: string, date: string): AvailabilityDay {
  const venue = getVenueById(venueId);
  if (!venue) {
    return { date, isWorkingDay: false, slots: [] };
  }

  const parsed = parseDate(date);
  const day = parsed.getDay() as WeekDay;
  const entry = getEntryForDay(venue.workingHours, day);

  if (!entry || entry.isClosed) {
    return { date, isWorkingDay: false, slots: [] };
  }

  const bookedByTime = new Map<string, number>();
  db.bookings
    .filter(
      (booking) =>
        booking.venueId === venueId &&
        booking.date === date &&
        booking.status !== 'cancelled' &&
        booking.status !== 'no_show',
    )
    .forEach((booking) => {
      bookedByTime.set(booking.time, (bookedByTime.get(booking.time) ?? 0) + booking.guests);
    });

  const random = createRandom(hashString(`${venueId}-${date}`));
  const isWeekend = day === 5 || day === 6;
  const seatsPerSlot = Math.max(6, Math.round(venue.capacity / 6));

  const slots: TimeSlot[] = getSlotTimes(entry).map((time) => {
    const peak = isPeakTime(time);
    // Фоновая загрузка: пик + выходной → мест меньше.
    const baseLoad = (peak ? 0.55 : 0.25) + (isWeekend ? 0.2 : 0) + random() * 0.25;
    const backgroundTaken = Math.round(seatsPerSlot * Math.min(baseLoad, 0.95));
    const realTaken = bookedByTime.get(time) ?? 0;
    const seatsLeft = Math.max(0, seatsPerSlot - backgroundTaken - realTaken);

    return {
      time,
      isAvailable: seatsLeft > 0,
      seatsLeft,
      isPopular: peak,
    };
  });

  return { date, isWorkingDay: true, slots };
}

/** Ближайшие N дней с признаком доступности — для чипов выбора даты. */
export function getAvailabilityRange(venueId: string, days = 14, from = DEMO_TODAY) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(from);
    date.setDate(date.getDate() + index);
    const key = toDateKey(date);
    const availability = getAvailability(venueId, key);
    return {
      date: key,
      isWorkingDay: availability.isWorkingDay,
      freeSlots: availability.slots.filter((slot) => slot.isAvailable).length,
    };
  });
}

function generateReference(seed: string) {
  const random = createRandom(hashString(seed));
  const code = Array.from(
    { length: 6 },
    () => REFERENCE_ALPHABET[Math.floor(random() * REFERENCE_ALPHABET.length)],
  ).join('');
  return `VN-${code}`;
}

export interface CreateBookingResult {
  booking: Booking;
  /** Требуется ли переход на страницу оплаты. */
  requiresPayment: boolean;
}

/**
 * Создаёт бронь. В MVP пишем в in-memory хранилище;
 * сигнатура совпадает с будущей реализацией на Prisma.
 */
export function createBooking(
  input: CreateBookingInput,
  userId: string | null = null,
): CreateBookingResult {
  const venue = getVenueById(input.venueId);
  if (!venue) {
    throw new Error('VENUE_NOT_FOUND');
  }

  const extras = input.extras ?? [];
  const extrasTotal = extras.reduce((sum, extra) => sum + extra.price * extra.quantity, 0);

  // Депозит берём там, где это принято: банкеты, клубы, караоке, лофты.
  const depositCategories = ['cat-banquet', 'cat-club', 'cat-karaoke', 'cat-loft'];
  const requiresDeposit = depositCategories.includes(venue.categoryId);
  const deposit = requiresDeposit
    ? Math.round((venue.averagePrice * input.guests * 0.4) / 500) * 500
    : 0;

  const subtotal = deposit + extrasTotal;
  const commissionPercent = getCommissionPercent(venue.id);
  const commission = Math.round((subtotal * commissionPercent) / 100);

  const now = new Date().toISOString();
  const id = `booking-${Date.now().toString(36)}-${db.bookings.length}`;

  const booking: Booking = {
    id,
    reference: generateReference(id),
    venueId: venue.id,
    venueName: venue.name,
    venueSlug: venue.slug,
    venueImage: venue.coverImage,
    venueAddress: venue.location.address,
    userId,
    guest: { name: input.name, phone: input.phone, email: input.email },
    date: input.date,
    time: input.time,
    guests: input.guests,
    comment: input.comment?.trim() || undefined,
    status: subtotal > 0 ? 'awaiting_payment' : 'confirmed',
    subtotal,
    extras,
    commission,
    total: subtotal + commission,
    tableId: venue.tables.find((table) => table.seats >= input.guests)?.id,
    hasReview: false,
    createdAt: now,
    updatedAt: now,
  };

  db.bookings.unshift(booking);
  return { booking, requiresPayment: subtotal > 0 };
}

export function getBookingById(id: string): Booking | null {
  return db.bookings.find((booking) => booking.id === id) ?? null;
}

export function getBookingByReference(reference: string): Booking | null {
  return db.bookings.find((booking) => booking.reference === reference) ?? null;
}

export function getUserBookings(userId: string) {
  const bookings = db.bookings
    .filter((booking) => booking.userId === userId)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const todayKey = toDateKey(DEMO_TODAY);
  const upcoming = bookings
    .filter(
      (booking) =>
        booking.date >= todayKey &&
        (booking.status === 'confirmed' ||
          booking.status === 'pending' ||
          booking.status === 'awaiting_payment'),
    )
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  const past = bookings.filter((booking) => !upcoming.includes(booking));

  return { all: bookings, upcoming, past };
}

export function getBusinessBookings(businessId: string) {
  const venueIds = new Set(
    db.venues.filter((venue) => venue.businessId === businessId).map((venue) => venue.id),
  );
  return db.bookings
    .filter((booking) => venueIds.has(booking.venueId))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function updateBookingStatus(id: string, status: Booking['status']) {
  const booking = db.bookings.find((item) => item.id === id);
  if (!booking) return null;
  booking.status = status;
  booking.updatedAt = new Date().toISOString();
  if (status === 'cancelled') {
    booking.cancelledAt = booking.updatedAt;
    booking.cancellationReason ??= 'Отменено гостем';
  }
  return booking;
}
