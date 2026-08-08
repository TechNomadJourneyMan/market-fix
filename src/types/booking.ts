import type { Entity, ID, ISODateString, TimeString } from './common';

export type BookingStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface BookingGuest {
  name: string;
  phone: string;
  email: string;
}

/** Дополнительная услуга, добавленная к брони (банкетный зал, торт, декор). */
export interface BookingExtra {
  serviceId: ID;
  name: string;
  price: number;
  quantity: number;
}

export interface Booking extends Entity {
  /** Человекочитаемый номер брони: VN-2K7F4A */
  reference: string;
  venueId: ID;
  venueName: string;
  venueSlug: string;
  venueImage: string;
  venueAddress: string;
  userId: ID | null;
  guest: BookingGuest;
  /** YYYY-MM-DD */
  date: string;
  time: TimeString;
  guests: number;
  comment?: string;
  status: BookingStatus;
  /** Стоимость услуг/депозита, ₸. 0 — бронь без предоплаты. */
  subtotal: number;
  extras: BookingExtra[];
  /** Комиссия платформы, ₸ */
  commission: number;
  total: number;
  paymentId?: ID;
  tableId?: ID;
  /** Отмена: причина хранится для аналитики. */
  cancellationReason?: string;
  cancelledAt?: ISODateString;
  /** Уже оставлен ли отзыв — управляет CTA в истории броней. */
  hasReview: boolean;
}

/** Слот в расписании — доступное время бронирования. */
export interface TimeSlot {
  time: TimeString;
  isAvailable: boolean;
  /** Осталось столов — создаёт эффект дефицита в UI. */
  seatsLeft: number;
  /** Час пик: подсказка «популярное время». */
  isPopular: boolean;
}

export interface AvailabilityDay {
  date: string;
  isWorkingDay: boolean;
  slots: TimeSlot[];
}

export interface CreateBookingInput {
  venueId: ID;
  date: string;
  time: TimeString;
  guests: number;
  comment?: string;
  name: string;
  phone: string;
  email: string;
  extras?: BookingExtra[];
}
