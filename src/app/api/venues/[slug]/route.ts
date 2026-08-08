import { notFound, ok } from '@/server/api-helpers';
import {
  getSimilarVenues,
  getVenueBySlug,
  getVenueMenu,
  getVenueProducts,
  getVenueServices,
} from '@/server/repositories/venues';
import { getVenueReviews } from '@/server/repositories/reviews';

/** GET /api/venues/{slug} — полная карточка заведения со всем контентом. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const venue = getVenueBySlug(slug);
  if (!venue) return notFound('Заведение не найдено');

  return ok({
    venue,
    services: getVenueServices(venue.id),
    menu: getVenueMenu(venue.id),
    products: getVenueProducts(venue.id),
    reviews: getVenueReviews({ venueId: venue.id, limit: 6 }),
    similar: getSimilarVenues(venue),
  });
}
