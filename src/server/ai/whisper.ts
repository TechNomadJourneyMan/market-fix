/**
 * OpenAI Whisper (и совместимый Vercel AI Gateway) для транскрибации аудио.
 */

export type WhisperEngine = 'openai' | 'ai-gateway' | 'demo';

export type WhisperResult = {
  text: string;
  engine: WhisperEngine;
};

const MAX_BYTES = 25 * 1024 * 1024;

function resolveWhisperEndpoint() {
  const gateway =
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    process.env.VERCEL_AI_GATEWAY_API_KEY?.trim();
  if (gateway) {
    return {
      engine: 'ai-gateway' as const,
      url: 'https://ai-gateway.vercel.sh/v1/audio/transcriptions',
      apiKey: gateway,
    };
  }

  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) {
    return {
      engine: 'openai' as const,
      url: 'https://api.openai.com/v1/audio/transcriptions',
      apiKey: openai,
    };
  }

  return null;
}

export function isWhisperConfigured() {
  if (process.env.TRANSCRIBE_DEMO === '1') return true;
  return Boolean(resolveWhisperEndpoint());
}

export function whisperStatus() {
  if (resolveWhisperEndpoint()?.engine === 'ai-gateway') {
    return { available: true as const, engine: 'ai-gateway' as const };
  }
  if (resolveWhisperEndpoint()?.engine === 'openai') {
    return { available: true as const, engine: 'openai' as const };
  }
  if (process.env.TRANSCRIBE_DEMO === '1') {
    return { available: true as const, engine: 'demo' as const };
  }
  return { available: false as const, engine: 'none' as const };
}

export async function transcribeAudio(
  file: File,
  language?: string,
): Promise<WhisperResult> {
  if (!file.size) {
    throw new Error('Пустой аудиофайл');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Аудио слишком большое (лимит 25 МБ)');
  }

  const endpoint = resolveWhisperEndpoint();
  if (!endpoint) {
    if (process.env.TRANSCRIBE_DEMO === '1') {
      return {
        text: 'кафе с живой музыкой рядом',
        engine: 'demo',
      };
    }
    throw new Error('Whisper не настроен: добавьте OPENAI_API_KEY');
  }

  const body = new FormData();
  body.append('file', file, file.name || 'speech.webm');
  body.append('model', 'whisper-1');
  body.append('response_format', 'json');
  if (language) body.append('language', language);

  const response = await fetch(endpoint.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${endpoint.apiKey}`,
    },
    body,
  });

  if (!response.ok) {
    let detail = '';
    try {
      const payload = (await response.json()) as { error?: { message?: string } };
      detail = payload.error?.message ?? '';
    } catch {
      detail = await response.text().catch(() => '');
    }
    throw new Error(detail || `Whisper ответил ${response.status}`);
  }

  const payload = (await response.json()) as { text?: string };
  const text = (payload.text ?? '').replace(/\s+/g, ' ').trim();
  if (!text) throw new Error('Whisper не распознал речь');

  return { text, engine: endpoint.engine };
}
