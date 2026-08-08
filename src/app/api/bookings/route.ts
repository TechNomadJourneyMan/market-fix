import { failFromZod, fail, ok } from '@/server/api-helpers';
import { createBookingSchema } from '@/lib/validation';
import { createBooking } from '@/server/repositories/bookings';
import { DEMO_USER_ID } from '@/data/db';

/** POST /api/bookings — создание брони. */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail('BAD_JSON', 'Не удалось прочитать запрос');
  }

  const parsed = createBookingSchema.safeParse(payload);
  if (!parsed.success) return failFromZod(parsed.error);

  try {
    const result = createBooking(parsed.data, DEMO_USER_ID);
    return ok(
      {
        booking: result.booking,
        requiresPayment: result.requiresPayment,
        // Куда вести пользователя дальше — решает сервер, клиент просто переходит.
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
