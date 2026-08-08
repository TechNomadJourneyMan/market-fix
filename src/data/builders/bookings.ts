import type { Booking, BookingStatus, Venue } from '@/types';
import { createRandom, hashString, pick } from '@/lib/utils';
import { toDateKey } from '@/lib/format';
import { DEMO_USER } from '../seed/users';
import { DEMO_NOW } from '../now';

/** «Сегодня» демо-стенда. См. src/data/now.ts */
export const DEMO_TODAY = DEMO_NOW;

const GUEST_NAMES = [
  'Асем Кабылова', 'Виктор Ли', 'Дана Ермекова', 'Олег Крылов', 'Жанар Сатпаева',
  'Марат Абдуллин', 'Юлия Тимофеева', 'Бекзат Онгаров', 'Наталья Гончарова',
  'Ерасыл Токтаров', 'Алина Ким', 'Даулет Смагулов', 'Ксения Панова', 'Айдар Кусаинов',
  'Светлана Белова', 'Нурсултан Байжанов',
];

const COMMENTS = [
  'Пожалуйста, стол у окна',
  'Отмечаем день рождения, нужен торт со свечами',
  'Будем с ребёнком, нужен стульчик',
  'Деловая встреча, желательно потише',
  'Один гость — вегетарианец',
  'Приедем на 10 минут позже, придержите стол',
  '',
  '',
  '',
];

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function buildReference(random: () => number) {
  const code = Array.from({ length: 6 }, () =>
    REFERENCE_ALPHABET[Math.floor(random() * REFERENCE_ALPHABET.length)],
  ).join('');
  return `VN-${code}`;
}

function statusForDate(date: Date, random: () => number): BookingStatus {
  const isPast = date.getTime() < DEMO_TODAY.getTime();
  if (isPast) {
    const roll = random();
    if (roll > 0.88) return 'cancelled';
    if (roll > 0.83) return 'no_show';
    return 'completed';
  }
  const roll = random();
  if (roll > 0.9) return 'pending';
  if (roll > 0.86) return 'awaiting_payment';
  return 'confirmed';
}

function timeForVenue(venue: Venue, random: () => number) {
  const evening = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
  const daytime = ['09:30', '10:00', '11:30', '12:00', '13:00', '14:30', '16:00'];
  const night = ['22:00', '22:30', '23:00', '23:30'];

  if (venue.categoryId === 'cat-coffee' || venue.categoryId === 'cat-bakery') {
    return pick(daytime, random);
  }
  if (venue.categoryId === 'cat-club' || venue.categoryId === 'cat-karaoke') {
    return pick(night, random);
  }
  return random() > 0.3 ? pick(evening, random) : pick(daytime, random);
}

interface BuildBookingsOptions {
  /** Сколько броней сгенерировать на заведение. */
  perVenue?: number;
}

/**
 * Генерирует историю броней по всем заведениям — питает и аналитику бизнеса,
 * и заполненность слотов в форме бронирования.
 */
export function buildBookings(venues: Venue[], options: BuildBookingsOptions = {}): Booking[] {
  const perVenue = options.perVenue ?? 14;
  const bookings: Booking[] = [];

  venues.forEach((venue) => {
    const random = createRandom(hashString(`${venue.slug}-bookings`));
    const commissionPercent = 7;

    for (let index = 0; index < perVenue; index += 1) {
      // −55 … +20 дней от «сегодня»: есть и история, и предстоящие брони.
      const dayOffset = Math.round((random() - 0.73) * 75);
      const date = new Date(DEMO_TODAY);
      date.setDate(date.getDate() + dayOffset);

      const guests = 1 + Math.floor(random() * Math.min(12, Math.max(2, venue.capacity / 12)));
      const status = statusForDate(date, random);
      const subtotal =
        random() > 0.55 ? Math.round((venue.averagePrice * guests * 0.3) / 500) * 500 : 0;
      const commission = Math.round((subtotal * commissionPercent) / 100);

      const createdAt = new Date(date);
      createdAt.setDate(createdAt.getDate() - Math.ceil(random() * 12));

      bookings.push({
        id: `booking-${venue.slug}-${index}`,
        reference: buildReference(random),
        venueId: venue.id,
        venueName: venue.name,
        venueSlug: venue.slug,
        venueImage: venue.coverImage,
        venueAddress: venue.location.address,
        userId: null,
        guest: {
          name: pick(GUEST_NAMES, random),
          phone: '+7 7•• ••• •• ••',
          email: 'guest@example.kz',
        },
        date: toDateKey(date),
        time: timeForVenue(venue, random),
        guests,
        comment: pick(COMMENTS, random) || undefined,
        status,
        subtotal,
        extras: [],
        commission,
        total: subtotal + commission,
        tableId: venue.tables.length ? pick(venue.tables, random).id : undefined,
        cancellationReason: status === 'cancelled' ? 'Изменились планы' : undefined,
        cancelledAt: status === 'cancelled' ? createdAt.toISOString() : undefined,
        hasReview: status === 'completed' && random() > 0.6,
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
      });
    }
  });

  return bookings;
}

/** Персональные брони демо-пользователя — наполняют «Историю бронирований». */
export function buildDemoUserBookings(venues: Venue[]): Booking[] {
  const bySlug = new Map(venues.map((venue) => [venue.slug, venue]));
  const plan: {
    slug: string;
    dayOffset: number;
    time: string;
    guests: number;
    status: BookingStatus;
    comment?: string;
    subtotal: number;
    hasReview: boolean;
  }[] = [
    { slug: 'nuala', dayOffset: 6, time: '19:30', guests: 2, status: 'confirmed', comment: 'Годовщина — хотим стол у окна', subtotal: 24000, hasReview: false },
    { slug: 'daredzhani-kunayeva', dayOffset: 2, time: '13:00', guests: 4, status: 'confirmed', comment: 'Будем с ребёнком', subtotal: 0, hasReview: false },
    { slug: 'yellow-door', dayOffset: 12, time: '21:00', guests: 3, status: 'awaiting_payment', subtotal: 18000, hasReview: false },
    { slug: 'breakfast-martini', dayOffset: -4, time: '11:00', guests: 2, status: 'completed', subtotal: 0, hasReview: true },
    { slug: 'aroma', dayOffset: -11, time: '10:00', guests: 1, status: 'completed', subtotal: 0, hasReview: false },
    { slug: 'manga-sushi', dayOffset: -23, time: '20:00', guests: 2, status: 'completed', comment: 'Место у суши-бара', subtotal: 32000, hasReview: true },
    { slug: 'chechil-rozybakieva', dayOffset: -38, time: '20:30', guests: 6, status: 'completed', subtotal: 0, hasReview: false },
    { slug: 'sandyq', dayOffset: -52, time: '19:00', guests: 4, status: 'cancelled', subtotal: 0, hasReview: false },
  ];

  return plan
    .map((entry, index) => {
      const venue = bySlug.get(entry.slug);
      if (!venue) return null;

      const random = createRandom(hashString(`demo-booking-${entry.slug}`));
      const date = new Date(DEMO_TODAY);
      date.setDate(date.getDate() + entry.dayOffset);
      const createdAt = new Date(date);
      createdAt.setDate(createdAt.getDate() - 5);
      const commission = Math.round(entry.subtotal * 0.07);

      const booking: Booking = {
        id: `booking-demo-${index}`,
        reference: buildReference(random),
        venueId: venue.id,
        venueName: venue.name,
        venueSlug: venue.slug,
        venueImage: venue.coverImage,
        venueAddress: venue.location.address,
        userId: DEMO_USER.id,
        guest: {
          name: DEMO_USER.name,
          phone: DEMO_USER.phone,
          email: DEMO_USER.email,
        },
        date: toDateKey(date),
        time: entry.time,
        guests: entry.guests,
        comment: entry.comment,
        status: entry.status,
        subtotal: entry.subtotal,
        extras: [],
        commission,
        total: entry.subtotal + commission,
        tableId: venue.tables[index % venue.tables.length]?.id,
        cancellationReason: entry.status === 'cancelled' ? 'Перенесли встречу' : undefined,
        cancelledAt: entry.status === 'cancelled' ? createdAt.toISOString() : undefined,
        hasReview: entry.hasReview,
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
      };
      return booking;
    })
    .filter((booking): booking is Booking => booking !== null);
}
