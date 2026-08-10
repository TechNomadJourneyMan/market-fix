import type { Entity, ID } from './common';
import type {
  ModerationLevel,
  ReviewAnalysis,
  ReviewProvenance,
  ReviewSource,
} from './moderation';

export interface ReviewAuthor {
  id: ID;
  name: string;
  avatar: string;
  /** Сколько всего отзывов оставил — повышает доверие. */
  reviewsCount: number;
  /** Значок «Проверенный гость» — бронировал через платформу. */
  isVerified: boolean;
}

export interface ReviewReply {
  id: ID;
  businessId: ID;
  businessName: string;
  text: string;
  createdAt: string;
}

export interface Review extends Entity {
  venueId: ID;
  author: ReviewAuthor;
  /** Общая оценка 1..5 */
  rating: number;
  /** Детальные оценки — усредняются в VenueRating.breakdown */
  ratings: {
    food: number;
    service: number;
    atmosphere: number;
    price: number;
  };
  title: string;
  text: string;
  photos: string[];
  /** Полезность отзыва — сортировка «сначала полезные». */
  likes: number;
  /** Повод визита — фильтр отзывов на детальной странице. */
  occasion?: 'date' | 'family' | 'business' | 'friends' | 'celebration' | 'solo';
  /** Ответ заведения. */
  reply?: ReviewReply;
  /** Бронь, к которой привязан отзыв (если был через платформу). */
  bookingId?: ID;
  /** Unified review engine fields */
  source?: ReviewSource;
  language?: string;
  provenance?: ReviewProvenance;
  moderationStatus?: ModerationLevel;
  analysis?: ReviewAnalysis;
  isPublished?: boolean;
}

export type ReviewSort = 'recent' | 'helpful' | 'rating_desc' | 'rating_asc';

export interface CreateReviewInput {
  venueId: ID;
  bookingId?: ID;
  rating: number;
  ratings?: {
    food?: number;
    service?: number;
    atmosphere?: number;
    price?: number;
  };
  title: string;
  text: string;
  photos?: string[];
  occasion?: Review['occasion'];
}
