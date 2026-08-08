'use client';

import * as React from 'react';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import type { Review, VenueRating } from '@/types';
import { cn, getInitials } from '@/lib/utils';
import { formatRating, formatRelativeTime, formatReviews } from '@/lib/format';
import { Stars } from '@/components/ui/rating';
import { Avatar, AvatarFallback, AvatarImage, Progress } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

const OCCASION_LABELS: Record<string, string> = {
  date: 'Свидание',
  family: 'С семьёй',
  business: 'Деловая встреча',
  friends: 'С друзьями',
  celebration: 'Праздник',
  solo: 'Один',
};

const CRITERIA: { key: keyof VenueRating['breakdown']; label: string }[] = [
  { key: 'food', label: 'Кухня' },
  { key: 'service', label: 'Сервис' },
  { key: 'atmosphere', label: 'Атмосфера' },
  { key: 'price', label: 'Цена/качество' },
];

const SORTS = [
  { value: 'recent', label: 'Сначала свежие' },
  { value: 'helpful', label: 'Сначала полезные' },
  { value: 'rating_desc', label: 'Сначала высокие оценки' },
  { value: 'rating_asc', label: 'Сначала низкие оценки' },
] as const;

interface VenueReviewsProps {
  rating: VenueRating;
  reviews: Review[];
}

export function VenueReviews({ rating, reviews }: VenueReviewsProps) {
  const [sort, setSort] = React.useState<(typeof SORTS)[number]['value']>('recent');
  const [starFilter, setStarFilter] = React.useState<number | null>(null);
  const [visible, setVisible] = React.useState(4);

  const filtered = React.useMemo(() => {
    const list = starFilter
      ? reviews.filter((review) => review.rating === starFilter)
      : [...reviews];

    switch (sort) {
      case 'helpful':
        return list.sort((a, b) => b.likes - a.likes);
      case 'rating_desc':
        return list.sort((a, b) => b.rating - a.rating);
      case 'rating_asc':
        return list.sort((a, b) => a.rating - b.rating);
      default:
        return list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
  }, [reviews, sort, starFilter]);

  return (
    <div className="space-y-6">
      {/* ——— Сводка ——— */}
      <div className="grid gap-6 rounded-2xl border p-5 sm:grid-cols-[auto_1fr_1fr] sm:gap-8 sm:p-6">
        <div className="text-center sm:text-left">
          <p className="text-4xl font-semibold tracking-tight">
            {formatRating(rating.score)}
          </p>
          <Stars value={rating.score} size={16} className="mt-1.5 justify-center sm:justify-start" />
          <p className="mt-1 text-xs text-muted-foreground">{formatReviews(rating.count)}</p>
        </div>

        <div className="space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = rating.distribution[String(star) as '1'];
            const percent = rating.count > 0 ? (count / rating.count) * 100 : 0;
            const isActive = starFilter === star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setStarFilter(isActive ? null : star)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-1.5 py-0.5 text-xs transition-colors hover:bg-secondary',
                  isActive && 'bg-secondary font-medium',
                )}
              >
                <span className="w-3 text-muted-foreground">{star}</span>
                <Progress value={percent} className="h-1.5 flex-1" />
                <span className="w-9 text-right text-muted-foreground">{count}</span>
              </button>
            );
          })}
        </div>

        <dl className="space-y-2">
          {CRITERIA.map((criterion) => (
            <div key={criterion.key} className="flex items-center gap-3">
              <dt className="w-28 shrink-0 text-xs text-muted-foreground">
                {criterion.label}
              </dt>
              <Progress
                value={(rating.breakdown[criterion.key] / 5) * 100}
                className="h-1.5 flex-1"
              />
              <dd className="w-7 text-right text-xs font-medium">
                {formatRating(rating.breakdown[criterion.key])}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* ——— Управление ——— */}
      <div className="flex flex-wrap items-center gap-2">
        {SORTS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSort(option.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
              sort === option.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'hover:border-foreground/20 hover:bg-secondary',
            )}
          >
            {option.label}
          </button>
        ))}
        {starFilter ? (
          <button
            type="button"
            onClick={() => setStarFilter(null)}
            className="ml-auto text-xs font-medium text-primary hover:underline"
          >
            Показать все оценки
          </button>
        ) : null}
      </div>

      {/* ——— Список ——— */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquare />}
          title="С такой оценкой отзывов пока нет"
          description="Попробуйте посмотреть все отзывы — их достаточно, чтобы составить мнение."
          action={{ label: 'Показать все', onClick: () => setStarFilter(null) }}
          compact
        />
      ) : (
        <ul className="space-y-4">
          {filtered.slice(0, visible).map((review) => (
            <li key={review.id} className="rounded-2xl border p-5">
              <div className="flex items-start gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={review.author.avatar} alt={review.author.name} />
                  <AvatarFallback>{getInitials(review.author.name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-medium">{review.author.name}</p>
                    {review.author.isVerified ? (
                      <Badge variant="success" size="sm">
                        Проверенный гость
                      </Badge>
                    ) : null}
                    {review.occasion ? (
                      <Badge variant="secondary" size="sm">
                        {OCCASION_LABELS[review.occasion]}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatReviews(review.author.reviewsCount)} ·{' '}
                    {formatRelativeTime(review.createdAt)}
                  </p>
                </div>

                <Stars value={review.rating} size={14} className="shrink-0" />
              </div>

              <div className="mt-3 space-y-1.5">
                <p className="text-sm font-medium">{review.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{review.text}</p>
              </div>

              {review.photos.length > 0 ? (
                <div className="mt-3 flex gap-2">
                  {review.photos.map((photo, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={index}
                      src={photo}
                      alt=""
                      loading="lazy"
                      className="size-20 rounded-xl object-cover"
                    />
                  ))}
                </div>
              ) : null}

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <ThumbsUp className="size-3.5" />
                  Полезно · {review.likes}
                </button>
              </div>

              {review.reply ? (
                <div className="mt-4 rounded-xl border-l-2 border-primary bg-secondary/50 p-3.5">
                  <p className="text-xs font-medium">
                    Ответ заведения «{review.reply.businessName}»
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {review.reply.text}
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {visible < filtered.length ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setVisible((count) => count + 4)}>
            Показать ещё {Math.min(4, filtered.length - visible)}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
