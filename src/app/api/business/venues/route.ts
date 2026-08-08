import { fail, failFromZod, ok } from '@/server/api-helpers';
import { createVenueSchema } from '@/lib/validation';
import { createVenue, getCurrentBusiness } from '@/server/repositories/business';
import type { VenueAmenity } from '@/types';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail('INVALID_JSON', 'Некорректный JSON');
  }

  const parsed = createVenueSchema.safeParse(body);
  if (!parsed.success) {
    return failFromZod(parsed.error);
  }

  const business = getCurrentBusiness();
  const venue = createVenue(business.id, {
    ...parsed.data,
    amenities: parsed.data.amenities as VenueAmenity[] | undefined,
  });

  return ok({ venue, slug: venue.slug }, { status: 201 });
}
