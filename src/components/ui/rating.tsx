'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRating } from '@/lib/format';

interface StarsProps {
  value: number;
  size?: number;
  className?: string;
}

/** Звёзды с частичным заполнением — рейтинг 4,3 виден точно. */
export function Stars({ value, size = 14, className }: StarsProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={`Рейтинг ${value} из 5`}>
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.max(0, Math.min(1, value - index));
        return (
          <span key={index} className="relative inline-block" style={{ width: size, height: size }}>
            <Star
              className="absolute inset-0 text-muted-foreground/30"
              style={{ width: size, height: size }}
              strokeWidth={1.5}
            />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star
                className="text-amber-400"
                style={{ width: size, height: size }}
                fill="currentColor"
                strokeWidth={1.5}
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}

interface RatingBadgeProps {
  score: number;
  count?: number;
  className?: string;
  variant?: 'default' | 'overlay' | 'plain';
  size?: 'sm' | 'default';
}

/** Компактный бейдж рейтинга для карточек. */
export function RatingBadge({
  score,
  count,
  className,
  variant = 'default',
  size = 'default',
}: RatingBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold',
        size === 'sm' ? 'text-xs' : 'text-sm',
        variant === 'default' && 'rounded-lg bg-secondary px-2 py-0.5',
        variant === 'overlay' &&
          'rounded-lg border border-white/25 bg-black/45 px-2 py-1 text-white backdrop-blur-md',
        className,
      )}
    >
      <Star
        className={cn('text-amber-400', size === 'sm' ? 'size-3' : 'size-3.5')}
        fill="currentColor"
        strokeWidth={0}
      />
      {formatRating(score)}
      {count !== undefined ? (
        <span
          className={cn(
            'font-normal',
            variant === 'overlay' ? 'text-white/70' : 'text-muted-foreground',
          )}
        >
          ({count})
        </span>
      ) : null}
    </span>
  );
}

/** Интерактивный выбор оценки — для формы отзыва. */
export function RatingInput({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = React.useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className="rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Оценка ${star}`}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              'transition-colors',
              star <= active ? 'text-amber-400' : 'text-muted-foreground/30',
            )}
            fill={star <= active ? 'currentColor' : 'none'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
