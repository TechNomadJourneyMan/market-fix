'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Layers,
  Loader2,
  MapPinOff,
  Navigation,
  Star,
  WifiOff,
  X,
} from 'lucide-react';

import type { VenueListItem } from '@/types';
import type { MapPinKind } from '@/lib/map-config';
import { getDirectionsUrl } from '@/lib/geo';
import { getOpenStatus } from '@/lib/hours';
import { cn } from '@/lib/utils';
import { useLocale, useT } from '@/i18n/client';
import { formatDistanceI18n, formatPriceI18n, formatRatingI18n } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/venue/favorite-button';
import { useBookingStore, venueToBookingTarget } from '@/store/use-booking-store';

/**
 * Бейдж-подпись карты (слой + количество точек). Стоит слева сверху:
 * низ слева занимает карточка объекта, низ справа — обязательная атрибуция OSM.
 */
export function MapBadge({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex max-w-[55%] items-center gap-1.5 rounded-xl border bg-background/85 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground shadow-soft backdrop-blur">
      <Layers className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </div>
  );
}

/** Контейнер группы контролов: визуально один блок, как в нативных картах. */
export function MapControlGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border bg-background/90 shadow-lift backdrop-blur',
        '[&>button+button]:border-t',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MapControl({
  children,
  label,
  onClick,
  disabled,
  compact,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'focus-ring flex items-center justify-center text-foreground transition-colors',
        'hover:bg-secondary active:bg-secondary/80',
        'disabled:pointer-events-none disabled:opacity-40',
        active && 'bg-primary/10 text-primary',
        // Touch target: 44px на мобильных, компактнее на десктопе и в маленьких картах
        compact ? 'size-10 sm:size-9' : 'size-11 sm:size-10',
      )}
    >
      {children}
    </button>
  );
}

/** Плавающая кнопка «Искать в этой области» — появляется после сдвига карты. */
export function MapSearchAreaButton({
  onClick,
  label,
  visible,
}: {
  onClick: () => void;
  label: string;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-14 z-30 flex justify-center px-3 sm:top-3 sm:px-16">
      <button
        type="button"
        onClick={onClick}
        className="focus-ring pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/30 bg-background/95 px-4 text-xs font-semibold text-primary shadow-lift backdrop-blur transition-transform hover:scale-[1.02] active:scale-100 animate-in fade-in slide-in-from-top-2"
      >
        <Navigation className="size-3.5" aria-hidden />
        <span className="truncate">{label}</span>
      </button>
    </div>
  );
}

type MapStateVariant = 'loading' | 'empty' | 'error' | 'offline';

const STATE_ICON: Record<MapStateVariant, React.ElementType> = {
  loading: Loader2,
  empty: MapPinOff,
  error: WifiOff,
  offline: WifiOff,
};

/**
 * Состояния карты: загрузка, пустая область, ошибка тайлов, offline.
 * Для loading перекрываем всю область, для остальных — карточка по центру,
 * чтобы карту можно было продолжать двигать.
 */
export function MapStateOverlay({
  variant,
  title,
  description,
  actionLabel,
  onAction,
}: {
  variant: MapStateVariant;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const Icon = STATE_ICON[variant];
  const blocking = variant === 'loading' || variant === 'error';

  return (
    <div
      className={cn(
        'absolute inset-0 z-40 flex items-center justify-center p-4',
        blocking ? 'bg-background/70 backdrop-blur-sm' : 'pointer-events-none',
      )}
      role={variant === 'loading' ? 'status' : 'alert'}
      aria-live="polite"
    >
      <div
        className={cn(
          'pointer-events-auto max-w-xs rounded-2xl border bg-card p-4 text-center shadow-lift',
          variant === 'loading' && 'border-transparent bg-transparent shadow-none',
        )}
      >
        <Icon
          className={cn(
            'mx-auto size-6 text-muted-foreground',
            variant === 'loading' && 'animate-spin text-primary',
          )}
          aria-hidden
        />
        <p className="mt-2.5 text-sm font-semibold">{title}</p>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        {actionLabel && onAction ? (
          <Button size="sm" variant="outline" className="mt-3 h-9" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function MapBookButton({ venue, label }: { venue: VenueListItem; label: string }) {
  const openBooking = useBookingStore((state) => state.open);
  return (
    <Button
      size="sm"
      className="h-9 min-w-0 flex-1"
      onClick={() => openBooking(venueToBookingTarget(venue))}
    >
      <span className="truncate">{label}</span>
    </Button>
  );
}

/**
 * Карточка выбранного объекта.
 * Мобильный — bottom sheet во всю ширину, десктоп — плавающая карточка слева.
 * Только ключевая информация + один основной CTA; детали — на странице объекта.
 */
export function SelectedVenueCard({
  venue,
  href,
  kind,
  onClose,
}: {
  venue: VenueListItem;
  href: string;
  kind: MapPinKind;
  onClose: () => void;
}) {
  const t = useT('map');
  const locale = useLocale();
  const isService = kind !== 'venue';

  const openStatus = venue.workingHours.length
    ? getOpenStatus(venue.workingHours)
    : null;

  const distance = formatDistanceI18n(venue.distanceKm, locale, {
    m: t('common:units.m'),
    km: t('common:units.km'),
  });

  const ctaLabel = isService ? serviceCtaLabel(kind, t) : t('card.book');

  return (
    <div
      // Отступ снизу оставляет видимой атрибуцию OpenStreetMap под карточкой.
      className="absolute inset-x-0 bottom-0 z-50 px-2.5 pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:inset-auto sm:bottom-3 sm:left-3 sm:w-[21.5rem] sm:px-0 sm:pb-0"
    >
      <div
        role="dialog"
        aria-label={venue.name}
        className="relative rounded-2xl border bg-card p-3 shadow-lift animate-in fade-in slide-in-from-bottom-3 duration-200"
      >
        {/* Полоска-«ручка» намекает на bottom sheet только на мобильных */}
        <span
          className="absolute left-1/2 top-1.5 h-1 w-9 -translate-x-1/2 rounded-full bg-border sm:hidden"
          aria-hidden
        />

        <button
          type="button"
          onClick={onClose}
          aria-label={t('card.close')}
          className="focus-ring absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>

        <div className="flex gap-3 pt-1.5 sm:pt-0">
          <Link href={href} className="focus-ring shrink-0 rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={venue.coverImage}
              alt={venue.name}
              loading="lazy"
              decoding="async"
              className="size-[4.5rem] rounded-xl object-cover"
            />
          </Link>

          <div className="min-w-0 flex-1 pr-7">
            <Link href={href} className="focus-ring rounded">
              <p className="line-clamp-2 text-sm font-semibold leading-snug hover:text-primary">
                {venue.name}
              </p>
            </Link>

            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="size-3 fill-amber-400 text-amber-400" strokeWidth={0} aria-hidden />
                {formatRatingI18n(venue.rating.score, locale)}
              </span>
              <span aria-hidden>·</span>
              <span className="truncate">{venue.categoryName}</span>
              {openStatus ? (
                <>
                  <span aria-hidden>·</span>
                  <span
                    className={cn(
                      'font-medium',
                      openStatus.isOpen ? 'text-success' : 'text-muted-foreground',
                    )}
                  >
                    {openStatus.isOpen ? t('common:labels.openNow') : t('common:labels.closed')}
                  </span>
                </>
              ) : null}
            </p>

            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {venue.location.districtName}
              {distance ? ` · ${t('card.distance', { distance })}` : ''}
            </p>

            <p className="mt-1 text-xs font-semibold text-primary">
              {t('common:labels.from')} {formatPriceI18n(venue.averagePrice, locale)}
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5">
          {isService ? (
            <Button asChild size="sm" className="h-9 min-w-0 flex-1">
              <Link href={href}>
                <span className="truncate">{ctaLabel}</span>
              </Link>
            </Button>
          ) : (
            <MapBookButton venue={venue} label={ctaLabel} />
          )}

          <Button asChild size="sm" variant="outline" className="h-9 min-w-0 shrink-0">
            <Link href={href}>
              <span className="truncate">{t('card.details')}</span>
            </Link>
          </Button>

          <a
            href={getDirectionsUrl(venue.location.coordinates, venue.name)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('card.directions')}
            title={t('card.directions')}
            className="focus-ring inline-flex size-9 shrink-0 items-center justify-center rounded-xl border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Navigation className="size-4" aria-hidden />
          </a>

          {!isService ? (
            <FavoriteButton
              venueId={venue.id}
              venueName={venue.name}
              variant="outline"
              size="sm"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function serviceCtaLabel(kind: MapPinKind, t: ReturnType<typeof useT>) {
  switch (kind) {
    case 'delivery':
    case 'catering':
      return t('common:actions.order');
    case 'rental':
    case 'transport':
      return t('common:actions.rent');
    default:
      return t('card.openService');
  }
}

export function venueHref(
  venue: VenueListItem,
  resolveHref?: (venue: VenueListItem) => string,
) {
  return (
    resolveHref?.(venue) ??
    (venue.id.startsWith('svc-') ? `/services/${venue.slug}` : `/venue/${venue.slug}`)
  );
}

export function isServiceVenue(venue: VenueListItem) {
  return venue.id.startsWith('svc-');
}
