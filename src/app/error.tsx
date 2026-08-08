'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // В продакшене здесь будет отправка в Sentry.
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </span>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight">Что-то пошло не так</h1>
      <p className="mt-2 text-pretty text-sm text-muted-foreground">
        Мы уже знаем о проблеме. Попробуйте обновить страницу — обычно это помогает.
      </p>

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <Button size="lg" onClick={reset}>
          <RotateCcw />
          Попробовать снова
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">
            <Home />
            На главную
          </Link>
        </Button>
      </div>
    </div>
  );
}
