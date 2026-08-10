import { failFromZod, fail, ok } from '@/server/api-helpers';
import { createBookingSchema } from '@/lib/validation';
import { createBooking } from '@/server/repositories/bookings';
import { getSessionUser } from '@/lib/auth';

/** POST /api/bookings — создание брони для текущего пользователя сессии. */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail('BAD_JSON', 'Не удалось прочитать запрос');
  }

  const parsed = createBookingSchema.safeParse(payload);
  if (!parsed.success) return failFromZod(parsed.error);

  const sessionUser = await getSessionUser();

  try {
    const result = createBooking(parsed.data, sessionUser?.id ?? null);
    return ok(
      {
        booking: result.booking,
        requiresPayment: result.requiresPayment,
        nextHref: result.requiresPayment
          ? `/checkout/${result.booking.id}`
          : `/booking/${result.booking.id}/success`,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'VENUE_NOT_FOUND') {
      return fail('VENUE_NOT_FOUND', 'Заведение не найдено', 404);
    }
    return fail('INTERNAL_ERROR', 'Не удалось создать бронь. Попробуйте ещё раз', 500);
  }
}
