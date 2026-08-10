import { fail, failFromZod, ok } from '@/server/api-helpers';
import { reviewSchema } from '@/lib/validation';
import { getSessionUser } from '@/lib/auth';
import { createGuestReview } from '@/server/repositories/admin';

/** POST /api/reviews — создать отзыв и прогнать через AI-модерацию. */
export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return fail('UNAUTHORIZED', 'Войдите, чтобы оставить отзыв', 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail('BAD_JSON', 'Не удалось прочитать запрос');
  }

  const parsed = reviewSchema.safeParse(payload);
  if (!parsed.success) return failFromZod(parsed.error);

  try {
    const review = createGuestReview(parsed.data, sessionUser);
    return ok(
      {
        review,
        moderationStatus: review.moderationStatus,
        published: review.isPublished,
        analysis: review.analysis,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'VENUE_NOT_FOUND') {
      return fail('VENUE_NOT_FOUND', 'Заведение не найдено', 404);
    }
    return fail('INTERNAL_ERROR', 'Не удалось сохранить отзыв', 500);
  }
}
