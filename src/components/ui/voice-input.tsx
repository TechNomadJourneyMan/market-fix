'use client';

import * as React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  /** append — дописать к текущему, replace — заменить */
  mode?: 'append' | 'replace';
  className?: string;
  size?: 'sm' | 'icon' | 'icon-sm';
  label?: string;
}

export function VoiceInputButton({
  onTranscript,
  mode = 'replace',
  className,
  size = 'icon',
  label,
}: VoiceInputButtonProps) {
  const [listening, setListening] = React.useState(false);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);

  const supported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  React.useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const toggle = () => {
    if (!supported) {
      toast.error('Голосовой ввод не поддерживается в этом браузере. Попробуйте Chrome.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (transcript) {
        onTranscript(mode === 'append' ? transcript : transcript);
        toast.success('Распознано', { description: transcript });
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error !== 'aborted') {
        toast.error('Не удалось распознать речь. Повторите попытку.');
      }
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <Button
      type="button"
      variant={listening ? 'default' : 'outline'}
      size={size}
      onClick={toggle}
      className={cn(listening && 'animate-pulse', className)}
      aria-pressed={listening}
      aria-label={listening ? 'Остановить запись' : 'Голосовой ввод'}
      title={supported ? 'Голосовой ввод' : 'Браузер не поддерживает голосовой ввод'}
    >
      {listening ? <MicOff /> : <Mic />}
      {label ? <span>{listening ? 'Слушаю…' : label}</span> : null}
    </Button>
  );
}
