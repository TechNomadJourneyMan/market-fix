import { fail, ok } from '@/server/api-helpers';
import { DEMO_USER_ID } from '@/data/db';
import { getFavoriteVenueIds, toggleFavorite } from '@/server/repositories/users';

/** GET /api/favorites — id избранных заведений текущего пользователя. */
export async function GET() {
  return ok({ venueIds: getFavoriteVenueIds(DEMO_USER_ID) });
}

/** POST /api/favorites — переключить избранное. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { venueId?: string } | null;
  if (!body?.venueId) return fail('MISSING_VENUE', 'Не указано заведение');

  const result = toggleFavorite(DEMO_USER_ID, body.venueId);
  return ok({ ...result, venueIds: getFavoriteVenueIds(DEMO_USER_ID) });
}
