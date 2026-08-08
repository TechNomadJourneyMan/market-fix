import type {
  AIRecommendation,
  AIRecommendationRequest,
  AIRecommendationResult,
  AIScoreFactor,
  DayPart,
  Occasion,
  Vibe,
  VenueAmenity,
  VenueListItem,
  WeekDay,
} from '@/types';
import { db } from '@/data/db';
import { CUISINE_BY_ID, CATEGORY_BY_ID } from '@/data/seed/categories';
import { CENTRAL_DISTRICT_IDS, DISTRICT_BY_ID } from '@/data/seed/geo';
import { DEMO_USER_LOCATION } from '@/data/seed/users';
import { DEMO_TODAY } from '@/data/builders/bookings';
import { distanceKm } from '@/lib/geo';
import { getEntryForDay, toMinutes } from '@/lib/hours';
import { formatPrice, formatGuests, plural } from '@/lib/format';
import { toVenueListItem } from '../mappers';
import { parseFreeText } from './keywords';

/**
 * Демонстрационный AI-подбор без LLM.
 *
 * Логика — взвешенный скоринг с объяснением каждого фактора.
 * Контракт recommend() совпадает с будущей реализацией на OpenAI:
 * достаточно подменить движок, оставив тот же вход/выход.
 */

/** Максимально достижимая сумма баллов — база для нормализации в проценты. */
const MAX_SCORE = 100;

const DAY_PART_WINDOWS: Record<DayPart, { from: number; to: number; label: string }> = {
  morning: { from: 8 * 60, to: 11 * 60, label: 'утром' },
  lunch: { from: 12 * 60, to: 15 * 60, label: 'в обед' },
  afternoon: { from: 15 * 60, to: 18 * 60, label: 'днём' },
  evening: { from: 19 * 60, to: 22 * 60, label: 'вечером' },
  night: { from: 23 * 60, to: 26 * 60, label: 'ночью' },
};

const OCCASION_PROFILE: Record<
  Occasion,
  { label: string; tags: string[]; amenities: VenueAmenity[]; categories: string[] }
> = {
  date: {
    label: 'свидания',
    tags: ['свидание', 'тихо', 'вид', 'закат', 'вино'],
    amenities: ['terrace', 'music'],
    categories: ['cat-restaurant', 'cat-bar', 'cat-lounge'],
  },
  friends: {
    label: 'встречи с друзьями',
    tags: ['большая компания', 'весело', 'компанией', 'спорт'],
    amenities: ['music', 'sports_broadcast'],
    categories: ['cat-bar', 'cat-karaoke', 'cat-lounge'],
  },
  family: {
    label: 'семейного визита',
    tags: ['с детьми', 'семейный ужин', 'детское меню'],
    amenities: ['kids', 'parking', 'accessible'],
    categories: ['cat-cafe', 'cat-restaurant', 'cat-loft'],
  },
  business: {
    label: 'деловой встречи',
    tags: ['деловой ужин', 'тихо', 'переговорная', 'для работы'],
    amenities: ['wifi', 'parking', 'vip'],
    categories: ['cat-restaurant', 'cat-coffee'],
  },
  celebration: {
    label: 'праздника',
    tags: ['той', 'банкет', 'день рождения', 'свадьба', 'юбилей'],
    amenities: ['banquet', 'vip', 'music', 'catering'],
    categories: ['cat-banquet', 'cat-loft', 'cat-karaoke'],
  },
  solo: {
    label: 'визита в одиночку',
    tags: ['для работы', 'тихо', 'коворкинг', 'кофе'],
    amenities: ['wifi'],
    categories: ['cat-coffee', 'cat-cafe'],
  },
};

const VIBE_TAGS: Record<Vibe, string[]> = {
  cozy: ['уютно', 'камерно', 'тихо', 'домашняя кухня'],
  lively: ['живая музыка', 'весело', 'танцпол', 'диджей'],
  quiet: ['тихо', 'для работы', 'спокойно'],
  premium: ['винная карта', 'дегустационный сет', 'стейки', 'vip-ложа'],
  trendy: ['модно', 'крыша', 'вид на город', 'спешелти'],
  casual: ['недорого', 'быстро', 'доставка', 'обеды'],
};

function isOpenAtDayPart(venue: VenueListItem, dayPart: DayPart, date: Date) {
  const window = DAY_PART_WINDOWS[dayPart];
  const entry = getEntryForDay(venue.workingHours, date.getDay() as WeekDay);
  if (!entry || entry.isClosed) return false;

  const opens = toMinutes(entry.opensAt);
  const closes = entry.isOvernight ? toMinutes(entry.closesAt) + 24 * 60 : toMinutes(entry.closesAt);
  // Достаточно пересечения окна с рабочим интервалом.
  return opens <= window.to && closes >= window.from;
}

interface ScoredVenue {
  venue: VenueListItem;
  score: number;
  factors: AIScoreFactor[];
  caveats: string[];
}

function scoreVenue(
  venue: VenueListItem,
  request: AIRecommendationRequest,
  date: Date,
): ScoredVenue | null {
  const factors: AIScoreFactor[] = [];
  const caveats: string[] = [];
  let score = 0;

  const guests = request.guests ?? 2;

  // ——— Жёсткие ограничения: не влезли гости или нет обязательного удобства ———
  if (venue.capacity < guests) return null;

  if (request.mustHave?.length) {
    const missing = request.mustHave.filter(
      (amenity) => !venue.amenities.includes(amenity as VenueAmenity),
    );
    if (missing.length > request.mustHave.length / 2) return null;
    if (missing.length) {
      caveats.push('Есть не все запрошенные условия — уточните при бронировании');
      score -= 6;
    } else {
      score += 8;
      factors.push({
        key: 'must-have',
        label: 'Все условия соблюдены',
        impact: 8,
        reason: 'Заведение отвечает всем указанным требованиям',
        kind: 'match',
      });
    }
  }

  // ——— Кухня ———
  if (request.cuisineIds?.length) {
    const matched = venue.cuisineIds.filter((id) => request.cuisineIds!.includes(id));
    if (matched.length) {
      const impact = 30;
      score += impact;
      const names = matched
        .map((id) => CUISINE_BY_ID.get(id)?.name)
        .filter(Boolean)
        .join(', ');
      factors.push({
        key: 'cuisine',
        label: 'Кухня',
        impact,
        reason: `${names} — точное совпадение с вашим запросом`,
        kind: 'match',
      });
    } else {
      score -= 18;
      caveats.push('Кухня отличается от запрошенной');
    }
  }

  // ——— Категория ———
  if (request.categoryIds?.length) {
    if (request.categoryIds.includes(venue.categoryId)) {
      score += 14;
      factors.push({
        key: 'category',
        label: 'Формат',
        impact: 14,
        reason: `${CATEGORY_BY_ID.get(venue.categoryId)?.name ?? 'Формат'} — то, что вы искали`,
        kind: 'match',
      });
    } else {
      score -= 10;
    }
  }

  // ——— Бюджет ———
  if (request.budgetPerPerson) {
    const budget = request.budgetPerPerson;
    const ratio = venue.averagePrice / budget;

    if (ratio <= 0.7) {
      score += 18;
      factors.push({
        key: 'budget',
        label: 'Бюджет',
        impact: 18,
        reason: `Средний чек ${formatPrice(venue.averagePrice)} — заметно ниже вашего лимита`,
        kind: 'bonus',
      });
    } else if (ratio <= 1) {
      score += 24;
      factors.push({
        key: 'budget',
        label: 'Бюджет',
        impact: 24,
        reason: `Средний чек ${formatPrice(venue.averagePrice)} укладывается в ${formatPrice(budget)}`,
        kind: 'match',
      });
    } else if (ratio <= 1.25) {
      score -= 8;
      factors.push({
        key: 'budget',
        label: 'Бюджет',
        impact: -8,
        reason: `Немного выше лимита: ${formatPrice(venue.averagePrice)} против ${formatPrice(budget)}`,
        kind: 'penalty',
      });
      caveats.push(`Дороже бюджета примерно на ${Math.round((ratio - 1) * 100)}%`);
    } else {
      return null;
    }
  }

  // ——— Компания ———
  if (request.guests) {
    const headroom = venue.capacity / guests;
    if (guests >= 8) {
      if (venue.amenities.includes('banquet')) {
        score += 14;
        factors.push({
          key: 'party',
          label: 'Большая компания',
          impact: 14,
          reason: `Есть банкетное обслуживание — ${formatGuests(guests)} разместим без проблем`,
          kind: 'match',
        });
      } else if (headroom >= 4) {
        score += 6;
        factors.push({
          key: 'party',
          label: 'Большая компания',
          impact: 6,
          reason: `Вместимость ${venue.capacity} мест — места хватит`,
          kind: 'bonus',
        });
      } else {
        caveats.push('Для такой компании лучше забронировать заранее');
      }
    } else {
      score += 6;
      factors.push({
        key: 'party',
        label: 'Компания',
        impact: 6,
        reason: `Комфортно для ${formatGuests(guests)}`,
        kind: 'bonus',
      });
    }
  }

  // ——— Район ———
  const districtIds = request.districtIds ?? (request.centerOnly ? CENTRAL_DISTRICT_IDS : []);
  if (districtIds.length) {
    if (districtIds.includes(venue.location.districtId)) {
      score += 16;
      factors.push({
        key: 'district',
        label: 'Локация',
        impact: 16,
        reason: request.centerOnly
          ? `${venue.location.districtName} — это центр города`
          : `${venue.location.districtName} — нужный вам район`,
        kind: 'match',
      });
    } else {
      const km = venue.distanceKm ?? 0;
      if (km <= 4) {
        score += 4;
        factors.push({
          key: 'district',
          label: 'Локация',
          impact: 4,
          reason: `Другой район, но всего ${km.toFixed(1).replace('.', ',')} км от вас`,
          kind: 'bonus',
        });
      } else {
        score -= 12;
        caveats.push(`${venue.location.districtName} — за пределами выбранного района`);
      }
    }
  }

  // ——— Время ———
  if (request.dayPart) {
    if (isOpenAtDayPart(venue, request.dayPart, date)) {
      score += 12;
      factors.push({
        key: 'time',
        label: 'Время',
        impact: 12,
        reason: `Работает ${DAY_PART_WINDOWS[request.dayPart].label} — стол доступен`,
        kind: 'match',
      });
    } else {
      return null;
    }
  }

  // ——— Повод ———
  if (request.occasion) {
    const profile = OCCASION_PROFILE[request.occasion];
    const tagHits = venue.tags.filter((tag) =>
      profile.tags.some((needle) => tag.toLowerCase().includes(needle.toLowerCase())),
    ).length;
    const amenityHits = profile.amenities.filter((amenity) =>
      venue.amenities.includes(amenity),
    ).length;
    const categoryHit = profile.categories.includes(venue.categoryId);

    const impact = Math.min(16, tagHits * 5 + amenityHits * 3 + (categoryHit ? 6 : 0));
    if (impact > 0) {
      score += impact;
      factors.push({
        key: 'occasion',
        label: 'Повод',
        impact,
        reason: `Подходит для ${profile.label}`,
        kind: 'match',
      });
    }
  }

  // ——— Атмосфера ———
  if (request.vibes?.length) {
    const needles = request.vibes.flatMap((vibe) => VIBE_TAGS[vibe]);
    const hits = venue.tags.filter((tag) =>
      needles.some((needle) => tag.toLowerCase().includes(needle.toLowerCase())),
    );
    if (hits.length) {
      const impact = Math.min(10, hits.length * 4);
      score += impact;
      factors.push({
        key: 'vibe',
        label: 'Атмосфера',
        impact,
        reason: `Совпало по настроению: ${hits.slice(0, 3).join(', ')}`,
        kind: 'bonus',
      });
    }
  }

  // ——— Качество и выгода: работают всегда ———
  const ratingImpact = Math.round((venue.rating.score - 4) * 14);
  if (ratingImpact > 0) {
    score += ratingImpact;
    factors.push({
      key: 'rating',
      label: 'Оценки гостей',
      impact: ratingImpact,
      reason: `Рейтинг ${venue.rating.score.toFixed(1).replace('.', ',')} на основе ${venue.rating.count} отзывов`,
      kind: 'bonus',
    });
  }

  if (venue.promotion) {
    score += 6;
    factors.push({
      key: 'promo',
      label: 'Акция',
      impact: 6,
      reason: `${venue.promotion.title} — экономия до ${venue.promotion.discountPercent}%`,
      kind: 'bonus',
    });
  }

  if ((venue.distanceKm ?? 99) <= 2.5) {
    score += 4;
    factors.push({
      key: 'distance',
      label: 'Рядом',
      impact: 4,
      reason: `Всего ${(venue.distanceKm ?? 0).toFixed(1).replace('.', ',')} км от вас`,
      kind: 'bonus',
    });
  }

  return {
    venue,
    score,
    factors: factors.sort((a, b) => b.impact - a.impact),
    caveats,
  };
}

function buildSummary(scored: ScoredVenue, request: AIRecommendationRequest) {
  // Причины не переводим в нижний регистр — в них есть имена собственные
  // («Итальянская», «Золотой квадрат»), которые иначе выглядят как опечатка.
  const top = scored.factors.slice(0, 2).map((factor) => factor.reason);
  if (top.length === 0) {
    return `Хороший вариант с рейтингом ${scored.venue.rating.score.toFixed(1).replace('.', ',')}`;
  }
  const guests = request.guests ?? 2;
  const total = scored.venue.averagePrice * guests;
  return `${top.join('. ')}. Ориентировочно ${formatPrice(total)} на компанию.`;
}

function buildHeadline(count: number, request: AIRecommendationRequest) {
  const parts: string[] = [];
  if (request.guests) parts.push(`для ${formatGuests(request.guests)}`);
  if (request.centerOnly) parts.push('в центре');
  else if (request.districtIds?.length === 1) {
    parts.push(`в районе «${DISTRICT_BY_ID.get(request.districtIds[0])?.name ?? ''}»`);
  }
  if (request.budgetPerPerson) parts.push(`до ${formatPrice(request.budgetPerPerson)} на человека`);
  if (request.dayPart) parts.push(DAY_PART_WINDOWS[request.dayPart].label);

  const tail = parts.length ? ` ${parts.join(', ')}` : '';
  return `Нашли ${count} ${plural(count, 'место', 'места', 'мест')}${tail}`;
}

function buildTips(request: AIRecommendationRequest, count: number): string[] {
  const tips: string[] = [];
  if (count < 3) {
    tips.push('Расширьте бюджет или район — покажем больше подходящих вариантов');
  }
  if (!request.budgetPerPerson) {
    tips.push('Укажите бюджет на человека — подберём точнее по цене');
  }
  if (!request.occasion) {
    tips.push('Расскажите про повод: для свидания и для банкета подходят разные места');
  }
  if (request.guests && request.guests >= 8) {
    tips.push('Для компании от 8 человек бронируйте минимум за 2 дня — столы разбирают быстро');
  }
  if (request.dayPart === 'evening') {
    tips.push('Вечер пятницы — самое загруженное время, подтвердите бронь заранее');
  }
  return tips.slice(0, 3);
}

export interface RecommendOptions {
  limit?: number;
  /** Дата, на которую проверяется расписание. */
  date?: Date;
}

export function recommend(
  request: AIRecommendationRequest,
  options: RecommendOptions = {},
): AIRecommendationResult {
  const startedAt = Date.now();
  const limit = options.limit ?? 6;
  const date = options.date ?? DEMO_TODAY;

  // Свободный текст дополняет явно заданные поля, не перетирая их.
  const parsed = request.freeText ? parseFreeText(request.freeText) : {};
  const merged: AIRecommendationRequest = { ...parsed, ...stripUndefined(request) };

  const items = db.venues
    .filter((venue) => venue.status === 'published')
    .map((venue) =>
      toVenueListItem(
        venue,
        Number(distanceKm(DEMO_USER_LOCATION, venue.location.coordinates).toFixed(2)),
      ),
    );

  const scored = items
    .map((venue) => scoreVenue(venue, merged, date))
    .filter((entry): entry is ScoredVenue => entry !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const guests = merged.guests ?? 2;
  const bestScore = scored[0]?.score ?? 1;

  const recommendations: AIRecommendation[] = scored.map((entry) => ({
    venue: entry.venue,
    // Нормализуем относительно лучшего результата, но держим потолок в 99%,
    // чтобы не обещать «идеальное совпадение».
    matchScore: Math.max(
      52,
      Math.min(99, Math.round((entry.score / Math.max(bestScore, MAX_SCORE * 0.6)) * 96)),
    ),
    summary: buildSummary(entry, merged),
    factors: entry.factors,
    caveats: entry.caveats,
    estimatedTotal: entry.venue.averagePrice * guests,
  }));

  return {
    id: `ai-${Date.now().toString(36)}`,
    request: merged,
    recommendations,
    headline: buildHeadline(recommendations.length, merged),
    tips: buildTips(merged, recommendations.length),
    elapsedMs: Date.now() - startedAt,
    engine: 'mock',
    createdAt: new Date().toISOString(),
  };
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null),
  ) as Partial<T>;
}
