import { fail, failFromZod, ok } from '@/server/api-helpers';
import { mergeCreateSchema, mergeJoinSchema } from '@/lib/validation';
import {
  createMergeRoom,
  getMergeRoom,
  getMergeShortlist,
  joinMergeRoom,
} from '@/server/repositories/merge';

function serialize(roomCode: string) {
  const room = getMergeRoom(roomCode);
  if (!room) return null;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return {
    room,
    shortlist: getMergeShortlist(room),
    shareUrl: `${site}/merge/${room.code}`,
  };
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code');
  if (!code) return fail('VALIDATION_ERROR', 'Укажите код комнаты');
  const data = serialize(code);
  if (!data) return fail('NOT_FOUND', 'Комната не найдена', 404);
  return ok(data);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('INVALID_JSON', 'Некорректный JSON');
  }

  const action = String(body.action ?? 'create');

  if (action === 'join') {
    const parsed = mergeJoinSchema.safeParse(body);
    if (!parsed.success) return failFromZod(parsed.error);
    const result = joinMergeRoom(parsed.data.code.toUpperCase(), parsed.data.name);
    if (!result) return fail('NOT_FOUND', 'Комната не найдена или закрыта', 404);
    return ok({
      ...serialize(result.room.code),
      participantId: result.participant.id,
    });
  }

  const parsed = mergeCreateSchema.safeParse(body);
  if (!parsed.success) return failFromZod(parsed.error);

  const room = createMergeRoom(parsed.data);
  return ok(
    {
      ...serialize(room.code),
      participantId: room.hostId,
    },
    { status: 201 },
  );
}
