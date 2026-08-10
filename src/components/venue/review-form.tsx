'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ReviewForm({
  venueId,
  bookingId,
}: {
  venueId: string;
  bookingId?: string;
}) {
  const [rating, setRating] = React.useState(5);
  const [title, setTitle] = React.useState('');
  const [text, setText] = React.useState('');
  const [pending, setPending] = React.useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId, bookingId, rating, title, text }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        error?: { message?: string };
        data?: { published?: boolean; moderationStatus?: string };
      };
      if (!response.ok || !json.ok) {
        throw new Error(json.error?.message ?? 'Не удалось отправить отзыв');
      }
      toast.success(
        json.data?.published
          ? 'Отзыв опубликован'
          : `Отзыв отправлен на модерацию (${json.data?.moderationStatus ?? 'review'})`,
      );
      setTitle('');
      setText('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка отправки');
    } finally {
      setPending(false);
    }
  };

  return (
    <form id="reviews" onSubmit={onSubmit} className="space-y-3 rounded-2xl border bg-card p-4">
      <div>
        <h3 className="font-semibold">Оставить отзыв</h3>
        <p className="text-xs text-muted-foreground">
          Честный негатив приветствуется. AI проверяет спам и релевантность, не тон.
        </p>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Оценка</span>
        <select
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} ★
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Заголовок</span>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Текст</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          required
          minLength={20}
          className="min-h-28 w-full rounded-xl border bg-background px-3 py-2 text-sm"
          placeholder="Что было важно в вашем опыте?"
        />
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? 'Отправляем…' : 'Отправить отзыв'}
      </Button>
    </form>
  );
}
