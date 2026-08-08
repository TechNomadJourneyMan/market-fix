'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Category, Cuisine, District } from '@/types';
import { createVenueSchema, type CreateVenueValues } from '@/lib/validation';
import { apiClient, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const AMENITIES = [
  { value: 'parking', label: 'Парковка' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'terrace', label: 'Терраса' },
  { value: 'kids', label: 'Детская зона' },
  { value: 'vip', label: 'VIP' },
  { value: 'music', label: 'Живая музыка' },
  { value: 'halal', label: 'Халяль' },
  { value: 'delivery', label: 'Доставка' },
  { value: 'banquet', label: 'Банкет' },
  { value: 'card_payment', label: 'Оплата картой' },
];

export function AddVenueForm({
  categories,
  cuisines,
  districts,
}: {
  categories: Category[];
  cuisines: Cuisine[];
  districts: District[];
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateVenueValues>({
    resolver: zodResolver(createVenueSchema),
    defaultValues: {
      name: '',
      tagline: '',
      description: '',
      categoryId: categories[0]?.id ?? '',
      cuisineIds: [],
      districtId: districts[0]?.id ?? '',
      address: '',
      phone: '+7 ',
      email: '',
      averagePrice: 8000,
      capacity: 60,
      amenities: ['wifi', 'card_payment'],
      tags: [],
    },
  });

  const cuisineIds = watch('cuisineIds') ?? [];
  const amenities = watch('amenities') ?? [];

  const toggle = (key: 'cuisineIds' | 'amenities', value: string) => {
    const current = watch(key) ?? [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setValue(key, next, { shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await apiClient.post<{ slug: string }>('/api/business/venues', values);
      toast.success('Заведение добавлено и опубликовано');
      router.push(`/business/venues/${result.slug}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить');
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Название" error={errors.name?.message}>
          <Input {...register('name')} placeholder="Nuala / Chechil / Sandyq" />
        </Field>
        <Field label="Категория" error={errors.categoryId?.message}>
          <select
            {...register('categoryId')}
            className="flex h-11 w-full rounded-xl border bg-background px-3 text-sm"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <Field label="Короткий слоган" error={errors.tagline?.message}>
        <Input {...register('tagline')} placeholder="Авторская кухня и панорама города" />
      </Field>

      <Field label="Описание" error={errors.description?.message}>
        <textarea
          {...register('description')}
          rows={5}
          className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm"
          placeholder="Расскажите атмосферу, кухню, для кого место и чем оно выделяется…"
        />
      </Field>

      <div>
        <Label>Кухня</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {cuisines.map((cuisine) => (
            <Chip
              key={cuisine.id}
              active={cuisineIds.includes(cuisine.id)}
              onClick={() => toggle('cuisineIds', cuisine.id)}
            >
              {cuisine.name}
            </Chip>
          ))}
        </div>
        {errors.cuisineIds ? (
          <p className="mt-1 text-xs text-destructive">{errors.cuisineIds.message}</p>
        ) : null}
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Район" error={errors.districtId?.message}>
          <select
            {...register('districtId')}
            className="flex h-11 w-full rounded-xl border bg-background px-3 text-sm"
          >
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Адрес" error={errors.address?.message}>
          <Input {...register('address')} placeholder="ул. Достык, 43" />
        </Field>
        <Field label="Телефон" error={errors.phone?.message}>
          <Input {...register('phone')} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input {...register('email')} type="email" placeholder="hello@venue.kz" />
        </Field>
        <Field label="Средний чек, ₸" error={errors.averagePrice?.message}>
          <Input
            type="number"
            {...register('averagePrice', { valueAsNumber: true })}
          />
        </Field>
        <Field label="Вместимость" error={errors.capacity?.message}>
          <Input type="number" {...register('capacity', { valueAsNumber: true })} />
        </Field>
      </section>

      <div>
        <Label>Удобства</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {AMENITIES.map((item) => (
            <Chip
              key={item.value}
              active={amenities.includes(item.value)}
              onClick={() => toggle('amenities', item.value)}
            >
              {item.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t pt-5">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Отмена
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          Опубликовать место
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'hover:border-foreground/20 hover:bg-secondary',
      )}
    >
      {children}
    </button>
  );
}
