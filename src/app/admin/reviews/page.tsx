import { requireAdminPermission } from '@/server/admin/auth';
import { listModerationQueue } from '@/server/repositories/admin';
import { ModerationStatusBadge } from '@/components/admin/status-badge';
import { overrideModerationAction } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ModerationLevel } from '@/types';

const LEVELS: ModerationLevel[] = [
  'auto_approve',
  'approve_with_warning',
  'needs_human_review',
  'temporarily_hidden',
  'reject',
  'spam',
  'fraud_suspected',
];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  await requireAdminPermission('reviews.read');
  const params = await searchParams;
  const queue = listModerationQueue({
    status: (params.status as 'open' | 'resolved' | 'escalated' | undefined) ?? 'open',
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Отзывы / AI-модерация</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI предлагает решение. Администратор может отменить его с обязательной причиной.
          Негатив ≠ spam.
        </p>
        {params.error === 'reason_required' ? (
          <p className="mt-2 text-sm text-destructive">Укажите причину override.</p>
        ) : null}
      </div>

      <div className="space-y-4">
        {queue.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
            Очередь пуста для выбранного фильтра.
          </div>
        ) : (
          queue.map(({ case: modCase, review, venue }) => (
            <article key={modCase.id} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{review?.title ?? 'Без заголовка'}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {venue?.name ?? modCase.venueId} · {review?.author.name} · ★{review?.rating}
                    {review?.source ? ` · ${review.source}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ModerationStatusBadge status={modCase.aiLevel} />
                  <ModerationStatusBadge status={modCase.finalLevel} />
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed">{review?.text}</p>

              {review?.analysis ? (
                <div className="mt-4 grid gap-2 rounded-xl bg-secondary/50 p-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(review.analysis.scores).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium">{Math.round(value * 100)}%</span>
                    </div>
                  ))}
                  <div className="sm:col-span-2 lg:col-span-3 text-muted-foreground">
                    {review.analysis.aiReasoningSummary}
                  </div>
                </div>
              ) : null}

              {modCase.status === 'open' ? (
                <form action={overrideModerationAction} className="mt-4 grid gap-2 sm:grid-cols-[1fr_220px_auto]">
                  <input type="hidden" name="caseId" value={modCase.id} />
                  <Input name="reason" placeholder="Причина решения администратора" required />
                  <select
                    name="level"
                    defaultValue="auto_approve"
                    className="h-10 rounded-xl border bg-background px-3 text-sm"
                  >
                    {LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                  <Button type="submit">Override AI</Button>
                </form>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  Resolved · {modCase.overrideReason ?? 'без комментария'}
                </p>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
