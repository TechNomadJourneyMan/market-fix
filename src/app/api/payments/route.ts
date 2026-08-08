import { fail, failFromZod, ok } from '@/server/api-helpers';
import { paymentSchema } from '@/lib/validation';
import { createDemoPayment } from '@/server/repositories/payments';
import { sleep } from '@/lib/utils';

/**
 * POST /api/payments — демо-оплата.
 * Реальный эквайринг не вызывается: платёж всегда успешен и помечен isDemo.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail('BAD_JSON', 'Не удалось прочитать запрос');
  }

  const parsed = paymentSchema.safeParse(payload);
  if (!parsed.success) return failFromZod(parsed.error);

  // Имитация обращения к платёжному шлюзу.
  await sleep(1100);

  const payment = createDemoPayment(parsed.data.bookingId, parsed.data.method);
  if (!payment) return fail('BOOKING_NOT_FOUND', 'Бронь не найдена', 404);

  return ok({
    payment,
    // Заглушка из ТЗ — показывается на экране успеха.
    notice: 'Эквайринг будет подключен позже',
    nextHref: `/booking/${parsed.data.bookingId}/success`,
  });
}
