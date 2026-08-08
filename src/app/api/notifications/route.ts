import { fail, ok } from '@/server/api-helpers';
import { DEMO_USER_ID } from '@/data/db';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/server/repositories/users';

/** GET /api/notifications */
export async function GET() {
  return ok({
    items: getNotifications(DEMO_USER_ID),
    unread: getUnreadNotificationCount(DEMO_USER_ID),
  });
}

/** POST /api/notifications — отметить прочитанным (одно или все). */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { id?: string; all?: boolean }
    | null;

  if (body?.all) {
    markAllNotificationsRead(DEMO_USER_ID);
    return ok({ unread: 0 });
  }

  if (!body?.id) return fail('MISSING_ID', 'Не указано уведомление');

  markNotificationRead(body.id);
  return ok({ unread: getUnreadNotificationCount(DEMO_USER_ID) });
}
