'use client';

import * as React from 'react';
import { Loader2, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useLocale } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import { Button } from '@/components/ui/button';

/** Минимальный тип Web Speech API — в браузерах он есть, в TS DOM иногда нет. */
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string; confidence: number };
  length: number;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const SPEECH_LANG: Record<Locale, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  kk: 'ru-RU',
};

const WHISPER_LANG: Record<Locale, string> = {
  ru: 'ru',
  en: 'en',
  kk: 'ru',
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function pickRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
}

function collectTranscript(event: SpeechRecognitionEventLike) {
  let finalText = '';
  let interimText = '';

  for (let i = 0; i < event.results.length; i += 1) {
    const result = event.results[i];
    const chunk = result?.[0]?.transcript ?? '';
    if (result.isFinal) finalText += chunk;
    else interimText += chunk;
  }

  return {
    finalText: finalText.replace(/\s+/g, ' ').trim(),
    interimText: interimText.replace(/\s+/g, ' ').trim(),
  };
}

function mergeSpoken(base: string, spoken: string, mode: 'append' | 'replace') {
  if (!spoken) return base;
  if (mode === 'replace') return spoken;
  if (!base) return spoken;
  return `${base}${base.endsWith(' ') ? '' : ' '}${spoken}`;
}

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  mode?: 'append' | 'replace';
  currentValue?: string;
  className?: string;
  size?: 'sm' | 'icon' | 'icon-sm';
  label?: string;
  lang?: string;
}

/**
 * Голосовой ввод:
 * 1) Whisper (запись → /api/transcribe) — основной надёжный путь
 * 2) Web Speech — live-текст и fallback, если Whisper недоступен
 */
export function VoiceInputButton({
  onTranscript,
  onInterimTranscript,
  mode = 'replace',
  currentValue = '',
  className,
  size = 'icon',
  label,
  lang,
}: VoiceInputButtonProps) {
  const locale = useLocale();
  const [listening, setListening] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [whisperAvailable, setWhisperAvailable] = React.useState(false);

  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const baseValueRef = React.useRef('');
  const finalBufferRef = React.useRef('');
  const shouldKeepSpeechRef = React.useRef(false);
  const usingWhisperRef = React.useRef(false);

  const onTranscriptRef = React.useRef(onTranscript);
  const onInterimRef = React.useRef(onInterimTranscript);
  onTranscriptRef.current = onTranscript;
  onInterimRef.current = onInterimTranscript;

  React.useEffect(() => {
    let cancelled = false;
    void fetch('/api/transcribe')
      .then(async (response) => {
        const payload = (await response.json()) as {
          ok?: boolean;
          data?: { available?: boolean };
        };
        if (!cancelled) {
          setWhisperAvailable(Boolean(payload.ok && payload.data?.available));
        }
      })
      .catch(() => {
        if (!cancelled) setWhisperAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stopTracks = React.useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const stopSpeech = React.useCallback(() => {
    shouldKeepSpeechRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
  }, []);

  const cleanupAll = React.useCallback(() => {
    shouldKeepSpeechRef.current = false;
    try {
      mediaRecorderRef.current?.state !== 'inactive' && mediaRecorderRef.current?.stop();
    } catch {
      // ignore
    }
    mediaRecorderRef.current = null;
    stopSpeech();
    stopTracks();
  }, [stopSpeech, stopTracks]);

  React.useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);

  const applyText = React.useCallback(
    (spoken: string, interim = false) => {
      if (!spoken) return;
      const next = mergeSpoken(baseValueRef.current, spoken, mode);
      if (interim) onInterimRef.current?.(next);
      else onTranscriptRef.current(next);
    },
    [mode],
  );

  const startSpeechPreview = React.useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    try {
      recognitionRef.current?.abort();
    } catch {
      // ignore
    }

    finalBufferRef.current = '';
    shouldKeepSpeechRef.current = true;

    const recognition = new Ctor();
    recognition.lang = lang ?? SPEECH_LANG[locale] ?? 'ru-RU';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const { finalText, interimText } = collectTranscript(event);
      let newlyFinal = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) newlyFinal += result[0]?.transcript ?? '';
      }
      if (newlyFinal) {
        finalBufferRef.current = `${finalBufferRef.current} ${newlyFinal}`
          .replace(/\s+/g, ' ')
          .trim();
      }

      const live = (
        finalBufferRef.current
          ? `${finalBufferRef.current}${interimText ? ` ${interimText}` : ''}`
          : interimText || finalText
      ).trim();

      if (live) applyText(live, true);
    };

    recognition.onerror = () => {
      // При Whisper preview — ошибки Web Speech не критичны.
      if (usingWhisperRef.current) return;
    };

    recognition.onend = () => {
      if (shouldKeepSpeechRef.current && !usingWhisperRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          shouldKeepSpeechRef.current = false;
        }
      }
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
    }
  }, [applyText, lang, locale]);

  const uploadToWhisper = React.useCallback(
    async (blob: Blob) => {
      setProcessing(true);
      try {
        const extension = blob.type.includes('mp4')
          ? 'mp4'
          : blob.type.includes('ogg')
            ? 'ogg'
            : 'webm';
        const form = new FormData();
        form.append('file', blob, `speech.${extension}`);
        form.append('language', WHISPER_LANG[locale] ?? 'ru');

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: form,
        });
        const payload = (await response.json()) as {
          ok: boolean;
          data?: { text?: string; engine?: string };
          error?: { message?: string; code?: string };
        };

        if (!payload.ok || !payload.data?.text) {
          throw new Error(payload.error?.message ?? 'Не удалось распознать речь');
        }

        applyText(payload.data.text, false);
        toast.success('Распознано', {
          description:
            payload.data.engine === 'demo'
              ? `${payload.data.text} (демо Whisper)`
              : payload.data.text,
        });
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Ошибка Whisper-транскрибации';
        toast.error(message);
        if (finalBufferRef.current) {
          applyText(finalBufferRef.current, false);
          return true;
        }
        return false;
      } finally {
        setProcessing(false);
      }
    },
    [applyText, locale],
  );

  const startWhisperRecording = React.useCallback(async () => {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Запись с микрофона не поддерживается в этом браузере');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    mediaStreamRef.current = stream;

    const mimeType = pickRecorderMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    chunksRef.current = [];
    usingWhisperRef.current = true;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type });
      stopTracks();
      mediaRecorderRef.current = null;
      void uploadToWhisper(blob).finally(() => {
        usingWhisperRef.current = false;
        setListening(false);
      });
    };

    mediaRecorderRef.current = recorder;
    recorder.start(250);
    setListening(true);
    startSpeechPreview();
    toast.message('Слушаю…', {
      description: 'Говорите, затем нажмите микрофон ещё раз — отправим в Whisper.',
    });
  }, [startSpeechPreview, stopTracks, uploadToWhisper]);

  const startSpeechOnly = React.useCallback(async () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      toast.error(
        'Голосовой ввод недоступен. Откройте Chrome/Edge или добавьте OPENAI_API_KEY для Whisper.',
      );
      return;
    }

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        toast.error('Разрешите доступ к микрофону — иначе голос не распознать.');
        return;
      }
    }

    usingWhisperRef.current = false;
    baseValueRef.current = currentValue;
    finalBufferRef.current = '';
    shouldKeepSpeechRef.current = true;
    setListening(true);

    const recognition = new Ctor();
    recognition.lang = lang ?? SPEECH_LANG[locale] ?? 'ru-RU';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const { finalText, interimText } = collectTranscript(event);
      let newlyFinal = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) newlyFinal += result[0]?.transcript ?? '';
      }
      if (newlyFinal) {
        finalBufferRef.current = `${finalBufferRef.current} ${newlyFinal}`
          .replace(/\s+/g, ' ')
          .trim();
      }

      const live = (
        finalBufferRef.current
          ? `${finalBufferRef.current}${interimText ? ` ${interimText}` : ''}`
          : interimText || finalText
      ).trim();

      if (!live) return;
      applyText(live, Boolean(interimText));
      if (finalBufferRef.current && !interimText) {
        applyText(finalBufferRef.current, false);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      shouldKeepSpeechRef.current = false;
      setListening(false);
      const map: Record<string, string> = {
        'not-allowed': 'Доступ к микрофону запрещён.',
        'audio-capture': 'Микрофон не найден.',
        network:
          'Сервис браузера недоступен. Добавьте OPENAI_API_KEY — включится Whisper.',
      };
      toast.error(map[event.error] ?? 'Не удалось распознать речь.');
    };

    recognition.onend = () => {
      if (shouldKeepSpeechRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          shouldKeepSpeechRef.current = false;
        }
      }
      if (finalBufferRef.current) {
        applyText(finalBufferRef.current, false);
        toast.success('Распознано', { description: finalBufferRef.current });
      }
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      toast.message('Слушаю…', {
        description: 'Whisper не настроен — используем распознавание браузера.',
      });
    } catch {
      setListening(false);
      toast.error('Не удалось запустить микрофон.');
    }
  }, [applyText, currentValue, lang, locale]);

  const stop = React.useCallback(() => {
    shouldKeepSpeechRef.current = false;
    stopSpeech();

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        stopTracks();
        setListening(false);
      }
      return;
    }

    if (finalBufferRef.current) {
      applyText(finalBufferRef.current, false);
    }
    stopTracks();
    setListening(false);
  }, [applyText, stopSpeech, stopTracks]);

  const toggle = () => {
    if (processing) return;
    if (listening) {
      stop();
      return;
    }

    baseValueRef.current = currentValue;
    finalBufferRef.current = '';

    void (async () => {
      try {
        if (whisperAvailable) {
          await startWhisperRecording();
          return;
        }
        await startSpeechOnly();
      } catch (error) {
        stopTracks();
        setListening(false);
        const message =
          error instanceof Error ? error.message : 'Не удалось получить доступ к микрофону';
        if (message.toLowerCase().includes('permission') || message.includes('NotAllowed')) {
          toast.error('Разрешите доступ к микрофону в браузере.');
          return;
        }
        // Если запись не стартовала — пробуем чистый Web Speech.
        await startSpeechOnly();
      }
    })();
  };

  return (
    <Button
      type="button"
      variant={listening || processing ? 'default' : 'outline'}
      size={size}
      onClick={toggle}
      className={cn((listening || processing) && 'animate-pulse', className)}
      aria-pressed={listening}
      aria-label={
        processing
          ? 'Распознаём речь'
          : listening
            ? 'Остановить голосовой ввод'
            : 'Голосовой ввод'
      }
      title={
        processing
          ? 'Whisper распознаёт речь…'
          : listening
            ? 'Нажмите, чтобы закончить'
            : whisperAvailable
              ? 'Сказать запрос (Whisper)'
              : 'Сказать запрос (браузер / настройте Whisper)'
      }
      disabled={processing}
    >
      {processing ? <Loader2 className="animate-spin" /> : listening ? <MicOff /> : <Mic />}
      {label ? <span>{processing ? 'Распознаём…' : listening ? 'Слушаю…' : label}</span> : null}
    </Button>
  );
}
