import type { AppNotification, SearchHistoryEntry, User, VenueListItem } from '@/types';
import { db, DEMO_USER_ID } from '@/data/db';
import { getVenueListItems } from './venues';
import { toVenueListItem } from '../mappers';
import { distanceKm } from '@/lib/geo';
import { DEMO_USER_LOCATION } from '@/data/seed/users';

/**
 * Пользователь из in-memory БД (seed).
 * Для страниц с реальной сессией предпочитайте getSessionUser() из @/lib/auth.
 */
export function getCurrentUser(userId: string = DEMO_USER_ID): User {
  return (
    db.users.find((user) => user.id === userId) ??
    db.users.find((user) => user.id === DEMO_USER_ID) ??
    db.users[0]
  );
}

export function getUserById(id: string): User | null {
  return db.users.find((user) => user.id === id) ?? null;
}

export function updateUser(id: string, patch: Partial<User>): User | null {
  const user = db.users.find((item) => item.id === id);
  if (!user) return null;
  Object.assign(user, patch, { updatedAt: new Date().toISOString() });
  return user;
}

// ——— Избранное ———

export function getFavoriteVenues(userId: string): (VenueListItem & { note?: string })[] {
  const favorites = db.favorites
    .filter((favorite) => favorite.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const noteByVenueId = new Map(favorites.map((f) => [f.venueId, f.note]));
  return getVenueListItems(favorites.map((favorite) => favorite.venueId)).map((venue) => ({
    ...venue,
    note: noteByVenueId.get(venue.id),
  }));
}

export function getFavoriteVenueIds(userId: string): string[] {
  return db.favorites
    .filter((favorite) => favorite.userId === userId)
    .map((favorite) => favorite.venueId);
}

export function toggleFavorite(userId: string, venueId: string) {
  const index = db.favorites.findIndex(
    (favorite) => favorite.userId === userId && favorite.venueId === venueId,
  );
  if (index >= 0) {
    db.favorites.splice(index, 1);
    return { isFavorite: false };
  }
  db.favorites.unshift({
    id: `fav-${Date.now().toString(36)}`,
    userId,
    venueId,
    createdAt: new Date().toISOString(),
  });
  return { isFavorite: true };
}

// ——— История поиска ———

export function getSearchHistory(userId: string): SearchHistoryEntry[] {
  return db.searchHistory
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function clearSearchHistory(userId: string) {
  for (let index = db.searchHistory.length - 1; index >= 0; index -= 1) {
    if (db.searchHistory[index].userId === userId) db.searchHistory.splice(index, 1);
  }
}

// ——— Уведомления ———

export function getNotifications(userId: string): AppNotification[] {
  return db.notifications
    .filter((notification) => notification.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getUnreadNotificationCount(userId: string) {
  return db.notifications.filter(
    (notification) => notification.userId === userId && !notification.isRead,
  ).length;
}

export function markNotificationRead(id: string) {
  const notification = db.notifications.find((item) => item.id === id);
  if (notification) notification.isRead = true;
  return notification ?? null;
}

export function markAllNotificationsRead(userId: string) {
  db.notifications
    .filter((notification) => notification.userId === userId)
    .forEach((notification) => {
      notification.isRead = true;
    });
}

/**
 * Персональные рекомендации: совпадение с предпочтениями профиля,
 * с учётом уже посещённых и добавленных в избранное мест.
 */
export function getPersonalRecommendations(userId: string, limit = 8) {
  const user = getUserById(userId);
  if (!user) return [];

  const favoriteIds = new Set(getFavoriteVenueIds(userId));
  const visitedIds = new Set(
    db.bookings.filter((booking) => booking.userId === userId).map((booking) => booking.venueId),
  );

  return db.venues
    .filter((venue) => venue.status === 'published' && !favoriteIds.has(venue.id))
    .map((venue) => {
      let score = venue.rating.score * 8;

      if (user.preferences.favoriteCategoryIds.includes(venue.categoryId)) score += 22;
      score += venue.cuisineIds.filter((id) => user.preferences.favoriteCuisineIds.includes(id))
        .length * 16;
      if (user.preferences.preferredDistrictIds.includes(venue.location.districtId)) score += 14;

      const budgetGap = Math.abs(venue.averagePrice - user.preferences.budgetPerPerson);
      score -= (budgetGap / user.preferences.budgetPerPerson) * 12;

      if (venue.capacity >= user.preferences.typicalPartySize) score += 4;
      if (venue.promotion) score += 6;
      // Уже был — показываем ниже, но не убираем совсем.
      if (visitedIds.has(venue.id)) score -= 25;

      return { venue, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) =>
      toVenueListItem(
        entry.venue,
        Number(distanceKm(DEMO_USER_LOCATION, entry.venue.location.coordinates).toFixed(2)),
      ),
    );
}

/** Статистика профиля: сколько броней, отзывов, накоплено баллов. */
export function getUserStats(userId: string) {
  const bookings = db.bookings.filter((booking) => booking.userId === userId);
  const completed = bookings.filter((booking) => booking.status === 'completed');
  const user = getUserById(userId);

  return {
    totalBookings: bookings.length,
    completedBookings: completed.length,
    upcomingBookings: bookings.filter(
      (booking) => booking.status === 'confirmed' || booking.status === 'awaiting_payment',
    ).length,
    favorites: db.favorites.filter((favorite) => favorite.userId === userId).length,
    reviews: completed.filter((booking) => booking.hasReview).length,
    loyaltyPoints: user?.loyaltyPoints ?? 0,
    savedAmount: completed.length * 3200,
  };
}
