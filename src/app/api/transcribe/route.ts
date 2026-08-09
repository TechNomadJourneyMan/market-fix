import { fail, ok } from '@/server/api-helpers';
import { isWhisperConfigured, transcribeAudio, whisperStatus } from '@/server/ai/whisper';

/**
 * GET /api/transcribe — доступен ли Whisper на сервере.
 * POST /api/transcribe — multipart: file (+ optional language: ru|en|kk).
 */
export async function GET() {
  return ok(whisperStatus());
}

export async function POST(request: Request) {
  if (!isWhisperConfigured()) {
    return fail(
      'NOT_CONFIGURED',
      'Голосовой ввод через Whisper не настроен. Добавьте OPENAI_API_KEY в .env',
      503,
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail('BAD_FORM', 'Не удалось прочитать аудио');
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return fail('NO_FILE', 'Прикрепите аудиофайл (поле file)');
  }

  if (file.size < 256) {
    return fail('TOO_SHORT', 'Слишком короткая запись — поговорите чуть дольше');
  }

  const languageRaw = String(form.get('language') ?? '').trim().toLowerCase();
  const language =
    languageRaw === 'ru' || languageRaw === 'en' || languageRaw === 'kk'
      ? languageRaw === 'kk'
        ? 'ru'
        : languageRaw
      : languageRaw.slice(0, 2) || undefined;

  try {
    const result = await transcribeAudio(file, language);
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка транскрибации';
    if (message.includes('не настроен')) {
      return fail('NOT_CONFIGURED', message, 503);
    }
    return fail('TRANSCRIBE_FAILED', message, 502);
  }
}
