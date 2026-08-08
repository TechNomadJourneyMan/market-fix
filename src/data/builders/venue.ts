import type { Venue, VenuePhoto, VenueRating, VenueTable } from '@/types';
import { clamp, createRandom, hashString } from '@/lib/utils';
import { DISTRICT_BY_ID, DEFAULT_CITY_ID, CITIES } from '../seed/geo';
import { buildWorkingHours } from '../seed/hours';
import type { VenueSeed } from '../seed/venue-seeds';

const NOW = '2026-01-10T09:00:00.000Z';
const CITY_NAME = CITIES[0].name;

const PHOTO_TAG_LABELS: Record<string, string> = {
  interior: 'интерьер',
  food: 'блюда',
  exterior: 'фасад и терраса',
  event: 'мероприятия',
  other: 'фото',
};

function buildPhotos(seed: VenueSeed): VenuePhoto[] {
  const random = createRandom(hashString(seed.slug));
  const tags = seed.photoTags ?? ['interior', 'food', 'exterior', 'event'];
  // 8 фото на заведение — достаточно для большой галереи на детальной странице.
  return Array.from({ length: 8 }, (_, index) => {
    const tag = tags[index % tags.length];
    const isWide = index === 0 || random() > 0.65;
    return {
      id: `${seed.slug}-photo-${index + 1}`,
      url: `/api/photo/${seed.slug}-${index + 1}/${isWide ? 1200 : 800}/${isWide ? 800 : 800}`,
      alt: `${seed.name} — ${PHOTO_TAG_LABELS[tag]}`,
      tag,
      width: isWide ? 1200 : 800,
      height: 800,
    };
  });
}

/**
 * Разбивка и гистограмма выводятся из средней оценки:
 * чем выше средняя, тем сильнее смещение к пятёркам.
 */
function buildRating(seed: VenueSeed): VenueRating {
  const random = createRandom(hashString(`${seed.slug}-rating`));
  const jitter = (spread: number) => (random() - 0.5) * spread;

  const breakdown = {
    food: clamp(seed.ratingScore + jitter(0.35), 3.4, 5),
    service: clamp(seed.ratingScore + jitter(0.5), 3.2, 5),
    atmosphere: clamp(seed.ratingScore + jitter(0.3), 3.5, 5),
    price: clamp(seed.ratingScore + jitter(0.7) - 0.15, 3, 5),
  };

  // Вес каждой звезды: пик у оценки, близкой к средней.
  const weights: Record<string, number> = {};
  let totalWeight = 0;
  ([5, 4, 3, 2, 1] as const).forEach((star) => {
    const distance = Math.abs(seed.ratingScore - star);
    const weight = Math.exp(-(distance ** 2) * 2.4) + 0.012;
    weights[String(star)] = weight;
    totalWeight += weight;
  });

  const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } as VenueRating['distribution'];
  let assigned = 0;
  ([4, 3, 2, 1] as const).forEach((star) => {
    const count = Math.round((weights[String(star)] / totalWeight) * seed.ratingCount);
    distribution[String(star) as keyof VenueRating['distribution']] = count;
    assigned += count;
  });
  distribution['5'] = Math.max(0, seed.ratingCount - assigned);

  return {
    score: Number(seed.ratingScore.toFixed(1)),
    count: seed.ratingCount,
    breakdown: {
      food: Number(breakdown.food.toFixed(1)),
      service: Number(breakdown.service.toFixed(1)),
      atmosphere: Number(breakdown.atmosphere.toFixed(1)),
      price: Number(breakdown.price.toFixed(1)),
    },
    distribution,
  };
}

function buildTables(seed: VenueSeed): VenueTable[] {
  const random = createRandom(hashString(`${seed.slug}-tables`));
  const tables: VenueTable[] = [];
  let remaining = seed.capacity;
  let index = 1;

  const zones: VenueTable['zone'][] = ['main'];
  if (seed.amenities.includes('terrace')) zones.push('terrace');
  if (seed.amenities.includes('vip')) zones.push('vip');
  if (seed.amenities.includes('music') || seed.amenities.includes('sports_broadcast')) {
    zones.push('bar');
  }

  while (remaining > 0 && index <= 40) {
    const zone = zones[index % zones.length];
    const seats = zone === 'vip' ? 8 + Math.floor(random() * 8) : 2 + Math.floor(random() * 6);
    tables.push({
      id: `${seed.slug}-table-${index}`,
      name: `${zone === 'vip' ? 'VIP' : zone === 'terrace' ? 'Терраса' : zone === 'bar' ? 'Бар' : 'Стол'} ${index}`,
      seats: Math.min(seats, remaining),
      zone,
    });
    remaining -= seats;
    index += 1;
  }
  return tables;
}

/** Популярность — композит рейтинга, объёма отзывов и «премиальности». */
function computePopularity(seed: VenueSeed) {
  const ratingWeight = (seed.ratingScore / 5) * 55;
  const volumeWeight = Math.min(seed.ratingCount / 650, 1) * 30;
  const featuredWeight = seed.isFeatured ? 10 : 0;
  const promoWeight = seed.promotion ? 5 : 0;
  return Number((ratingWeight + volumeWeight + featuredWeight + promoWeight).toFixed(1));
}

function buildStats(seed: VenueSeed, popularityScore: number) {
  const random = createRandom(hashString(`${seed.slug}-stats`));
  const views30d = Math.round(900 + popularityScore * 62 + random() * 1800);
  const conversionRate = Number((0.03 + (popularityScore / 100) * 0.09 + random() * 0.02).toFixed(4));
  const bookings30d = Math.max(6, Math.round(views30d * conversionRate));
  const averageCheck = Math.round(seed.averagePrice * (2.1 + random() * 1.4));
  return {
    views30d,
    bookings30d,
    favorites: Math.round(views30d * (0.05 + random() * 0.06)),
    conversionRate,
    averageCheck,
    revenue30d: bookings30d * averageCheck,
  };
}

export function buildVenue(seed: VenueSeed, businessId: string): Venue {
  const district = DISTRICT_BY_ID.get(seed.districtId);
  const popularityScore = computePopularity(seed);
  const photos = buildPhotos(seed);

  return {
    id: `venue-${seed.slug}`,
    slug: seed.slug,
    name: seed.name,
    tagline: seed.tagline,
    description: seed.description,
    businessId,
    categoryId: seed.categoryId,
    cuisineIds: seed.cuisineIds,
    location: {
      coordinates: seed.coordinates,
      address: seed.address,
      cityId: DEFAULT_CITY_ID,
      cityName: CITY_NAME,
      districtId: seed.districtId,
      districtName: district?.name ?? 'Алматы',
      landmark: seed.landmark,
      metro: undefined,
    },
    photos,
    coverImage: photos[0].url,
    rating: buildRating(seed),
    priceLevel: seed.priceLevel,
    averagePrice: seed.averagePrice,
    capacity: seed.capacity,
    tables: buildTables(seed),
    amenities: seed.amenities,
    workingHours: buildWorkingHours(seed.hoursProfile),
    phone: seed.phone ?? buildPhone(seed.slug),
    email: `hello@${seed.slug.replace(/-/g, '')}.kz`,
    website: seed.website ?? `https://${seed.slug.replace(/-/g, '')}.kz`,
    instagram: seed.instagram ?? `@${seed.slug.replace(/-/g, '_')}`,
    promotion: seed.promotion
      ? {
          id: `promo-${seed.slug}`,
          ...seed.promotion,
          validUntil: '2026-12-31',
        }
      : undefined,
    isVerified: true,
    isFeatured: Boolean(seed.isFeatured),
    status: 'published',
    popularityScore,
    stats: buildStats(seed, popularityScore),
    tags: seed.tags,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function buildPhone(slug: string) {
  const random = createRandom(hashString(`${slug}-phone`));
  const part = (length: number) =>
    Array.from({ length }, () => Math.floor(random() * 10)).join('');
  return `+7 7${part(2)} ${part(3)} ${part(2)} ${part(2)}`;
}
