'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useT } from '@/i18n/client';

function todayKey() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function QuickBook({
  districts,
  cuisines,
}: {
  districts: { id: string; slug: string; name: string }[];
  cuisines: { id: string; slug: string; name: string }[];
}) {
  const t = useT('home');
  const router = useRouter();
  const [date, setDate] = React.useState(todayKey());
  const [time, setTime] = React.useState('19:00');
  const [guests, setGuests] = React.useState(2);
  const [district, setDistrict] = React.useState('');
  const [cuisine, setCuisine] = React.useState('');

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams({
      date,
      time,
      guests: String(guests),
      availableNow: '1',
    });
    if (district) params.set('district', district);
    if (cuisine) params.set('cuisine', cuisine);
    router.push(`/catalog?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-8 grid w-full max-w-3xl gap-2 rounded-2xl border bg-card/90 p-3 shadow-lift backdrop-blur sm:grid-cols-[1.1fr_0.9fr_0.7fr_1fr_auto]"
    >
      <label className="block text-left text-xs">
        <span className="mb-1 block px-1 text-muted-foreground">{t('hero.quickBook.date')}</span>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label className="block text-left text-xs">
        <span className="mb-1 block px-1 text-muted-foreground">{t('hero.quickBook.time')}</span>
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
      </label>
      <label className="block text-left text-xs">
        <span className="mb-1 block px-1 text-muted-foreground">{t('hero.quickBook.guests')}</span>
        <Input
          type="number"
          min={1}
          max={40}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value) || 1)}
          required
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-left text-xs">
          <span className="mb-1 block px-1 text-muted-foreground">{t('hero.quickBook.district')}</span>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
          >
            <option value="">{t('hero.quickBook.any')}</option>
            {districts.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-left text-xs">
          <span className="mb-1 block px-1 text-muted-foreground">{t('hero.quickBook.cuisine')}</span>
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
          >
            <option value="">{t('hero.quickBook.any')}</option>
            {cuisines.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-end">
        <Button type="submit" size="lg" className="w-full">
          <CalendarCheck className="size-4" />
          {t('hero.quickBook.cta')}
        </Button>
      </div>
    </form>
  );
}
