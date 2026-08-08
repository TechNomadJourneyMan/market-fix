import { fail, ok } from '@/server/api-helpers';
import {
  getMergeRoom,
  getMergeShortlist,
  sendMergeChat,
  updateMergePreferences,
  voteMergeVenue,
} from '@/server/repositories/merge';
import type { MergePreferences } from '@/types';

function serialize(code: string) {
  const room = getMergeRoom(code);
  if (!room) return null;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return {
    room,
    shortlist: getMergeShortlist(room),
    shareUrl: `${site}/merge/${room.code}`,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const data = serialize(code);
  if (!data) return fail('NOT_FOUND', 'Комната не найдена', 404);
  return ok(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  let body: {
    action?: string;
    participantId?: string;
    text?: string;
    venueId?: string;
    preferences?: MergePreferences;
  };

  try {
    body = await request.json();
  } catch {
    return fail('INVALID_JSON', 'Некорректный JSON');
  }

  if (!body.participantId) {
    return fail('VALIDATION_ERROR', 'Нужен participantId');
  }

  if (body.action === 'chat') {
    const room = sendMergeChat(code, body.participantId, body.text ?? '');
    if (!room) return fail('NOT_FOUND', 'Не удалось отправить сообщение', 404);
    return ok(serialize(code));
  }

  if (body.action === 'vote') {
    if (!body.venueId) return fail('VALIDATION_ERROR', 'Укажите venueId');
    const room = voteMergeVenue(code, body.participantId, body.venueId);
    if (!room) return fail('NOT_FOUND', 'Не удалось проголосовать', 404);
    return ok(serialize(code));
  }

  if (body.action === 'preferences') {
    if (!body.preferences) return fail('VALIDATION_ERROR', 'Укажите preferences');
    const room = await updateMergePreferences(code, body.participantId, body.preferences);
    if (!room) return fail('NOT_FOUND', 'Не удалось обновить предпочтения', 404);
    return ok(serialize(code));
  }

  return fail('VALIDATION_ERROR', 'Неизвестное действие');
}
