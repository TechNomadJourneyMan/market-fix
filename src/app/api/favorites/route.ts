import { fail, ok } from '@/server/api-helpers';
import { DEMO_USER_ID } from '@/data/db';
import { getSessionUser } from '@/lib/auth';
import { getFavoriteVenueIds, toggleFavorite } from '@/server/repositories/users';

async function resolveUserId() {
  const sessionUser = await getSessionUser();
  return sessionUser?.id ?? DEMO_USER_ID;
}

/** GET /api/favorites — id избранных заведений текущего пользователя. */
export async function GET() {
  const userId = await resolveUserId();
  return ok({ venueIds: getFavoriteVenueIds(userId) });
}

/** POST /api/favorites — переключить избранное. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { venueId?: string } | null;
  if (!body?.venueId) return fail('MISSING_VENUE', 'Не указано заведение');

  const userId = await resolveUserId();
  const result = toggleFavorite(userId, body.venueId);
  return ok({ ...result, venueIds: getFavoriteVenueIds(userId) });
}
