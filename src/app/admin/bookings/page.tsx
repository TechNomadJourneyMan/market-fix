import Link from 'next/link';

import { requireAdminPermission } from '@/server/admin/auth';
import { listAdminBookings } from '@/server/repositories/admin';
import { BookingStatusBadge } from '@/components/admin/status-badge';
import { changeBookingStatusAction } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdminPermission('bookings.read');
  const params = await searchParams;
  const bookings = listAdminBookings({
    status: params.status as never,
    q: params.q,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Бронирования</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Статусы, отмены, no-show и ручные изменения.
          </p>
        </div>
        <form className="flex gap-2">
          <Input name="q" defaultValue={params.q} placeholder="Референс / гость / заведение" className="w-64" />
          <Button type="submit" variant="outline">
            Найти
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {['', 'pending', 'confirmed', 'cancelled', 'no_show', 'completed'].map((status) => (
          <Link
            key={status || 'all'}
            href={status ? `/admin/bookings?status=${status}` : '/admin/bookings'}
            className="rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
          >
            {status || 'Все'}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-secondary/50 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Бронь</th>
              <th className="px-4 py-3 font-medium">Заведение</th>
              <th className="px-4 py-3 font-medium">Гость</th>
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {bookings.slice(0, 100).map((booking) => (
              <tr key={booking.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{booking.reference}</div>
                  <div className="text-xs text-muted-foreground">{booking.guests} гостей</div>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/venues/${booking.venueSlug}`} className="hover:underline">
                    {booking.venueName}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div>{booking.guest.name}</div>
                  <div className="text-xs text-muted-foreground">{booking.guest.phone}</div>
                </td>
                <td className="px-4 py-3">
                  {booking.date} · {booking.time}
                </td>
                <td className="px-4 py-3">
                  <BookingStatusBadge status={booking.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <form action={changeBookingStatusAction}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="status" value="confirmed" />
                      <Button type="submit" size="sm" variant="outline">
                        Confirm
                      </Button>
                    </form>
                    <form action={changeBookingStatusAction}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="status" value="no_show" />
                      <Button type="submit" size="sm" variant="ghost">
                        No-show
                      </Button>
                    </form>
                    <form action={changeBookingStatusAction}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="status" value="cancelled" />
                      <input type="hidden" name="reason" value="Отмена администратором" />
                      <Button type="submit" size="sm" variant="ghost">
                        Cancel
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
