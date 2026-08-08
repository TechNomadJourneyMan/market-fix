import { fail, failFromZod, ok } from '@/server/api-helpers';
import { aiRequestSchema } from '@/lib/validation';
import { recommend } from '@/server/ai/recommend';
import { sleep } from '@/lib/utils';

/**
 * POST /api/ai/recommend — демонстрационный AI-подбор.
 *
 * Движок mock-логический (см. src/server/ai/recommend.ts).
 * Контракт эндпоинта не изменится при подключении OpenAI —
 * поменяется только реализация recommend().
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail('BAD_JSON', 'Не удалось прочитать запрос');
  }

  const parsed = aiRequestSchema.safeParse(payload);
  if (!parsed.success) return failFromZod(parsed.error);

  // Небольшая задержка делает «размышление» ассистента правдоподобным.
  await sleep(650);

  return ok(recommend(parsed.data, { limit: 6 }));
}
