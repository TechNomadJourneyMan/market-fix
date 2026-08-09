#!/usr/bin/env node
/**
 * Smoke-тест /api/transcribe:
 * 1) GET — статус Whisper
 * 2) POST — короткий WAV → ожидаем текст (нужен OPENAI_API_KEY или TRANSCRIBE_DEMO=1)
 *
 * Usage: node scripts/test-transcribe.mjs [baseUrl]
 */

const baseUrl = process.argv[2] ?? 'http://localhost:3000';

function createSilentWav(seconds = 1, sampleRate = 16000) {
  const numSamples = Math.floor(sampleRate * seconds);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  // PCM silence already zeros
  return buffer;
}

async function main() {
  const statusRes = await fetch(`${baseUrl}/api/transcribe`);
  const statusJson = await statusRes.json();
  console.log('GET /api/transcribe', statusRes.status, JSON.stringify(statusJson));

  if (!statusJson?.ok) {
    process.exitCode = 1;
    return;
  }

  const wav = createSilentWav(1.2);
  const form = new FormData();
  form.append(
    'file',
    new Blob([wav], { type: 'audio/wav' }),
    'speech.wav',
  );
  form.append('language', 'ru');

  const postRes = await fetch(`${baseUrl}/api/transcribe`, {
    method: 'POST',
    body: form,
  });
  const postJson = await postRes.json();
  console.log('POST /api/transcribe', postRes.status, JSON.stringify(postJson));

  if (!statusJson.data?.available) {
    console.log('Whisper недоступен — ожидаем 503 на POST без ключа.');
    if (postRes.status === 503 && postJson?.error?.code === 'NOT_CONFIGURED') {
      console.log('OK: корректный ответ без ключа');
      return;
    }
    process.exitCode = 1;
    return;
  }

  if (!postJson?.ok || !postJson?.data?.text) {
    // Реальный Whisper на тишине может вернуть пусто/ошибку — для demo-режима текст обязателен.
    if (statusJson.data.engine === 'demo') {
      process.exitCode = 1;
      return;
    }
    console.log('Whisper доступен, но тишина могла не дать текст — это допустимо для live API.');
    return;
  }

  console.log('OK: text =', postJson.data.text, 'engine =', postJson.data.engine);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
