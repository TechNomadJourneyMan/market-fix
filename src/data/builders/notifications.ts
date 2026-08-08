import type { AppNotification, Booking, Venue } from '@/types';
import { formatDate } from '@/lib/format';
import { DEMO_NOW } from '../now';

const BASE_DATE = DEMO_NOW;

function hoursAgoIso(hours: number) {
  const date = new Date(BASE_DATE);
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

/**
 * Уведомления собираются из реальных броней пользователя —
 * это делает демо связным: клик по уведомлению ведёт на существующий объект.
 */
export function buildNotifications(
  venues: Venue[],
  bookings: Booking[],
  userId: string,
): AppNotification[] {
  const userBookings = bookings
    .filter((booking) => booking.userId === userId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const bySlug = new Map(venues.map((venue) => [venue.slug, venue]));
  const notifications: AppNotification[] = [];

  const upcoming = userBookings.find((booking) => booking.status === 'confirmed');
  if (upcoming) {
    notifications.push({
      id: 'notif-1',
      userId,
      kind: 'booking_reminder',
      title: `Напоминание: ${upcoming.venueName}`,
      text: `Ваш стол на ${upcoming.guests} чел. ждёт ${formatDate(upcoming.date)} в ${upcoming.time}. Адрес: ${upcoming.venueAddress}.`,
      isRead: false,
      href: `/account/bookings`,
      venueId: upcoming.venueId,
      createdAt: hoursAgoIso(3),
      updatedAt: hoursAgoIso(3),
    });
  }

  const awaiting = userBookings.find((booking) => booking.status === 'awaiting_payment');
  if (awaiting) {
    notifications.push({
      id: 'notif-2',
      userId,
      kind: 'booking_confirmed',
      title: 'Осталось оплатить депозит',
      text: `Бронь ${awaiting.reference} в «${awaiting.venueName}» подтвердится сразу после оплаты.`,
      isRead: false,
      href: `/checkout/${awaiting.id}`,
      venueId: awaiting.venueId,
      createdAt: hoursAgoIso(11),
      updatedAt: hoursAgoIso(11),
    });
  }

  const promoVenue = venues.find((venue) => venue.promotion && venue.slug === 'daredzhani-kunayeva');
  if (promoVenue?.promotion) {
    notifications.push({
      id: 'notif-3',
      userId,
      kind: 'promo',
      title: `${promoVenue.promotion.title} в «${promoVenue.name}»`,
      text: promoVenue.promotion.description,
      isRead: false,
      href: `/venue/${promoVenue.slug}`,
      venueId: promoVenue.id,
      createdAt: hoursAgoIso(26),
      updatedAt: hoursAgoIso(26),
    });
  }

  const recommended = bySlug.get('sandyq');
  if (recommended) {
    notifications.push({
      id: 'notif-4',
      userId,
      kind: 'recommendation',
      title: 'Похоже на то, что вы любите',
      text: `«${recommended.name}» — ${recommended.tagline.toLowerCase()}. Рейтинг ${recommended.rating.score} и свободные столы на выходные.`,
      isRead: true,
      href: `/venue/${recommended.slug}`,
      venueId: recommended.id,
      createdAt: hoursAgoIso(52),
      updatedAt: hoursAgoIso(52),
    });
  }

  const reviewed = userBookings.find((booking) => booking.hasReview);
  if (reviewed) {
    notifications.push({
      id: 'notif-5',
      userId,
      kind: 'review_reply',
      title: `«${reviewed.venueName}» ответили на ваш отзыв`,
      text: 'Спасибо за тёплые слова! Передали ваш отзыв команде — будем рады видеть вас снова.',
      isRead: true,
      href: `/venue/${reviewed.venueSlug}#reviews`,
      venueId: reviewed.venueId,
      createdAt: hoursAgoIso(96),
      updatedAt: hoursAgoIso(96),
    });
  }

  const completed = userBookings.find(
    (booking) => booking.status === 'completed' && !booking.hasReview,
  );
  if (completed) {
    notifications.push({
      id: 'notif-6',
      userId,
      kind: 'system',
      title: 'Как прошёл визит?',
      text: `Оставьте отзыв о «${completed.venueName}» — это займёт минуту и поможет другим гостям.`,
      isRead: true,
      href: `/venue/${completed.venueSlug}#reviews`,
      venueId: completed.venueId,
      createdAt: hoursAgoIso(140),
      updatedAt: hoursAgoIso(140),
    });
  }

  return notifications;
}
