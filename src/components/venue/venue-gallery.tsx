'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import type { VenuePhoto } from '@/types';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Галерея заведения: мозаика 1+4 на десктопе, свайп-лента на мобильных,
 * полноэкранный просмотр по клику.
 */
export function VenueGallery({ photos, venueName }: { photos: VenuePhoto[]; venueName: string }) {
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  const open = (index: number) => setLightboxIndex(index);
  const close = () => setLightboxIndex(null);

  const step = (delta: number) => {
    setLightboxIndex((current) => {
      if (current === null) return null;
      return (current + delta + photos.length) % photos.length;
    });
  };

  React.useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex]);

  const [main, ...rest] = photos;

  return (
    <>
      {/* Мобильная лента */}
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:hidden">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => open(index)}
            className="relative aspect-[4/3] w-[85vw] shrink-0 snap-center overflow-hidden rounded-2xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={photo.alt} className="size-full object-cover" />
          </button>
        ))}
      </div>

      {/* Десктопная мозаика */}
      <div className="relative hidden gap-2 sm:grid sm:grid-cols-4 sm:grid-rows-2">
        <button
          type="button"
          onClick={() => open(0)}
          className="group relative col-span-2 row-span-2 overflow-hidden rounded-l-2xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={main.url}
            alt={main.alt}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </button>

        {rest.slice(0, 4).map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => open(index + 1)}
            className={cn(
              'group relative overflow-hidden',
              index === 1 && 'rounded-tr-2xl',
              index === 3 && 'rounded-br-2xl',
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.alt}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </button>
        ))}

        <Button
          variant="glass"
          size="sm"
          onClick={() => open(0)}
          className="absolute bottom-4 right-4 shadow-lift"
        >
          <Expand />
          Все фото · {photos.length}
        </Button>
      </div>

      {/* Полноэкранный просмотр */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(value) => (value ? null : close())}>
        <DialogContent
          sheetOnMobile={false}
          hideClose
          className="max-h-[92vh] w-[96vw] max-w-5xl border-0 bg-transparent p-0 shadow-none"
        >
          <DialogTitle className="sr-only">Фотографии — {venueName}</DialogTitle>

          {lightboxIndex !== null ? (
            <div className="relative flex flex-col gap-3">
              <div className="relative overflow-hidden rounded-2xl bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photos[lightboxIndex].url}
                  alt={photos[lightboxIndex].alt}
                  className="max-h-[74vh] w-full object-contain"
                />

                <button
                  type="button"
                  onClick={close}
                  className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white backdrop-blur transition-colors hover:bg-black/70"
                  aria-label="Закрыть"
                >
                  <X className="size-5" />
                </button>

                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white backdrop-blur transition-colors hover:bg-black/70"
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white backdrop-blur transition-colors hover:bg-black/70"
                  aria-label="Следующее фото"
                >
                  <ChevronRight className="size-5" />
                </button>

                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur">
                  {lightboxIndex + 1} / {photos.length}
                </span>
              </div>

              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className={cn(
                      'size-16 shrink-0 overflow-hidden rounded-lg transition-all',
                      index === lightboxIndex
                        ? 'ring-2 ring-white'
                        : 'opacity-55 hover:opacity-100',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
