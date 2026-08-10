import Link from 'next/link';

import { requireAdminPermission } from '@/server/admin/auth';
import { listAdminVenues } from '@/server/repositories/admin';
import { VenueStatusBadge } from '@/components/admin/status-badge';
import { changeVenueStatusAction } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function AdminVenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdminPermission('venues.read');
  const params = await searchParams;
  const venues = listAdminVenues({
    status: params.status as never,
    q: params.q,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Заведения</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            CRUD-операции, статусы публикации и верификация.
          </p>
        </div>
        <form className="flex gap-2">
          <Input name="q" placeholder="Поиск…" defaultValue={params.q} className="w-56" />
          <Button type="submit" variant="outline">
            Найти
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['', 'Все'],
          ['pending_review', 'Pending'],
          ['published', 'Published'],
          ['suspended', 'Suspended'],
          ['draft', 'Draft'],
        ].map(([value, label]) => (
          <Link
            key={value || 'all'}
            href={value ? `/admin/venues?status=${value}` : '/admin/venues'}
            className="rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-secondary/50 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Заведение</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Рейтинг</th>
              <th className="px-4 py-3 font-medium">Отзывы</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((venue) => (
              <tr key={venue.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/venues/${venue.slug}`} className="font-medium hover:underline">
                    {venue.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">{venue.location.address}</div>
                </td>
                <td className="px-4 py-3">
                  <VenueStatusBadge status={venue.status} />
                </td>
                <td className="px-4 py-3">{venue.rating.score.toFixed(1)}</td>
                <td className="px-4 py-3">{venue.rating.count}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <form action={changeVenueStatusAction}>
                      <input type="hidden" name="venueId" value={venue.id} />
                      <input type="hidden" name="status" value="published" />
                      <Button type="submit" size="sm" variant="outline">
                        Publish
                      </Button>
                    </form>
                    <form action={changeVenueStatusAction}>
                      <input type="hidden" name="venueId" value={venue.id} />
                      <input type="hidden" name="status" value="suspended" />
                      <input type="hidden" name="reason" value="Ручная приостановка" />
                      <Button type="submit" size="sm" variant="ghost">
                        Suspend
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
