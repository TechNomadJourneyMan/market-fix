'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MarketplaceListing } from '@/types';
import { useCartStore } from '@/store/use-cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ServiceOrderForm({ listing }: { listing: MarketplaceListing }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [date, setDate] = React.useState('');
  const [comment, setComment] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !phone) {
      toast.error('Укажите имя и телефон');
      return;
    }
    setLoading(true);
    try {
      addItem({
        venueId: listing.id,
        venueSlug: listing.slug,
        venueName: listing.name,
        venueImage: listing.coverImage,
        venueAddress: listing.location.address,
        date: date || new Date().toISOString().slice(0, 10),
        time: '12:00',
        guests: 1,
        comment: `[${listing.vertical}] ${comment || listing.ctaLabel}`,
        estimatedTotal: listing.priceFrom,
        extras: [
          {
            serviceId: listing.id,
            name: listing.name,
            price: listing.priceFrom,
            quantity: 1,
          },
        ],
      });
      toast.success('Добавлено в корзину — можно оформить оплату');
      router.push('/cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-5">
      <div>
        <p className="text-lg font-semibold">{listing.ctaLabel}</p>
        <p className="text-sm text-muted-foreground">
          {listing.priceLabel} · {listing.priceUnit}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="svc-name">Имя</Label>
        <Input
          id="svc-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Как к вам обращаться"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="svc-phone">Телефон</Label>
        <Input
          id="svc-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+7 7XX XXX XX XX"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="svc-date">Дата / когда нужно</Label>
        <Input
          id="svc-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="svc-comment">Комментарий</Label>
        <Input
          id="svc-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Адрес, детали, пожелания"
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : null}
        {listing.ctaLabel} · в корзину
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Без скрытых комиссий. Поставщик подтвердит заказ в течение 15 минут.
      </p>
    </form>
  );
}
