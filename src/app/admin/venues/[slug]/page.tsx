import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireAdminPermission } from '@/server/admin/auth';
import { getAdminVenueDetail } from '@/server/repositories/admin';
import { VenueStatusBadge } from '@/components/admin/status-badge';
import { changeVenueStatusAction, updateVenueAction } from '@/app/admin/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function AdminVenueDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminPermission('venues.read');
  const { slug } = await params;
  const detail = getAdminVenueDetail(slug);
  if (!detail) notFound();

  const { venue, reviews, bookings, snapshot, activity } = detail;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{venue.name}</h1>
              <VenueStatusBadge status={venue.status} />
              {venue.isVerified ? <Badge variant="success">Verified</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{venue.tagline}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/venue/${venue.slug}`}>Гостевой вид</Link>
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Rating" value={snapshot ? `${snapshot.layers.finalScore.toFixed(1)}/10` : '—'} />
          <Metric label="Stars" value={venue.rating.score.toFixed(1)} />
          <Metric label="Reviews" value={String(reviews.length)} />
          <Metric label="Bookings" value={String(bookings.length)} />
          <Metric label="Conversion" value={`${Math.round(venue.stats.conversionRate * 100)}%`} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Information
          </h2>
          <form action={updateVenueAction} className="mt-4 space-y-3">
            <input type="hidden" name="venueId" value={venue.id} />
            <Field label="Название" name="name" defaultValue={venue.name} />
            <Field label="Tagline" name="tagline" defaultValue={venue.tagline} />
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Описание</span>
              <textarea
                name="description"
                defaultValue={venue.description}
                className="min-h-28 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Телефон" name="phone" defaultValue={venue.phone} />
              <Field label="Email" name="email" defaultValue={venue.email} />
              <Field label="Средний чек" name="averagePrice" defaultValue={String(venue.averagePrice)} />
              <Field label="Вместимость" name="capacity" defaultValue={String(venue.capacity)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isFeatured" defaultChecked={venue.isFeatured} />
              Featured
            </label>
            <Button type="submit">Сохранить</Button>
          </form>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Status
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['pending_review', 'verified', 'published', 'suspended', 'archived'] as const).map(
                (status) => (
                  <form key={status} action={changeVenueStatusAction}>
                    <input type="hidden" name="venueId" value={venue.id} />
                    <input type="hidden" name="status" value={status} />
                    <Button type="submit" size="sm" variant={venue.status === status ? 'default' : 'outline'}>
                      {status}
                    </Button>
                  </form>
                ),
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Rating breakdown
            </h2>
            {snapshot ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm">{snapshot.explanation}</p>
                <div className="grid gap-2">
                  {snapshot.factors.map((factor) => (
                    <div key={factor.key} className="flex items-center justify-between text-sm">
                      <span>{factor.label}</span>
                      <span className="font-medium">{factor.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
                  Raw {snapshot.layers.rawScore.toFixed(1)} → AI {snapshot.layers.aiInterpretation.toFixed(1)} →
                  Scoring {snapshot.layers.scoring.toFixed(1)} → Override {snapshot.layers.editorialOverride} →
                  Final {snapshot.layers.finalScore.toFixed(1)} · confidence {snapshot.confidence}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Нет снимка рейтинга</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          AI Insights / Activity
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {activity.length === 0 ? (
            <li className="text-muted-foreground">Пока нет audit-событий по заведению.</li>
          ) : (
            activity.map((item) => (
              <li key={item.id} className="rounded-xl border px-3 py-2">
                {item.actorName}: {item.action}
                {item.reason ? ` — ${item.reason}` : ''}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <Input name={name} defaultValue={defaultValue} />
    </label>
  );
}
