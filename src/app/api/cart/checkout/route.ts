import { fail, ok } from '@/server/api-helpers';
import { createBooking } from '@/server/repositories/bookings';
import { getSessionUser } from '@/lib/auth';
import type { CreateBookingInput } from '@/types';
import { z } from 'zod';

const cartCheckoutSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  items: z
    .array(
      z.object({
        venueId: z.string(),
        date: z.string(),
        time: z.string(),
        guests: z.number().int().positive(),
        comment: z.string().optional(),
        extras: z
          .array(
            z.object({
              serviceId: z.string(),
              name: z.string(),
              price: z.number(),
              quantity: z.number().int().positive(),
            }),
          )
          .optional(),
      }),
    )
    .min(1),
});

/** Оформить все позиции корзины одной пачкой броней. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail('INVALID_JSON', 'Некорректный JSON');
  }

  const parsed = cartCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Проверьте данные корзины', 422);
  }

  try {
    const sessionUser = await getSessionUser();
    const results = parsed.data.items.map((item) => {
      const input: CreateBookingInput = {
        venueId: item.venueId,
        date: item.date,
        time: item.time,
        guests: item.guests,
        comment: item.comment,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email,
        extras: item.extras,
      };
      return createBooking(input, sessionUser?.id ?? null);
    });

    const bookings = results.map((result) => result.booking);
    const payable = results.find((result) => result.requiresPayment)?.booking ?? bookings[0];

    return ok({
      bookings,
      checkoutUrl: results.some((result) => result.requiresPayment)
        ? `/checkout/${payable.id}?batch=${bookings.map((b) => b.id).join(',')}`
        : `/booking/${payable.id}/success`,
    });
  } catch {
    return fail('BOOKING_FAILED', 'Не удалось создать одну из броней', 400);
  }
}
