import type { Review, ReviewSort } from '@/types';
import { db } from '@/data/db';

export interface ReviewQuery {
  venueId: string;
  sort?: ReviewSort;
  rating?: number;
  withPhotos?: boolean;
  occasion?: Review['occasion'];
  limit?: number;
  offset?: number;
}

export function getVenueReviews(query: ReviewQuery) {
  let items = db.reviews.filter(
    (review) => review.venueId === query.venueId && review.isPublished !== false,
  );

  if (query.rating) items = items.filter((review) => review.rating === query.rating);
  if (query.withPhotos) items = items.filter((review) => review.photos.length > 0);
  if (query.occasion) items = items.filter((review) => review.occasion === query.occasion);

  const sorted = sortReviews(items, query.sort ?? 'recent');
  const offset = query.offset ?? 0;
  const limit = query.limit ?? 6;

  return {
    items: sorted.slice(offset, offset + limit),
    total: sorted.length,
    hasMore: offset + limit < sorted.length,
  };
}

function sortReviews(reviews: Review[], sort: ReviewSort) {
  const sorted = [...reviews];
  switch (sort) {
    case 'helpful':
      sorted.sort((a, b) => b.likes - a.likes);
      break;
    case 'rating_desc':
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case 'rating_asc':
      sorted.sort((a, b) => a.rating - b.rating);
      break;
    case 'recent':
    default:
      sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
  }
  return sorted;
}

/** Отзывы с фотографиями — для ленты «Гости говорят» на главной. */
export function getShowcaseReviews(limit = 6): (Review & { venueSlug: string; venueName: string })[] {
  const venueById = new Map(db.venues.map((venue) => [venue.id, venue]));
  return db.reviews
    .filter((review) => review.rating >= 5 && review.text.length > 160)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, limit)
    .map((review) => {
      const venue = venueById.get(review.venueId);
      return {
        ...review,
        venueSlug: venue?.slug ?? '',
        venueName: venue?.name ?? '',
      };
    });
}

export function getBusinessReviews(businessId: string, limit = 20) {
  const venueIds = new Set(
    db.venues.filter((venue) => venue.businessId === businessId).map((venue) => venue.id),
  );
  const venueById = new Map(db.venues.map((venue) => [venue.id, venue]));

  return db.reviews
    .filter((review) => venueIds.has(review.venueId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map((review) => ({
      ...review,
      venueName: venueById.get(review.venueId)?.name ?? '',
      venueSlug: venueById.get(review.venueId)?.slug ?? '',
    }));
}

export function getTotalReviewCount() {
  return db.reviews.length;
}
