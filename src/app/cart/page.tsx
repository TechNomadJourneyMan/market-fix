'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Loader2, ShoppingBag, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  selectCartCount,
  selectCartTotal,
  useCartStore,
} from '@/store/use-cart-store';
import { apiClient, ApiError } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const clear = useCartStore((state) => state.clear);
  const updateGuests = useCartStore((state) => state.updateGuests);
  const count = useCartStore(selectCartCount);
  const total = useCartStore(selectCartTotal);

  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const checkout = async () => {
    if (!name || !phone || !email) {
      toast.error('Заполните контактные данные');
      return;
    }
    setLoading(true);
    try {
      const result = await apiClient.post<{ checkoutUrl: string }>('/api/cart/checkout', {
        name,
        phone,
        email,
        items: items.map((item) => ({
          venueId: item.venueId,
          date: item.date,
          time: item.time,
          guests: item.guests,
          comment: item.comment,
          extras: item.extras,
        })),
      });
      clear();
      toast.success('Брони созданы');
      router.push(result.checkoutUrl);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Ошибка оформления');
    } finally {
      setLoading(false);
    }
  };

  if (count === 0) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={<ShoppingBag />}
          title="Корзина пуста"
          description="Сюда попадают брони столов и заказы сервисов (доставка, аренда, подарки). Соберите несколько позиций и оплатите вместе."
          action={{ label: 'В каталог', href: '/catalog' }}
          secondaryAction={{ label: 'Сервисы', href: '/services' }}
        />
      </div>
    );
  }

  return (
    <div className="container py-8 sm:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Корзина</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Брони и сервисы · {count} позиций · ориентировочно {formatPrice(total)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={clear}>
          Очистить
        </Button>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:p-5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.venueImage}
                alt={item.venueName}
                className="h-36 w-full rounded-xl object-cover sm:size-28 sm:shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={
                        item.comment?.startsWith('[')
                          ? `/services/${item.venueSlug}`
                          : `/venue/${item.venueSlug}`
                      }
                      className="font-semibold hover:text-primary"
                    >
                      {item.venueName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{item.venueAddress}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"
                    aria-label="Удалить"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    {item.date} · {item.time}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    <select
                      value={item.guests}
                      onChange={(event) => updateGuests(item.id, Number(event.target.value))}
                      className="rounded-lg border bg-background px-2 py-0.5 text-sm"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12, 20].map((n) => (
                        <option key={n} value={n}>
                          {n} гостей
                        </option>
                      ))}
                    </select>
                  </span>
                </div>
                {item.comment ? (
                  <p className="text-xs text-muted-foreground">«{item.comment}»</p>
                ) : null}
                <p className="text-sm font-medium">{formatPrice(item.estimatedTotal)}</p>
              </div>
            </article>
          ))}
        </div>

        <aside className="h-fit space-y-4 rounded-3xl border bg-card p-5 shadow-soft lg:sticky lg:top-24">
          <h2 className="text-base font-semibold">Оформление</h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cart-name">Имя</Label>
              <Input
                id="cart-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Айгерим"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cart-phone">Телефон</Label>
              <Input
                id="cart-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+7 700 000 00 00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cart-email">Email</Label>
              <Input
                id="cart-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.kz"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4 text-sm">
            <span className="text-muted-foreground">Итого ориентировочно</span>
            <span className="text-lg font-semibold">{formatPrice(total)}</span>
          </div>

          <Button className="w-full" size="lg" onClick={checkout} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            Забронировать и оплатить
          </Button>
          <p className="text-xs text-muted-foreground">
            Для банкетов и клубов потребуется депозит. Обычные столы подтверждаются сразу.
          </p>
        </aside>
      </div>
    </div>
  );
}
