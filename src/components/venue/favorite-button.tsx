'use client';

import * as React from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/client';
import { useFavoritesStore } from '@/store/use-favorites-store';

interface FavoriteButtonProps {
  venueId: string;
  venueName: string;
  variant?: 'overlay' | 'plain' | 'outline';
  size?: 'sm' | 'default';
  className?: string;
  withLabel?: boolean;
}

export function FavoriteButton({
  venueId,
  venueName,
  variant = 'overlay',
  size = 'default',
  className,
  withLabel,
}: FavoriteButtonProps) {
  const t = useT('catalog');
  const venueIds = useFavoritesStore((state) => state.venueIds);
  const toggle = useFavoritesStore((state) => state.toggle);
  const isFavorite = venueIds.includes(venueId);

  const handleClick = async (event: React.MouseEvent) => {
    // Кнопка живёт внутри ссылки-карточки — гасим переход.
    event.preventDefault();
    event.stopPropagation();

    const next = await toggle(venueId);
    toast[next ? 'success' : 'message'](
      next
        ? t('card.favoriteToastAdded', { name: venueName })
        : t('card.favoriteToastRemoved', { name: venueName }),
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFavorite ? t('card.favoriteRemove') : t('card.favoriteAdd')}
      aria-pressed={isFavorite}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full transition-all active:scale-90',
        size === 'sm' ? 'size-8' : 'size-10',
        withLabel && 'w-auto px-4',
        variant === 'overlay' &&
          'border border-white/25 bg-black/35 text-white backdrop-blur-md hover:bg-black/55',
        variant === 'plain' && 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        variant === 'outline' && 'border bg-background shadow-soft hover:bg-secondary',
        className,
      )}
    >
      <Heart
        className={cn(
          size === 'sm' ? 'size-4' : 'size-[18px]',
          'transition-all',
          isFavorite && 'scale-110 fill-rose-500 text-rose-500',
        )}
      />
      {withLabel ? (
        <span className="whitespace-nowrap text-sm font-medium">
          {isFavorite ? t('card.inFavorites') : t('card.toFavorites')}
        </span>
      ) : null}
    </button>
  );
}
