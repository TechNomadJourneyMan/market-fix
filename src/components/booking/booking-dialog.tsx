'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
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
import { parseDate } from '@/lib/format';
import { formatDateI18n, formatPriceI18n, formatRatingI18n } from '@/i18n/format';
import { useLocale, useT } from '@/i18n/client';
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
  const t = useT('booking');
  const tCommon = useT('common');
  const locale = useLocale();
  const { target, isOpen, prefill, close } = useBookingStore();
  const addToCart = useCartStore((state) => state.addItem);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      date: '',
      time: '',
      guests: 2,
      comment: '',
      name: DEFAULT_USER.name,
      phone: DEFAULT_USER.phone,
      email: DEFAULT_USER.email,
      agree: true,
    },
  });

  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  const guests = form.watch('guests');

  const {
    data: range,
    isLoading: isRangeLoading,
    isError: isRangeError,
  } = useQuery({
    queryKey: queryKeys.availabilityRange(target?.id ?? ''),
    queryFn: () => apiClient.get<AvailabilityRange>(`/api/availability?venueId=${target!.id}`),
    enabled: Boolean(target?.id) && isOpen,
  });

  const {
    data: availability,
    isLoading: isSlotsLoading,
    isFetching: isSlotsFetching,
    isError: isSlotsError,
  } = useQuery({
    queryKey: queryKeys.availability(target?.id ?? '', selectedDate),
    queryFn: () =>
      apiClient.get<AvailabilityDay>(
        `/api/availability?venueId=${target!.id}&date=${selectedDate}`,
      ),
    enabled: Boolean(target?.id && selectedDate) && isOpen,
  });

  // При открытии — сброс и предзаполнение.
  React.useEffect(() => {
    if (!isOpen || !target) return;
    setSubmitError(null);
    form.reset({
      date: prefill.date ?? '',
      time: prefill.time ?? '',
      guests: prefill.guests ?? 2,
      comment: '',
      name: DEFAULT_USER.name,
      phone: DEFAULT_USER.phone,
      email: DEFAULT_USER.email,
      agree: true,
    });
  }, [isOpen, target?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Первую доступную дату подставляем автоматически.
  React.useEffect(() => {
    if (!isOpen || !range?.days.length) return;
    if (form.getValues('date')) return;
    const firstOpen =
      range.days.find((day) => day.isWorkingDay && day.freeSlots > 0) ?? range.days[0];
    form.setValue('date', firstOpen.date, { shouldValidate: true });
  }, [isOpen, range, form]);

  // Сбрасываем/выбираем время при смене даты.
  React.useEffect(() => {
    if (!availability?.slots?.length) return;
    const current = form.getValues('time');
    const stillAvailable = availability.slots.some(
      (slot) => slot.time === current && slot.isAvailable,
    );
    if (stillAvailable) return;

    const preferred = prefill.time
      ? availability.slots.find((slot) => slot.time === prefill.time && slot.isAvailable)
      : undefined;
    const fallback = availability.slots.find((slot) => slot.isAvailable);
    form.setValue('time', preferred?.time ?? fallback?.time ?? '', { shouldValidate: true });
  }, [availability, form, prefill.time]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!target) return;
    setSubmitError(null);
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
          ? t('toast.createdNeedsPayment')
          : t('toast.created', { reference: result.booking.reference }),
      );
      // hard navigation надёжнее router.push после модалки (особенно на cold start)
      window.location.assign(result.nextHref);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : t('toast.createError');
      setSubmitError(message);
      toast.error(message);
    }
  });

  const estimate = target ? target.averagePrice * guests : 0;

  const onAddToCart = () => {
    if (!target) return;
    const values = form.getValues();
    if (!values.date || !values.time) {
      toast.error(t('toast.pickDateTime'));
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
    toast.success(t('toast.addedToCart'), {
      action: {
        label: t('toast.openCart'),
        onClick: () => router.push('/cart'),
      },
    });
    close();
  };

  const availableSlots = availability?.slots.filter((slot) => slot.isAvailable) ?? [];
  const selectedSlot = availability?.slots.find((slot) => slot.time === selectedTime);
  const slotsPending = Boolean(selectedDate) && (isSlotsLoading || (isSlotsFetching && !availability));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent className="sm:max-w-xl">
        {!target ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Загрузка…</div>
        ) : (
          <form onSubmit={onSubmit} className="flex max-h-[inherit] flex-col">
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
                      {formatRatingI18n(target.rating, locale)}
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
              <section className="space-y-2.5">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                  {t('dialog.date')}
                </p>

                {isRangeLoading ? (
                  <div className="flex gap-2 overflow-hidden">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Skeleton key={index} className="h-[62px] w-[76px] shrink-0" />
                    ))}
                  </div>
                ) : isRangeError ? (
                  <p className="rounded-xl border border-dashed px-4 py-5 text-center text-sm text-destructive">
                    Не удалось загрузить даты. Закройте окно и попробуйте снова.
                  </p>
                ) : (
                  <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {range?.days.map((day, dayIndex) => {
                      const date = parseDate(day.date);
                      const isSelected = selectedDate === day.date;
                      const isDisabled = !day.isWorkingDay || day.freeSlots === 0;
                      const dateLabel =
                        dayIndex === 0
                          ? t('dialog.today')
                          : dayIndex === 1
                            ? t('dialog.tomorrow')
                            : formatDateI18n(date, locale, {
                                day: 'numeric',
                                month: 'short',
                              });

                      return (
                        <button
                          key={day.date}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            form.setValue('date', day.date, { shouldValidate: true });
                            form.setValue('time', '');
                          }}
                          className={cn(
                            'flex w-[80px] shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 text-center transition-all',
                            isSelected
                              ? 'border-primary bg-primary/8 shadow-glow'
                              : 'hover:border-foreground/20 hover:bg-secondary',
                            isDisabled &&
                              'cursor-not-allowed opacity-40 hover:border-border hover:bg-transparent',
                          )}
                        >
                          <span
                            className={cn(
                              'text-xs font-semibold',
                              isSelected ? 'text-primary' : 'text-foreground',
                            )}
                          >
                            {dateLabel}
                          </span>
                          <span className="text-[10px] leading-tight text-muted-foreground">
                            {day.isWorkingDay
                              ? day.freeSlots > 0
                                ? t('dialog.slots', { count: day.freeSlots })
                                : t('dialog.noSeats')
                              : t('dialog.dayOff')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {form.formState.errors.date ? (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.date.message}
                  </p>
                ) : null}
              </section>

              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="size-4 shrink-0 text-muted-foreground" /> {t('dialog.time')}
                  </p>
                  {slotsPending ? (
                    <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                  ) : null}
                </div>

                {!selectedDate ? (
                  <p className="rounded-xl border border-dashed bg-muted/40 px-4 py-5 text-center text-sm text-muted-foreground">
                    Сначала выберите дату
                  </p>
                ) : slotsPending ? (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {Array.from({ length: 8 }, (_, index) => (
                      <Skeleton key={index} className="h-10 rounded-xl" />
                    ))}
                  </div>
                ) : isSlotsError ? (
                  <p className="rounded-xl border border-dashed px-4 py-5 text-center text-sm text-destructive">
                    Не удалось загрузить слоты. Выберите другую дату.
                  </p>
                ) : availableSlots.length === 0 ? (
                  <p className="rounded-xl border border-dashed bg-muted/40 px-4 py-5 text-center text-sm text-muted-foreground">
                    {t('dialog.noSlots')}
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
                          onClick={() =>
                            form.setValue('time', slot.time, { shouldValidate: true })
                          }
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
                    <Flame className="size-3.5 shrink-0" />
                    {t('dialog.seatsLeft', { count: selectedSlot.seatsLeft })}
                  </p>
                ) : null}
                {form.formState.errors.time ? (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.time.message}
                  </p>
                ) : null}
              </section>

              <section className="space-y-2.5">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Users className="size-4 shrink-0 text-muted-foreground" /> {t('dialog.guests')}
                </p>
                <div className="flex items-center justify-between rounded-xl border p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={guests <= 1}
                    onClick={() => form.setValue('guests', Math.max(1, guests - 1))}
                    aria-label={t('dialog.guestsLess')}
                  >
                    <Minus />
                  </Button>
                  <span className="text-sm font-semibold">
                    {tCommon('counts.guests', { count: guests })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={guests >= Math.min(target.capacity, 60)}
                    onClick={() => form.setValue('guests', guests + 1)}
                    aria-label={t('dialog.guestsMore')}
                  >
                    <Plus />
                  </Button>
                </div>
              </section>

              <Field
                label={t('dialog.commentLabel')}
                htmlFor="booking-comment"
                hint={t('dialog.commentHint')}
                error={form.formState.errors.comment?.message}
              >
                <Textarea
                  id="booking-comment"
                  placeholder={t('dialog.commentPlaceholder')}
                  {...form.register('comment')}
                />
              </Field>

              <section className="space-y-4 rounded-2xl border bg-muted/30 p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                  {t('dialog.contactsTitle')}
                </p>

                <Field
                  label={t('dialog.nameLabel')}
                  htmlFor="booking-name"
                  required
                  error={form.formState.errors.name?.message}
                >
                  <Input
                    id="booking-name"
                    placeholder={t('dialog.namePlaceholder')}
                    {...form.register('name')}
                    error={Boolean(form.formState.errors.name)}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={t('dialog.phoneLabel')}
                    htmlFor="booking-phone"
                    required
                    error={form.formState.errors.phone?.message}
                  >
                    <Input
                      id="booking-phone"
                      type="tel"
                      placeholder={t('dialog.phonePlaceholder')}
                      {...form.register('phone')}
                      error={Boolean(form.formState.errors.phone)}
                    />
                  </Field>
                  <Field
                    label={t('dialog.emailLabel')}
                    htmlFor="booking-email"
                    required
                    error={form.formState.errors.email?.message}
                  >
                    <Input
                      id="booking-email"
                      type="email"
                      placeholder={t('dialog.emailPlaceholder')}
                      {...form.register('email')}
                      error={Boolean(form.formState.errors.email)}
                    />
                  </Field>
                </div>

                <label className="flex cursor-pointer items-start gap-2.5">
                  <Checkbox
                    checked={form.watch('agree')}
                    onCheckedChange={(checked) =>
                      form.setValue('agree', Boolean(checked), { shouldValidate: true })
                    }
                    className="mt-0.5"
                  />
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    {t('dialog.agree')}
                  </span>
                </label>
                {form.formState.errors.agree ? (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.agree.message}
                  </p>
                ) : null}
              </section>

              {submitError ? (
                <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {submitError}
                </p>
              ) : null}
            </DialogBody>

            <DialogFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t('dialog.estimate')}</p>
                  <p className="text-base font-semibold">{formatPriceI18n(estimate, locale)}</p>
                </div>
                <Badge variant="success" className="gap-1">
                  <ShieldCheck className="size-3 shrink-0" /> {t('dialog.freeBadge')}
                </Badge>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={onAddToCart}
                  className="w-full sm:w-auto"
                >
                  <ShoppingBag />
                  {t('dialog.addToCart')}
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  isLoading={form.formState.isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {form.formState.isSubmitting ? t('dialog.submitting') : t('dialog.submit')}
                </Button>
              </div>
            </DialogFooter>

            {selectedDate && selectedTime ? (
              <p className="flex items-center gap-1.5 border-t px-6 py-3 text-xs text-muted-foreground">
                <Check className="size-3.5 text-success" />
                {formatDateI18n(parseDate(selectedDate), locale, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
                , {selectedTime} · {tCommon('counts.guests', { count: guests })}
              </p>
            ) : null}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
