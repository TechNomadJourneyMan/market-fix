import { fail, notFound, ok } from '@/server/api-helpers';
import { getBookingById, updateBookingStatus } from '@/server/repositories/bookings';

/** GET /api/bookings/{id} */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const booking = getBookingById(id);
  if (!booking) return notFound('Бронь не найдена');
  return ok(booking);
}

/** PATCH /api/bookings/{id} — смена статуса (отмена гостем, подтверждение бизнесом). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { status?: string } | null;

  const allowed = ['confirmed', 'cancelled', 'completed', 'no_show', 'pending'];
  if (!body?.status || !allowed.includes(body.status)) {
    return fail('INVALID_STATUS', 'Неизвестный статус брони');
  }

  const booking = updateBookingStatus(id, body.status as never);
  if (!booking) return notFound('Бронь не найдена');
  return ok(booking);
}
