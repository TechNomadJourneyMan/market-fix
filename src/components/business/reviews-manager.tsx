'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Reply, Send } from 'lucide-react';
import type { Review } from '@/types';
import { cn, getInitials } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/format';
import { Stars } from '@/components/ui/rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type BusinessReview = Review & { venueName: string; venueSlug: string };

const FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'unanswered', label: 'Без ответа' },
  { value: 'negative', label: 'Негативные' },
  { value: 'positive', label: 'Позитивные' },
] as const;

/** Подсказки для быстрого ответа — снижают порог «не знаю, что написать». */
const TEMPLATES = [
  'Спасибо за тёплые слова! Передали ваш отзыв команде — будем рады видеть вас снова.',
  'Благодарим за обратную связь. Разобрали ситуацию со сменой, чтобы такого больше не повторилось.',
  'Нам жаль, что визит не оправдал ожиданий. Напишите нам — хотим лично компенсировать неудобство.',
];

export function ReviewsManager({ reviews }: { reviews: BusinessReview[] }) {
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]['value']>('all');
  const [replyingId, setReplyingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');
  const [sentReplies, setSentReplies] = React.useState<Record<string, string>>({});

  const filtered = reviews.filter((review) => {
    const hasReply = Boolean(review.reply || sentReplies[review.id]);
    if (filter === 'unanswered') return !hasReply;
    if (filter === 'negative') return review.rating <= 3;
    if (filter === 'positive') return review.rating >= 4;
    return true;
  });

  const sendReply = (reviewId: string) => {
    if (!draft.trim()) return;
    setSentReplies((current) => ({ ...current, [reviewId]: draft.trim() }));
    setReplyingId(null);
    setDraft('');
    toast.success('Ответ опубликован');
  };

  return (
    <div className="space-y-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-all',
              filter === item.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {filtered.map((review) => {
          const reply = review.reply?.text ?? sentReplies[review.id];
          const isReplying = replyingId === review.id;

          return (
            <li key={review.id} className="rounded-2xl border bg-card p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={review.author.avatar} alt={review.author.name} />
                  <AvatarFallback>{getInitials(review.author.name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{review.author.name}</p>
                    <Badge variant="secondary" size="sm">
                      {review.venueName}
                    </Badge>
                    {review.author.isVerified ? (
                      <Badge variant="success" size="sm">
                        Проверенный гость
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(review.createdAt)}
                  </p>
                </div>

                <Stars value={review.rating} size={14} className="shrink-0" />
              </div>

              <div className="mt-3 space-y-1.5">
                <p className="text-sm font-medium">{review.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{review.text}</p>
              </div>

              {reply ? (
                <div className="mt-4 rounded-xl border-l-2 border-primary bg-secondary/50 p-3.5">
                  <p className="text-xs font-medium">Ваш ответ</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{reply}</p>
                </div>
              ) : isReplying ? (
                <div className="mt-4 space-y-2.5">
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Ответьте гостю — это видят все посетители страницы"
                    autoFocus
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {TEMPLATES.map((template, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setDraft(template)}
                        className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        Шаблон {index + 1}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => sendReply(review.id)} disabled={!draft.trim()}>
                      <Send />
                      Опубликовать ответ
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReplyingId(null);
                        setDraft('');
                      }}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setReplyingId(review.id);
                    setDraft('');
                  }}
                >
                  <Reply />
                  Ответить
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
