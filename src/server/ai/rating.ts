import type {
  EditorialRatingOverride,
  RatingConfidence,
  RatingFactorKey,
  RatingFactorScore,
  RatingLayers,
  RatingSnapshot,
  Review,
  Venue,
} from '@/types';
import { createId } from '@/lib/utils';
import { isReviewPubliclyVisible } from './moderate';

const RATING_VERSION = 'mf-rating-v1';
const BAYESIAN_M = 12;

const FACTOR_META: {
  key: RatingFactorKey;
  label: string;
  weight: number;
}[] = [
  { key: 'food', label: 'Еда / качество', weight: 0.22 },
  { key: 'service', label: 'Обслуживание', weight: 0.18 },
  { key: 'value', label: 'Цена / качество', weight: 0.14 },
  { key: 'atmosphere', label: 'Атмосфера', weight: 0.12 },
  { key: 'cleanliness', label: 'Чистота', weight: 0.1 },
  { key: 'location', label: 'Локация', weight: 0.06 },
  { key: 'booking', label: 'Бронирование', weight: 0.08 },
  { key: 'reliability', label: 'Надёжность', weight: 0.05 },
  { key: 'review_quality', label: 'Качество отзывов', weight: 0.05 },
];

function starsToTen(stars: number) {
  return (stars / 5) * 10;
}

function clamp10(value: number) {
  return Math.max(0, Math.min(10, Number(value.toFixed(2))));
}

function bayesianAdjust(raw: number, count: number, prior: number) {
  return (count / (count + BAYESIAN_M)) * raw + (BAYESIAN_M / (count + BAYESIAN_M)) * prior;
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function confidenceFor(count: number, authenticityAvg: number): RatingConfidence {
  if (count < 3) return 'insufficient';
  if (count >= 40 && authenticityAvg >= 0.6) return 'high';
  if (count >= 12) return 'medium';
  return 'low';
}

function reviewWeight(review: Review): number {
  const authenticity = review.analysis?.scores.authenticity ?? 0.55;
  const relevance = review.analysis?.scores.relevance ?? 0.55;
  const objectivity = review.analysis?.scores.objectivity ?? 0.5;
  const spamPenalty = review.analysis?.scores.spam ?? 0;
  return Math.max(0.05, authenticity * 0.45 + relevance * 0.35 + objectivity * 0.2 - spamPenalty * 0.4);
}

function eligibleReviews(reviews: Review[]) {
  return reviews.filter((review) => {
    if (review.provenance && review.provenance.canScore === false) return false;
    const level = review.moderationStatus ?? review.analysis?.moderationLevel;
    if (!level) return review.isPublished !== false;
    // Pending human review still participates with reduced weight.
    if (level === 'needs_human_review') return true;
    if (!isReviewPubliclyVisible(level)) return false;
    return review.isPublished !== false;
  });
}

function valueScore(venue: Venue, qualityProxy: number, segmentAvgPrice: number) {
  // Higher quality at lower relative price → higher value. Expensive ≠ better.
  const priceRatio = venue.averagePrice / Math.max(segmentAvgPrice, 1);
  const valueRaw = qualityProxy - Math.max(0, priceRatio - 1) * 2.2 + Math.max(0, 1 - priceRatio) * 1.4;
  return clamp10(valueRaw);
}

function buildExplanation(factors: RatingFactorScore[], finalScore: number, venue: Venue): string {
  const sorted = [...factors].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const weak = sorted[sorted.length - 1];
  const value = factors.find((item) => item.key === 'value');
  const parts = [
    `Итоговый рейтинг ${finalScore.toFixed(1)}/10 для «${venue.name}».`,
    `Сильная сторона — ${top.label.toLowerCase()} (${top.score.toFixed(1)}).`,
  ];
  if (weak && weak.score <= 7.2) {
    parts.push(`Основной фактор снижения — ${weak.label.toLowerCase()} (${weak.score.toFixed(1)}).`);
  }
  if (value && value.score < 7) {
    parts.push('Цена относительно сегмента завышена при сопоставимом качестве.');
  } else if (value && value.score >= 8.5) {
    parts.push('Хорошее соотношение цены и качества в сегменте.');
  }
  return parts.join(' ');
}

export function computeVenueRating(input: {
  venue: Venue;
  reviews: Review[];
  allVenues: Venue[];
  bookingStats?: { completed: number; cancelled: number; noShow: number };
  override?: EditorialRatingOverride | null;
}): RatingSnapshot {
  const { venue, reviews, allVenues, bookingStats, override } = input;
  const usable = eligibleReviews(reviews.filter((item) => item.venueId === venue.id));

  const segment = allVenues.filter(
    (item) =>
      item.categoryId === venue.categoryId &&
      item.priceLevel === venue.priceLevel &&
      item.location.districtId === venue.location.districtId,
  );
  const segmentAvgPrice = avg(segment.map((item) => item.averagePrice)) || venue.averagePrice;
  const prior =
    avg(allVenues.map((item) => starsToTen(item.rating.score))) || 7.4;

  const weightedStars: number[] = [];
  const food: number[] = [];
  const service: number[] = [];
  const atmosphere: number[] = [];
  const price: number[] = [];
  const authenticity: number[] = [];
  const cleanlinessProxy: number[] = [];
  const locationProxy: number[] = [];
  const bookingProxy: number[] = [];

  for (const review of usable) {
    const weight =
      review.moderationStatus === 'needs_human_review'
        ? reviewWeight(review) * 0.35
        : reviewWeight(review);
    weightedStars.push(starsToTen(review.rating) * weight);
    food.push(starsToTen(review.ratings.food) * weight);
    service.push(starsToTen(review.ratings.service) * weight);
    atmosphere.push(starsToTen(review.ratings.atmosphere) * weight);
    price.push(starsToTen(review.ratings.price) * weight);
    authenticity.push(review.analysis?.scores.authenticity ?? 0.55);
    if (review.analysis?.topics.includes('cleanliness')) {
      cleanlinessProxy.push(starsToTen(review.rating) * weight);
    }
    if (review.analysis?.topics.includes('location')) {
      locationProxy.push(starsToTen(review.rating) * weight);
    }
    if (review.analysis?.topics.includes('booking')) {
      bookingProxy.push(starsToTen(review.rating) * weight);
    }
  }

  const weightSum = usable.reduce((sum, review) => sum + reviewWeight(review), 0) || 1;
  const rawScore = clamp10(
    usable.length
      ? weightedStars.reduce((sum, value) => sum + value, 0) / weightSum
      : starsToTen(venue.rating.score),
  );

  const foodScore = clamp10(
    usable.length ? food.reduce((sum, value) => sum + value, 0) / weightSum : rawScore,
  );
  const serviceScore = clamp10(
    usable.length ? service.reduce((sum, value) => sum + value, 0) / weightSum : rawScore,
  );
  const atmosphereScore = clamp10(
    usable.length ? atmosphere.reduce((sum, value) => sum + value, 0) / weightSum : rawScore,
  );
  const qualityProxy = (foodScore + serviceScore) / 2;
  const valueFactor = valueScore(venue, qualityProxy, segmentAvgPrice);

  const completed = bookingStats?.completed ?? Math.max(1, Math.round(venue.stats.bookings30d * 0.7));
  const cancelled = bookingStats?.cancelled ?? Math.round(venue.stats.bookings30d * 0.08);
  const noShow = bookingStats?.noShow ?? Math.round(venue.stats.bookings30d * 0.03);
  const reliability = clamp10(10 - ((cancelled + noShow) / Math.max(completed + cancelled + noShow, 1)) * 18);

  const reviewQuality = clamp10(avg(authenticity) * 10 || 6.5);
  const cleanliness = clamp10(
    cleanlinessProxy.length
      ? cleanlinessProxy.reduce((sum, value) => sum + value, 0) / Math.max(cleanlinessProxy.length, 1)
      : atmosphereScore * 0.95,
  );
  const locationScore = clamp10(
    locationProxy.length
      ? locationProxy.reduce((sum, value) => sum + value, 0) / Math.max(locationProxy.length, 1)
      : 7.2 + (venue.location.districtId.includes('medeu') || venue.location.districtId.includes('gold') ? 0.6 : 0),
  );
  const bookingScore = clamp10(
    bookingProxy.length
      ? bookingProxy.reduce((sum, value) => sum + value, 0) / Math.max(bookingProxy.length, 1)
      : 7.5 + reliability * 0.15,
  );

  const factorValues: Record<RatingFactorKey, number> = {
    food: foodScore,
    service: serviceScore,
    value: valueFactor,
    atmosphere: atmosphereScore,
    cleanliness,
    location: locationScore,
    booking: bookingScore,
    reliability,
    review_quality: reviewQuality,
  };

  const factors: RatingFactorScore[] = FACTOR_META.map((meta) => ({
    key: meta.key,
    label: meta.label,
    weight: meta.weight,
    score: factorValues[meta.key],
    sampleSize: usable.length,
    explanation: `${meta.label}: ${factorValues[meta.key].toFixed(1)}/10`,
  }));

  const aiInterpretation = clamp10(
    factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0),
  );
  const scoring = clamp10(bayesianAdjust(aiInterpretation, usable.length, prior));
  const editorial = override?.delta ?? 0;
  const finalScore = clamp10(scoring + editorial);

  const layers: RatingLayers = {
    rawScore,
    aiInterpretation,
    scoring,
    editorialOverride: editorial,
    finalScore,
  };

  const now = new Date().toISOString();
  return {
    id: createId('rating'),
    venueId: venue.id,
    layers,
    factors,
    confidence: confidenceFor(usable.length, avg(authenticity) || 0.5),
    explanation: buildExplanation(factors, finalScore, venue),
    reviewCountUsed: usable.length,
    version: RATING_VERSION,
    computedAt: now,
    overrideReason: override?.reason,
    overriddenBy: override?.createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

/** Convert 0–10 engine score to legacy 0–5 card score. */
export function tenToStars(score10: number) {
  return Number((score10 / 2).toFixed(2));
}
