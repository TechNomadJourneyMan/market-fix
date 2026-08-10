import Link from 'next/link';

import { requireAdminPermission } from '@/server/admin/auth';
import { listAdminRatings } from '@/server/repositories/admin';
import { overrideRatingAction, recalculateRatingAction } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default async function AdminRatingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminPermission('ratings.read');
  const params = await searchParams;
  const items = listAdminRatings();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Rating Engine</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Объяснимый рейтинг 0–10: Raw → AI → Scoring → Override → Final. Value не растёт от цены.
        </p>
        {params.error === 'reason_required' ? (
          <p className="mt-2 text-sm text-destructive">Для editorial override нужна причина.</p>
        ) : null}
      </div>

      <div className="space-y-4">
        {items.slice(0, 40).map(({ venue, snapshot }) => (
          <article key={venue.id} className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/admin/venues/${venue.slug}`} className="text-lg font-semibold hover:underline">
                  {venue.name}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{snapshot?.explanation}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-semibold tracking-tight">
                  {snapshot?.layers.finalScore.toFixed(1) ?? '—'}
                  <span className="text-base text-muted-foreground">/10</span>
                </div>
                <Badge variant="outline" className="mt-1">
                  {snapshot?.confidence ?? 'insufficient'}
                </Badge>
              </div>
            </div>

            {snapshot ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {snapshot.factors.map((factor) => (
                  <div key={factor.key} className="rounded-xl border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span>{factor.label}</span>
                      <span className="font-semibold">{factor.score.toFixed(1)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-foreground"
                        style={{ width: `${factor.score * 10}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <form action={recalculateRatingAction}>
                <input type="hidden" name="venueId" value={venue.id} />
                <Button type="submit" size="sm" variant="outline">
                  Recalculate
                </Button>
              </form>
              <form action={overrideRatingAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="venueId" value={venue.id} />
                <Input name="delta" type="number" step="0.1" defaultValue="0.2" className="w-24" />
                <Input name="reason" placeholder="Причина override" className="w-56" required />
                <Button type="submit" size="sm">
                  Editorial override
                </Button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
