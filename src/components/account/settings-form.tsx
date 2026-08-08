'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Bell, Globe, MapPinned, Save, Shield, User as UserIcon } from 'lucide-react';
import type { User } from '@/types';
import { profileSchema, type ProfileValues } from '@/lib/validation';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Separator, Slider, Switch } from '@/components/ui/primitives';

const NOTIFICATION_ITEMS = [
  { key: 'bookingUpdates', label: 'Статусы бронирований', hint: 'Подтверждение, напоминание, отмена' },
  { key: 'promotions', label: 'Акции и спецпредложения', hint: 'Только по интересным вам местам' },
  { key: 'recommendations', label: 'Персональные рекомендации', hint: 'Новые места под ваши вкусы' },
  { key: 'reviewReplies', label: 'Ответы на отзывы', hint: 'Когда заведение отвечает вам' },
] as const;

const CHANNELS = [
  { key: 'email', label: 'Email' },
  { key: 'push', label: 'Push-уведомления' },
  { key: 'sms', label: 'SMS' },
] as const;

/**
 * Настройки профиля. В демо изменения живут в состоянии компонента:
 * при подключении БД останется только вызвать PATCH /api/users/me.
 */
export function SettingsForm({ user }: { user: User }) {
  const [notifications, setNotifications] = React.useState(user.settings.notifications);
  const [allowGeolocation, setAllowGeolocation] = React.useState(
    user.settings.allowGeolocation,
  );
  const [budget, setBudget] = React.useState(user.preferences.budgetPerPerson);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      budgetPerPerson: user.preferences.budgetPerPerson,
      typicalPartySize: user.preferences.typicalPartySize,
    },
  });

  const onSubmit = form.handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success('Настройки сохранены');
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* ——— Профиль ——— */}
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <UserIcon className="size-4 text-muted-foreground" />
          Личные данные
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Эти данные подставляются в форму бронирования
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Имя" htmlFor="name" error={form.formState.errors.name?.message}>
            <Input id="name" {...form.register('name')} error={Boolean(form.formState.errors.name)} />
          </Field>
          <Field label="Телефон" htmlFor="phone" error={form.formState.errors.phone?.message}>
            <Input id="phone" type="tel" {...form.register('phone')} error={Boolean(form.formState.errors.phone)} />
          </Field>
          <Field
            label="Email"
            htmlFor="email"
            className="sm:col-span-2"
            error={form.formState.errors.email?.message}
          >
            <Input id="email" type="email" {...form.register('email')} error={Boolean(form.formState.errors.email)} />
          </Field>
        </div>
      </section>

      {/* ——— Предпочтения ——— */}
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <MapPinned className="size-4 text-muted-foreground" />
          Предпочтения подбора
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Влияют на рекомендации и AI-подбор
        </p>

        <div className="mt-5 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Комфортный бюджет на человека</span>
              <span className="rounded-lg bg-secondary px-2.5 py-1 text-sm font-semibold">
                {formatPrice(budget)}
              </span>
            </div>
            <Slider
              value={[budget]}
              min={2000}
              max={50000}
              step={1000}
              onValueChange={(value) => {
                setBudget(value[0]);
                form.setValue('budgetPerPerson', value[0]);
              }}
              aria-label="Бюджет"
            />
          </div>

          <Field
            label="Обычный размер компании"
            htmlFor="partySize"
            hint="Используем как значение по умолчанию в бронировании"
            error={form.formState.errors.typicalPartySize?.message}
          >
            <Input
              id="partySize"
              type="number"
              min={1}
              max={50}
              {...form.register('typicalPartySize', { valueAsNumber: true })}
            />
          </Field>

          <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <span>
              <span className="block text-sm font-medium">Использовать геолокацию</span>
              <span className="block text-xs text-muted-foreground">
                Нужна для сортировки «по расстоянию» и подбора мест рядом
              </span>
            </span>
            <Switch checked={allowGeolocation} onCheckedChange={setAllowGeolocation} />
          </label>
        </div>
      </section>

      {/* ——— Уведомления ——— */}
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Bell className="size-4 text-muted-foreground" />
          Уведомления
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Выберите, о чём сообщать — остальное не побеспокоит
        </p>

        <div className="mt-5 space-y-1">
          {NOTIFICATION_ITEMS.map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-secondary/50"
            >
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="block text-xs text-muted-foreground">{item.hint}</span>
              </span>
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={(checked) =>
                  setNotifications((current) => ({ ...current, [item.key]: checked }))
                }
              />
            </label>
          ))}
        </div>

        <Separator className="my-4" />

        <p className="text-xs font-medium text-muted-foreground">Каналы доставки</p>
        <div className="mt-2 space-y-1">
          {CHANNELS.map((channel) => (
            <label
              key={channel.key}
              className="flex items-center justify-between gap-4 rounded-xl px-2 py-2.5 transition-colors hover:bg-secondary/50"
            >
              <span className="text-sm">{channel.label}</span>
              <Switch
                checked={notifications.channels[channel.key]}
                onCheckedChange={(checked) =>
                  setNotifications((current) => ({
                    ...current,
                    channels: { ...current.channels, [channel.key]: checked },
                  }))
                }
              />
            </label>
          ))}
        </div>
      </section>

      {/* ——— Прочее ——— */}
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Globe className="size-4 text-muted-foreground" />
          Язык и приватность
        </h2>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <span>
              <span className="block text-sm font-medium">Язык интерфейса</span>
              <span className="block text-xs text-muted-foreground">
                Русский · қазақша и English появятся позже
              </span>
            </span>
            <span className="rounded-lg bg-secondary px-2.5 py-1 text-sm font-medium">
              Русский
            </span>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-dashed p-4">
            <Shield className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Мы не передаём ваши контакты третьим лицам. Заведение видит только имя,
              телефон и комментарий к брони.
            </p>
          </div>
        </div>
      </section>

      <div className="sticky bottom-20 z-10 flex justify-end lg:bottom-4">
        <Button type="submit" size="lg" isLoading={form.formState.isSubmitting}>
          <Save />
          Сохранить изменения
        </Button>
      </div>
    </form>
  );
}
