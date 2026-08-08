'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, MessageSquare, Phone, Search, X } from 'lucide-react';
import type { Booking, BookingStatus } from '@/types';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { formatDate, formatGuests, formatPrice } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';

const STATUS_META: Record<
  BookingStatus,
  { label: string; variant: 'success' | 'warning' | 'secondary' | 'destructive' }
> = {
  pending: { label: 'Ожидает', variant: 'warning' },
  awaiting_payment: { label: 'Ждёт оплаты', variant: 'warning' },
  confirmed: { label: 'Подтверждено', variant: 'success' },
  completed: { label: 'Состоялось', variant: 'secondary' },
  cancelled: { label: 'Отменено', variant: 'destructive' },
  no_show: { label: 'Не пришли', variant: 'destructive' },
};

const FILTERS: { value: BookingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'pending', label: 'Ожидают' },
  { value: 'confirmed', label: 'Подтверждённые' },
  { value: 'completed', label: 'Состоявшиеся' },
  { value: 'cancelled', label: 'Отменённые' },
];

export function BusinessBookingsTable({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<BookingStatus | 'all'>('all');
  const [query, setQuery] = React.useState('');
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const filtered = bookings.filter((booking) => {
    if (filter !== 'all' && booking.status !== filter) return false;
    if (!query.trim()) return true;
    const needle = query.trim().toLowerCase();
    return (
      booking.guest.name.toLowerCase().includes(needle) ||
      booking.reference.toLowerCase().includes(needle) ||
      booking.venueName.toLowerCase().includes(needle)
    );
  });

  const updateStatus = async (id: string, status: BookingStatus) => {
    setBusyId(id);
    try {
      await apiClient.patch(`/api/bookings/${id}`, { status });
      toast.success(status === 'confirmed' ? 'Бронь подтверждена' : 'Бронь отменена');
      router.refresh();
    } catch {
      toast.error('Не удалось обновить статус');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Имя гостя или номер брони"
          icon={<Search />}
          className="sm:ml-auto sm:max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="Ничего не найдено"
          description="Попробуйте изменить фильтр или очистить поиск."
          action={{
            label: 'Показать все',
            onClick: () => {
              setFilter('all');
              setQuery('');
            },
          }}
          compact
        />
      ) : (
        <>
          {/* Десктоп — таблица */}
          <div className="hidden overflow-hidden rounded-2xl border lg:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Гость</th>
                  <th className="px-4 py-3 text-left font-medium">Объект</th>
                  <th className="px-4 py-3 text-left font-medium">Дата и время</th>
                  <th className="px-4 py-3 text-left font-medium">Гостей</th>
                  <th className="px-4 py-3 text-left font-medium">Сумма</th>
                  <th className="px-4 py-3 text-left font-medium">Статус</th>
                  <th className="px-4 py-3 text-right font-medium">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.slice(0, 40).map((booking) => (
                  <tr key={booking.id} className="transition-colors hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <p className="font-medium">{booking.guest.name}</p>
                      <p className="text-xs text-muted-foreground">{booking.reference}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{booking.venueName}</td>
                    <td className="px-4 py-3">
                      {formatDate(booking.date)}
                      <span className="text-muted-foreground"> · {booking.time}</span>
                    </td>
                    <td className="px-4 py-3">{booking.guests}</td>
                    <td className="px-4 py-3">
                      {booking.total > 0 ? formatPrice(booking.total) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_META[booking.status].variant} size="sm">
                        {STATUS_META[booking.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {booking.status === 'pending' ? (
                          <>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              disabled={busyId === booking.id}
                              onClick={() => updateStatus(booking.id, 'confirmed')}
                              aria-label="Подтвердить"
                            >
                              <Check />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              disabled={busyId === booking.id}
                              onClick={() => updateStatus(booking.id, 'cancelled')}
                              aria-label="Отклонить"
                            >
                              <X />
                            </Button>
                          </>
                        ) : (
                          <Button size="icon-sm" variant="ghost" aria-label="Позвонить">
                            <Phone />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Мобильные — карточки */}
          <ul className="space-y-3 lg:hidden">
            {filtered.slice(0, 30).map((booking) => (
              <li key={booking.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{booking.guest.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.venueName} · {booking.reference}
                    </p>
                  </div>
                  <Badge variant={STATUS_META[booking.status].variant} size="sm">
                    {STATUS_META[booking.status].label}
                  </Badge>
                </div>

                <p className="mt-2 text-sm">
                  {formatDate(booking.date)} в {booking.time} · {formatGuests(booking.guests)}
                  {booking.total > 0 ? ` · ${formatPrice(booking.total)}` : ''}
                </p>

                {booking.comment ? (
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MessageSquare className="mt-0.5 size-3 shrink-0" />«{booking.comment}»
                  </p>
                ) : null}

                {booking.status === 'pending' ? (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={busyId === booking.id}
                      onClick={() => updateStatus(booking.id, 'confirmed')}
                    >
                      <Check />
                      Подтвердить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === booking.id}
                      onClick={() => updateStatus(booking.id, 'cancelled')}
                    >
                      Отклонить
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground">
            Показано {Math.min(filtered.length, 40)} из {filtered.length} броней
          </p>
        </>
      )}
    </div>
  );
}
