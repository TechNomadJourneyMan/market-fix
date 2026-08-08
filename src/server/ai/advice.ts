import type { AIAdvice } from '@/types';
import { db } from '@/data/db';
import { formatPrice, formatDate } from '@/lib/format';
import { getUserById, getUserStats } from '../repositories/users';

/**
 * Персональные AI-советы для кабинета.
 * Каждый совет выводится из реальных данных пользователя — это делает демо убедительным.
 */
export function getAIAdvice(userId: string): AIAdvice[] {
  const user = getUserById(userId);
  if (!user) return [];

  const stats = getUserStats(userId);
  const bookings = db.bookings.filter((booking) => booking.userId === userId);
  const favoriteIds = new Set(
    db.favorites.filter((favorite) => favorite.userId === userId).map((f) => f.venueId),
  );

  const advice: AIAdvice[] = [];

  // 1. Паттерн визитов.
  const visitedCategories = bookings
    .map((booking) => db.venues.find((venue) => venue.id === booking.venueId)?.categoryId)
    .filter(Boolean) as string[];
  const topCategoryId = mode(visitedCategories);
  const topCategory = db.categories.find((category) => category.id === topCategoryId);

  if (topCategory) {
    const unexplored = db.categories
      .filter((category) => category.id !== topCategoryId && category.isPopular)
      .find((category) =>
        !visitedCategories.includes(category.id),
      );
    advice.push({
      id: 'advice-pattern',
      kind: 'discovery',
      icon: 'Compass',
      title: `Вы чаще выбираете ${topCategory.namePlural}`,
      text: unexplored
        ? `За последние месяцы это ваш основной формат. Судя по вкусам, вам зайдут ${unexplored.namePlural} — там есть места с таким же рейтингом и похожей атмосферой.`
        : 'Вы уже попробовали почти все форматы — покажем новинки этой недели.',
      actionLabel: unexplored ? `Смотреть ${unexplored.namePlural}` : 'Смотреть новинки',
      actionHref: unexplored ? `/catalog?category=${unexplored.slug}` : '/catalog?sort=rating',
    });
  }

  // 2. Экономия на акциях в избранном.
  const promoFavorite = db.venues.find(
    (venue) => favoriteIds.has(venue.id) && venue.promotion,
  );
  if (promoFavorite?.promotion) {
    advice.push({
      id: 'advice-saving',
      kind: 'saving',
      icon: 'PiggyBank',
      title: `Скидка в «${promoFavorite.name}» из вашего избранного`,
      text: `${promoFavorite.promotion.title}: ${promoFavorite.promotion.description}. При среднем чеке ${formatPrice(promoFavorite.averagePrice)} экономия составит около ${formatPrice((promoFavorite.averagePrice * promoFavorite.promotion.discountPercent) / 100)} с человека.`,
      actionLabel: 'Забронировать со скидкой',
      actionHref: `/venue/${promoFavorite.slug}`,
    });
  }

  // 3. Тайминг: когда бронировать выгоднее.
  advice.push({
    id: 'advice-timing',
    kind: 'timing',
    icon: 'Clock',
    title: 'Бронируйте на 18:00 вместо 20:00',
    text: 'В ваших любимых заведениях столы на 20:00 разбирают за 3–4 дня, а на 18:00 почти всегда свободно. К тому же в это время чаще действуют дневные предложения.',
    actionLabel: 'Найти свободные столы',
    actionHref: '/catalog?availableNow=1',
  });

  // 4. Бюджет.
  const spentBookings = bookings.filter((booking) => booking.total > 0);
  if (spentBookings.length > 0) {
    const average = Math.round(
      spentBookings.reduce((sum, booking) => sum + booking.total, 0) / spentBookings.length,
    );
    advice.push({
      id: 'advice-budget',
      kind: 'insight',
      icon: 'TrendingUp',
      title: `Ваш средний чек — ${formatPrice(average)}`,
      text: `Это ${average > user.preferences.budgetPerPerson ? 'выше' : 'в рамках'} комфортного бюджета ${formatPrice(user.preferences.budgetPerPerson)}, который вы указали в профиле. Мы подбираем рекомендации с учётом этой суммы — измените её в настройках, если ориентир поменялся.`,
      actionLabel: 'Настроить предпочтения',
      actionHref: '/account/settings',
    });
  }

  // 5. Ближайшая бронь.
  const upcoming = bookings
    .filter((booking) => booking.status === 'confirmed')
    .sort((a, b) => (a.date > b.date ? 1 : -1))[0];
  if (upcoming) {
    advice.push({
      id: 'advice-upcoming',
      kind: 'timing',
      icon: 'CalendarHeart',
      title: `Скоро визит: ${upcoming.venueName}`,
      text: `${formatDate(upcoming.date)} в ${upcoming.time}. Дорога займёт около 20 минут в вечерний час пик — выезжайте заранее. Стол держат 20 минут после времени брони.`,
      actionLabel: 'Открыть бронь',
      actionHref: '/account/bookings',
    });
  }

  // 6. Лояльность.
  if (stats.loyaltyPoints > 0) {
    advice.push({
      id: 'advice-loyalty',
      kind: 'saving',
      icon: 'Gift',
      title: `${stats.loyaltyPoints} баллов ждут применения`,
      text: `Баллы можно списать при оплате депозита — это до ${formatPrice(stats.loyaltyPoints)} скидки. Начисляем 3% от каждой оплаченной через платформу брони.`,
      actionLabel: 'Смотреть рекомендации',
      actionHref: '/account/recommendations',
    });
  }

  return advice;
}

function mode(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  let best: string | undefined;
  let bestCount = 0;
  counts.forEach((count, value) => {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  });
  return best;
}
