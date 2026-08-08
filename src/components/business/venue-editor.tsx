'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ImagePlus, Save, Trash2 } from 'lucide-react';
import type { Venue } from '@/types';
import { venueEditSchema, type VenueEditValues } from '@/lib/validation';
import { getWeekdayFull } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/badge';
import { AMENITY_OPTIONS } from '@/components/catalog/filters-panel';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

/**
 * Редактор карточки заведения.
 * В демо сохранение имитируется; схема валидации та же, что использует API.
 */
export function VenueEditor({ venue }: { venue: Venue }) {
  const [amenities, setAmenities] = React.useState<string[]>(venue.amenities);
  const [hours, setHours] = React.useState(venue.workingHours);
  const [isPublished, setIsPublished] = React.useState(venue.status === 'published');

  const form = useForm<VenueEditValues>({
    resolver: zodResolver(venueEditSchema),
    defaultValues: {
      name: venue.name,
      tagline: venue.tagline,
      description: venue.description,
      phone: venue.phone,
      email: venue.email,
      address: venue.location.address,
      averagePrice: venue.averagePrice,
      capacity: venue.capacity,
    },
  });

  const onSubmit = form.handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    toast.success('Карточка обновлена');
  });

  const toggleAmenity = (value: string) => {
    setAmenities((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Tabs defaultValue="general" className="space-y-5">
        <TabsList className="w-full overflow-x-auto sm:w-auto">
          <TabsTrigger value="general">Основное</TabsTrigger>
          <TabsTrigger value="photos">Фотографии</TabsTrigger>
          <TabsTrigger value="amenities">Удобства</TabsTrigger>
          <TabsTrigger value="schedule">Расписание</TabsTrigger>
        </TabsList>

        {/* ——— Основное ——— */}
        <TabsContent value="general" className="space-y-5">
          <section className="space-y-4 rounded-2xl border bg-card p-5">
            <h2 className="text-base font-semibold">Как гости видят карточку</h2>

            <Field label="Название" htmlFor="name" required error={form.formState.errors.name?.message}>
              <Input id="name" {...form.register('name')} error={Boolean(form.formState.errors.name)} />
            </Field>

            <Field
              label="Подзаголовок"
              htmlFor="tagline"
              required
              hint="Одна фраза, которая продаёт. Показывается в карточке каталога."
              error={form.formState.errors.tagline?.message}
            >
              <Input
                id="tagline"
                {...form.register('tagline')}
                error={Boolean(form.formState.errors.tagline)}
              />
            </Field>

            <Field
              label="Описание"
              htmlFor="description"
              required
              hint="Расскажите, чем вы отличаетесь. Гости читают этот блок перед бронью."
              error={form.formState.errors.description?.message}
            >
              <Textarea
                id="description"
                rows={7}
                className="min-h-[160px]"
                {...form.register('description')}
                error={Boolean(form.formState.errors.description)}
              />
            </Field>
          </section>

          <section className="space-y-4 rounded-2xl border bg-card p-5">
            <h2 className="text-base font-semibold">Контакты и параметры</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Телефон" htmlFor="phone" error={form.formState.errors.phone?.message}>
                <Input id="phone" {...form.register('phone')} error={Boolean(form.formState.errors.phone)} />
              </Field>
              <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
                <Input id="email" type="email" {...form.register('email')} error={Boolean(form.formState.errors.email)} />
              </Field>
              <Field
                label="Адрес"
                htmlFor="address"
                className="sm:col-span-2"
                error={form.formState.errors.address?.message}
              >
                <Input id="address" {...form.register('address')} error={Boolean(form.formState.errors.address)} />
              </Field>
              <Field
                label="Средний чек, ₸"
                htmlFor="averagePrice"
                hint="На одного гостя — используется в фильтрах"
                error={form.formState.errors.averagePrice?.message}
              >
                <Input
                  id="averagePrice"
                  type="number"
                  {...form.register('averagePrice', { valueAsNumber: true })}
                />
              </Field>
              <Field
                label="Вместимость"
                htmlFor="capacity"
                hint="Максимум гостей одновременно"
                error={form.formState.errors.capacity?.message}
              >
                <Input
                  id="capacity"
                  type="number"
                  {...form.register('capacity', { valueAsNumber: true })}
                />
              </Field>
            </div>

            <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <span>
                <span className="block text-sm font-medium">Опубликовано в каталоге</span>
                <span className="block text-xs text-muted-foreground">
                  Выключите, чтобы временно скрыть заведение от гостей
                </span>
              </span>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </label>
          </section>
        </TabsContent>

        {/* ——— Фотографии ——— */}
        <TabsContent value="photos">
          <section className="space-y-4 rounded-2xl border bg-card p-5">
            <div>
              <h2 className="text-base font-semibold">Фотографии</h2>
              <p className="text-sm text-muted-foreground">
                Первое фото становится обложкой. Заведения с 8+ фото получают на 40% больше
                броней.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {venue.photos.map((photo, index) => (
                <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.alt} className="size-full object-cover" />
                  {index === 0 ? (
                    <Badge variant="overlay" className="absolute left-2 top-2">
                      Обложка
                    </Badge>
                  ) : null}
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white opacity-0 backdrop-blur transition-opacity hover:bg-destructive group-hover:opacity-100"
                    aria-label="Удалить фото"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <ImagePlus className="size-6" />
                <span className="text-xs font-medium">Добавить</span>
              </button>
            </div>
          </section>
        </TabsContent>

        {/* ——— Удобства ——— */}
        <TabsContent value="amenities">
          <section className="space-y-4 rounded-2xl border bg-card p-5">
            <div>
              <h2 className="text-base font-semibold">Удобства и услуги</h2>
              <p className="text-sm text-muted-foreground">
                По ним гости фильтруют каталог — отмечайте всё, что у вас есть
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {AMENITY_OPTIONS.map((amenity) => {
                const isActive = amenities.includes(amenity.value);
                return (
                  <button
                    key={amenity.value}
                    type="button"
                    onClick={() => toggleAmenity(amenity.value)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all',
                      isActive
                        ? 'border-primary bg-primary/[0.05]'
                        : 'hover:border-foreground/20 hover:bg-secondary/50',
                    )}
                  >
                    <Icon
                      name={amenity.icon}
                      className={cn(
                        'size-4 shrink-0',
                        isActive ? 'text-primary' : 'text-muted-foreground',
                      )}
                    />
                    <span className="text-sm">{amenity.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </TabsContent>

        {/* ——— Расписание ——— */}
        <TabsContent value="schedule">
          <section className="space-y-4 rounded-2xl border bg-card p-5">
            <div>
              <h2 className="text-base font-semibold">Расписание работы</h2>
              <p className="text-sm text-muted-foreground">
                Определяет доступные слоты бронирования и фильтр «Сегодня открыто»
              </p>
            </div>

            <ul className="divide-y rounded-xl border">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const entry = hours.find((item) => item.day === day);
                if (!entry) return null;

                return (
                  <li key={day} className="flex flex-wrap items-center gap-3 p-3.5">
                    <span className="w-28 shrink-0 text-sm font-medium">
                      {getWeekdayFull(day)}
                    </span>

                    <Switch
                      checked={!entry.isClosed}
                      onCheckedChange={(checked) =>
                        setHours((current) =>
                          current.map((item) =>
                            item.day === day ? { ...item, isClosed: !checked } : item,
                          ),
                        )
                      }
                    />

                    {entry.isClosed ? (
                      <span className="text-sm text-muted-foreground">Выходной</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={entry.opensAt}
                          onChange={(event) =>
                            setHours((current) =>
                              current.map((item) =>
                                item.day === day
                                  ? { ...item, opensAt: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="h-9 w-28"
                        />
                        <span className="text-muted-foreground">—</span>
                        <Input
                          type="time"
                          value={entry.closesAt}
                          onChange={(event) =>
                            setHours((current) =>
                              current.map((item) =>
                                item.day === day
                                  ? { ...item, closesAt: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="h-9 w-28"
                        />
                        {entry.isOvernight ? (
                          <Badge variant="secondary" size="sm">
                            до утра
                          </Badge>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" size="lg" isLoading={form.formState.isSubmitting}>
          <Save />
          Сохранить карточку
        </Button>
      </div>
    </form>
  );
}
