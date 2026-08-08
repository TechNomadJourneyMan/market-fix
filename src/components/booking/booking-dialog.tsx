'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  CalendarDays,
  Check,
  Clock,
  Flame,
  Loader2,
  MessageSquare,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Users,
} from 'lucide-react';
import type { AvailabilityDay } from '@/types';
import { apiClient, ApiError, queryKeys } from '@/lib/api-client';
import { bookingFormSchema, type BookingFormValues } from '@/lib/validation';
import { cn } from '@/lib/utils';
import {
  formatDateChip,
  formatDateWithWeekday,
  formatGuests,
  formatPrice,
  formatRating,
  parseDate,
  plural,
} from '@/lib/format';
import { useBookingStore } from '@/store/use-booking-store';
import { useCartStore } from '@/store/use-cart-store';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/primitives';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface AvailabilityRange {
  days: { date: string; isWorkingDay: boolean; freeSlots: number }[];
}

const DEFAULT_USER = {
  name: 'Айгерим Смагулова',
  phone: '+7 701 234 56 78',
  email: 'aigerim@example.kz',
};

/**
 * Модальное окно бронирования.
 * Открывается из любого места приложения через useBookingStore.
 */
export function BookingDialog() {
  const router = useRouter();
  const { target, isOpen, prefill, close } = useBookingStore();
  const addToCart = useCartStore((state) => state.addItem);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    mode: 'onBlur',
    defaultValues: {
      date: '',
      time: '',
      guests: 2,
      comment: '',
      name: DEFAULT_USER.name,
      phone: DEFAULT_USER.phone,
      email: DEFAULT_USER.email,
      agree: true as never,
    },
  });

  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  const guests = form.watch('guests');

  const { data: range, isLoading: isRangeLoading } = useQuery({
    queryKey: queryKeys.availabilityRange(target?.id ?? ''),
    queryFn: () => apiClient.get<AvailabilityRange>(`/api/availability?venueId=${target!.id}`),
    enabled: Boolean(target?.id) && isOpen,
  });

  const { data: availability, isFetching: isSlotsFetching } = useQuery({
    queryKey: queryKeys.availability(target?.id ?? '', selectedDate),
    queryFn: () =>
      apiClient.get<AvailabilityDay>(
        `/api/availability?venueId=${target!.id}&date=${selectedDate}`,
      ),
    enabled: Boolean(target?.id && selectedDate) && isOpen,
  });

  // Первую доступную дату подставляем автоматически — на один клик меньше.
  React.useEffect(() => {
    if (!isOpen || !range?.days.length || form.getValues('date')) return;
    const firstOpen =
      range.days.find((day) => day.isWorkingDay && day.freeSlots > 0) ?? range.days[0];
    form.setValue('date', prefill.date ?? firstOpen.date);
    if (prefill.guests) form.setValue('guests', prefill.guests);
  }, [isOpen, range, prefill, form]);

  // Сбрасываем время при смене даты, чтобы не отправить недоступный слот.
  React.useEffect(() => {
    if (!availability) return;
    const current = form.getValues('time');
    const stillAvailable = availability.slots.some(
      (slot) => slot.time === current && slot.isAvailable,
    );
    if (stillAvailable) return;

    const preferred = prefill.time
      ? availability.slots.find((slot) => slot.time === prefill.time && slot.isAvailable)
      : undefined;
    const fallback = availability.slots.find((slot) => slot.isAvailable);
    form.setValue('time', preferred?.time ?? fallback?.time ?? '');
  }, [availability, form, prefill.time]);

  React.useEffect(() => {
    if (!isOpen) {
      // Полный сброс формы после закрытия — следующее открытие начинается с чистого листа.
      const timer = setTimeout(() => form.reset(), 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!target) return;
    try {
      const result = await apiClient.post<{
        booking: { id: string; reference: string };
        requiresPayment: boolean;
        nextHref: string;
      }>('/api/bookings', {
        venueId: target.id,
        date: values.date,
        time: values.time,
        guests: values.guests,
        comment: values.comment,
        name: values.name,
        phone: values.phone,
        email: values.email,
      });

      close();
      toast.success(
        result.requiresPayment
          ? 'Бронь создана — осталось оплатить депозит'
          : `Стол забронирован! Номер брони ${result.booking.reference}`,
      );
      router.push(result.nextHref);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Не удалось создать бронь';
      toast.error(message);
    }
  });

  const estimate = target ? target.averagePrice * guests : 0;

  const onAddToCart = () => {
    if (!target) return;
    const values = form.getValues();
    if (!values.date || !values.time) {
      toast.error('Выберите дату и время');
      return;
    }
    addToCart({
      venueId: target.id,
      venueSlug: target.slug,
      venueName: target.name,
      venueImage: target.coverImage,
      venueAddress: target.address,
      date: values.date,
      time: values.time,
      guests: values.guests,
      comment: values.comment,
      estimatedTotal: estimate,
      extras: [],
    });
    toast.success('Добавлено в корзину броней', {
      action: {
        label: 'Открыть',
        onClick: () => router.push('/cart'),
      },
    });
    close();
  };

  if (!target) return null;

  const availableSlots = availability?.slots.filter((slot) => slot.isAvailable) ?? [];
  const selectedSlot = availability?.slots.find((slot) => slot.time === selectedTime);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? null : close())}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start gap-3 pr-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={target.coverImage}
              alt=""
              className="size-14 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg">{target.name}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  {formatRating(target.rating)}
                </span>
                <span>·</span>
                <span>{target.categoryName}</span>
                <span>·</span>
                <span className="truncate">{target.address}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-6 py-5">
          {/* ——— Дата ——— */}
          <section className="space-y-2.5">
            <p className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="size-4 text-muted-foreground" /> Дата
            </p>

            {isRangeLoading ? (
              <div className="flex gap-2 overflow-hidden">
                {Array.from({ length: 5 }, (_, index) => (
                  <Skeleton key={index} className="h-[62px] w-[76px] shrink-0" />
                ))}
              </div>
            ) : (
              <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {range?.days.map((day) => {
                  const date = parseDate(day.date);
                  const isSelected = selectedDate === day.date;
                  const isDisabled = !day.isWorkingDay || day.freeSlots === 0;

                  return (
                    <button
                      key={day.date}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => form.setValue('date', day.date)}
                      className={cn(
                        'flex w-[80px] shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 text-center transition-all',
                        isSelected
                          ? 'border-primary bg-primary/8 shadow-glow'
                          : 'hover:border-foreground/20 hover:bg-secondary',
                        isDisabled && 'cursor-not-allowed opacity-40 hover:border-border hover:bg-transparent',
                      )}
                    >
                      <span
                        className={cn(
                          'text-xs font-semibold',
                          isSelected ? 'text-primary' : 'text-foreground',
                        )}
                      >
                        {formatDateChip(date, parseDate(range.days[0].date))}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {day.isWorkingDay
                          ? day.freeSlots > 0
                            ? `${day.freeSlots} ${plural(day.freeSlots, 'слот', 'слота', 'слотов')}`
                            : 'нет мест'
                          : 'выходной'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* ——— Время ——— */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Clock className="size-4 text-muted-foreground" /> Время
              </p>
              {isSlotsFetching ? (
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              ) : null}
            </div>

            {availableSlots.length === 0 && !isSlotsFetching ? (
              <p className="rounded-xl border border-dashed bg-muted/40 px-4 py-5 text-center text-sm text-muted-foreground">
                На этот день свободных слотов не осталось. Выберите другую дату — рядом почти
                всегда есть места.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {availability?.slots.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => form.setValue('time', slot.time)}
                      className={cn(
                        'relative rounded-xl border py-2 text-sm font-medium transition-all',
                        isSelected
                          ? 'border-primary bg-primary/8 text-primary shadow-glow'
                          : 'hover:border-foreground/20 hover:bg-secondary',
                        !slot.isAvailable &&
                          'cursor-not-allowed text-muted-foreground/50 line-through hover:border-border hover:bg-transparent',
                      )}
                    >
                      {slot.time}
                      {slot.isPopular && slot.isAvailable ? (
                        <Flame className="absolute -right-1 -top-1 size-3.5 fill-orange-400 text-orange-500" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedSlot && selectedSlot.seatsLeft <= 6 ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-warning">
                <Flame className="size-3.5" />
                Осталось {selectedSlot.seatsLeft}{' '}
                {plural(selectedSlot.seatsLeft, 'место', 'места', 'мест')} на это время
              </p>
            ) : null}
            {form.formState.errors.time ? (
              <p className="text-xs font-medium text-destructive">
                {form.formState.errors.time.message}
              </p>
            ) : null}
          </section>

          {/* ——— Гости ——— */}
          <section className="space-y-2.5">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Users className="size-4 text-muted-foreground" /> Количество гостей
            </p>
            <div className="flex items-center justify-between rounded-xl border p-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={guests <= 1}
                onClick={() => form.setValue('guests', Math.max(1, guests - 1))}
                aria-label="Меньше гостей"
              >
                <Minus />
              </Button>
              <span className="text-sm font-semibold">{formatGuests(guests)}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={guests >= Math.min(target.capacity, 60)}
                onClick={() => form.setValue('guests', guests + 1)}
                aria-label="Больше гостей"
              >
                <Plus />
              </Button>
            </div>
            {guests >= 8 ? (
              <p className="text-xs text-muted-foreground">
                Для компании от 8 человек заведение подтвердит бронь по телефону и предложит
                банкетное меню.
              </p>
            ) : null}
          </section>

          {/* ——— Комментарий ——— */}
          <Field
            label="Комментарий к брони"
            htmlFor="booking-comment"
            hint="Стол у окна, детский стульчик, аллергии — всё, что важно знать заранее"
            error={form.formState.errors.comment?.message}
          >
            <Textarea
              id="booking-comment"
              placeholder="Например: отмечаем день рождения, нужен торт со свечами"
              {...form.register('comment')}
            />
          </Field>

          {/* ——— Контакты ——— */}
          <section className="space-y-4 rounded-2xl border bg-muted/30 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="size-4 text-muted-foreground" /> Контакты для
              подтверждения
            </p>

            <Field label="Имя" htmlFor="booking-name" required error={form.formState.errors.name?.message}>
              <Input id="booking-name" placeholder="Как к вам обращаться" {...form.register('name')} error={Boolean(form.formState.errors.name)} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Телефон" htmlFor="booking-phone" required error={form.formState.errors.phone?.message}>
                <Input id="booking-phone" type="tel" placeholder="+7 700 000 00 00" {...form.register('phone')} error={Boolean(form.formState.errors.phone)} />
              </Field>
              <Field label="Email" htmlFor="booking-email" required error={form.formState.errors.email?.message}>
                <Input id="booking-email" type="email" placeholder="you@example.kz" {...form.register('email')} error={Boolean(form.formState.errors.email)} />
              </Field>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5">
              <Checkbox
                checked={form.watch('agree') as unknown as boolean}
                onCheckedChange={(checked) =>
                  form.setValue('agree', Boolean(checked) as never, { shouldValidate: true })
                }
                className="mt-0.5"
              />
              <span className="text-xs leading-relaxed text-muted-foreground">
                Согласен с правилами бронирования: стол держат 20 минут после указанного
                времени, отмена — не позже чем за 2 часа.
              </span>
            </label>
            {form.formState.errors.agree ? (
              <p className="text-xs font-medium text-destructive">
                {form.formState.errors.agree.message}
              </p>
            ) : null}
          </section>
        </DialogBody>

        <DialogFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <div>
              <p className="text-xs text-muted-foreground">Ориентировочно</p>
              <p className="text-base font-semibold">{formatPrice(estimate)}</p>
            </div>
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="size-3" /> Бронь бесплатна
            </Badge>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              size="lg"
              variant="outline"
              onClick={onAddToCart}
              className="w-full sm:w-auto"
            >
              <ShoppingBag />В корзину
            </Button>
            <Button
              size="lg"
              onClick={onSubmit}
              isLoading={form.formState.isSubmitting}
              className="w-full sm:w-auto"
            >
              {form.formState.isSubmitting ? 'Отправляем…' : 'Забронировать сейчас'}
            </Button>
          </div>
        </DialogFooter>

        {selectedDate && selectedTime ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-t px-5 py-2.5 text-center text-xs text-muted-foreground"
          >
            <Check className="mr-1 inline size-3 text-success" />
            {formatDateWithWeekday(selectedDate)}, {selectedTime} · {formatGuests(guests)}
          </motion.p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
