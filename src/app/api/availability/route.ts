import { fail, ok } from '@/server/api-helpers';
import { getAvailability, getAvailabilityRange } from '@/server/repositories/bookings';

/**
 * GET /api/availability?venueId=&date= — слоты на дату.
 * Без date возвращает ближайшие 14 дней с количеством свободных слотов.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const venueId = url.searchParams.get('venueId');
  const date = url.searchParams.get('date');

  if (!venueId) return fail('MISSING_VENUE', 'Не указано заведение');

  if (!date) {
    return ok({ days: getAvailabilityRange(venueId) });
  }

  return ok(getAvailability(venueId, date));
}
