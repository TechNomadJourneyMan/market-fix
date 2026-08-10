import { fail, ok } from '@/server/api-helpers';
import { DEMO_USER_ID } from '@/data/db';
import { getSessionUser } from '@/lib/auth';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/server/repositories/users';

async function resolveUserId() {
  const sessionUser = await getSessionUser();
  return sessionUser?.id ?? DEMO_USER_ID;
}

/** GET /api/notifications */
export async function GET() {
  const userId = await resolveUserId();
  return ok({
    items: getNotifications(userId),
    unread: getUnreadNotificationCount(userId),
  });
}

/** POST /api/notifications — отметить прочитанным (одно или все). */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { id?: string; all?: boolean }
    | null;

  const userId = await resolveUserId();

  if (body?.all) {
    markAllNotificationsRead(userId);
    return ok({ unread: 0 });
  }

  if (!body?.id) return fail('MISSING_ID', 'Не указано уведомление');

  markNotificationRead(body.id);
  return ok({ unread: getUnreadNotificationCount(userId) });
}
