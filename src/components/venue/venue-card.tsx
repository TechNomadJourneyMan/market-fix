'use client';

import * as React from 'react';
import Link from 'next/link';
import { BadgeCheck, MapPin, Navigation, Star, Users } from 'lucide-react';
import type { VenueListItem } from '@/types';
import { cn } from '@/lib/utils';
import {
  formatDistance,
  formatPrice,
  formatRating,
  formatReviews,
} from '@/lib/format';
import { getOpenStatus } from '@/lib/hours';
import { getDirectionsUrl } from '@/lib/geo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBookingStore, venueToBookingTarget } from '@/store/use-booking-store';
import { FavoriteButton } from './favorite-button';

interface VenueCardProps {
  venue: VenueListItem;
  /** compact — для горизонтальных лент и боковой панели карты. */
  variant?: 'default' | 'compact';
  className?: string;
  /** Дополнительная плашка сверху — например, «96% совпадение» в AI-подборе. */
  ribbon?: React.ReactNode;
  priority?: boolean;
}

/**
 * Карточка заведения. Содержит все поля из ТЗ:
 * фото, название, категория, рейтинг, отзывы, цена, адрес, «Доехать»,
 * время работы, «Подробнее», «Забронировать», «Избранное».
 */
export function VenueCard({
  venue,
  variant = 'default',
  className,
  ribbon,
  priority,
}: VenueCardProps) {
  const openBooking = useBookingStore((state) => state.open);
  const [photoIndex, setPhotoIndex] = React.useState(0);

  // Статус работы считаем на клиенте: на сервере «сейчас» отличалось бы от времени гостя.
  const [status, setStatus] = React.useState<ReturnType<typeof getOpenStatus> | null>(null);
  React.useEffect(() => {
    setStatus(getOpenStatus(venue.workingHours));
  }, [venue.workingHours]);

  const photos = venue.photos.length ? venue.photos : [venue.coverImage];
  const href = `/venue/${venue.slug}`;
  const isCompact = variant === 'compact';

  const handleBook = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    openBooking(venueToBookingTarget(venue));
  };

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300',
        'hover:-translate-y-1 hover:border-foreground/10 hover:shadow-lift',
        className,
      )}
    >
      {ribbon ? <div className="absolute inset-x-0 top-0 z-20">{ribbon}</div> : null}

      {/* ——— Фото ——— */}
      <Link
        href={href}
        className="relative block overflow-hidden"
        aria-label={`Открыть страницу ${venue.name}`}
      >
        <div className={cn('relative', isCompact ? 'aspect-[16/10]' : 'aspect-[4/3]')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[photoIndex]}
            alt={venue.name}
            loading={priority ? 'eager' : 'lazy'}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/20" />

          {/* Точки-переключатели фото: наведение курсора листает галерею. */}
          {photos.length > 1 ? (
            <>
              <div className="absolute inset-0 flex">
                {photos.map((_, index) => (
                  <span
                    key={index}
                    className="h-full flex-1"
                    onMouseEnter={() => setPhotoIndex(index)}
                  />
                ))}
              </div>
              <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {photos.map((_, index) => (
                  <span
                    key={index}
                    className={cn(
                      'size-1.5 rounded-full bg-white/50 transition-all',
                      index === photoIndex && 'w-4 bg-white',
                    )}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Бейджи */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 pr-14">
          {venue.promotion ? (
            <Badge variant="promo" className="shadow-soft">
              −{venue.promotion.discountPercent}% · Акция
            </Badge>
          ) : null}
          {venue.isFeatured ? (
            <Badge variant="overlay" className="gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" /> Выбор редакции
            </Badge>
          ) : null}
        </div>

        <div className="absolute right-3 top-3">
          <FavoriteButton venueId={venue.id} venueName={venue.name} size="sm" />
        </div>

        {/* Рейтинг и статус работы поверх фото */}
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg border border-white/25 bg-black/45 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <Star className="size-3 fill-amber-400 text-amber-400" strokeWidth={0} />
            {formatRating(venue.rating.score)}
            <span className="font-normal text-white/70">· {venue.rating.count}</span>
          </span>

          {status ? (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-black/45 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-md',
              )}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  status.isOpen
                    ? status.closingSoon
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                    : 'bg-rose-400',
                )}
              />
              {status.label}
            </span>
          ) : null}
        </div>
      </Link>

      {/* ——— Контент ——— */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">{venue.categoryName}</span>
            {venue.isVerified ? (
              <BadgeCheck className="size-3.5 shrink-0 text-primary" />
            ) : null}
            <span>·</span>
            <span className="truncate">{venue.location.districtName}</span>
          </div>

          <Link href={href}>
            <h3 className="line-clamp-1 text-base font-semibold tracking-tight transition-colors hover:text-primary">
              {venue.name}
            </h3>
          </Link>

          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {venue.tagline}
          </p>
        </div>

        {/* Адрес + расстояние + «Доехать» */}
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="line-clamp-1">{venue.location.address}</span>
            {venue.distanceKm !== undefined ? (
              <span className="text-foreground/60"> · {formatDistance(venue.distanceKm)}</span>
            ) : null}
          </span>
          <a
            href={getDirectionsUrl(venue.location.coordinates, venue.name)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex shrink-0 items-center gap-1 font-medium text-primary transition-colors hover:text-primary/80"
          >
            <Navigation className="size-3" /> Доехать
          </a>
        </div>

        {/* Цена и вместимость */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Средний чек</p>
            <p className="text-sm font-semibold">
              {formatPrice(venue.averagePrice)}
              <span className="text-xs font-normal text-muted-foreground"> / чел.</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3.5" /> до {venue.capacity}
          </span>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={href}>Подробнее</Link>
          </Button>
          <Button size="sm" className="flex-1" onClick={handleBook}>
            Забронировать
          </Button>
        </div>
      </div>
    </article>
  );
}

/** Горизонтальная карточка — для списков в кабинете и рядом с картой. */
export function VenueCardRow({ venue }: { venue: VenueListItem }) {
  const openBooking = useBookingStore((state) => state.open);

  return (
    <article className="group flex gap-3 rounded-2xl border bg-card p-3 transition-all hover:border-foreground/10 hover:shadow-card">
      <Link href={`/venue/${venue.slug}`} className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={venue.coverImage}
          alt={venue.name}
          loading="lazy"
          className="size-24 rounded-xl object-cover sm:size-28"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">
              {venue.categoryName} · {venue.location.districtName}
            </p>
            <Link href={`/venue/${venue.slug}`}>
              <h3 className="truncate text-sm font-semibold transition-colors hover:text-primary">
                {venue.name}
              </h3>
            </Link>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold">
            <Star className="size-3 fill-amber-400 text-amber-400" strokeWidth={0} />
            {formatRating(venue.rating.score)}
          </span>
        </div>

        <p className="line-clamp-1 text-xs text-muted-foreground">{venue.tagline}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-sm font-semibold">
            {formatPrice(venue.averagePrice)}
            <span className="text-xs font-normal text-muted-foreground"> / чел.</span>
          </span>
          <div className="flex items-center gap-1.5">
            <FavoriteButton
              venueId={venue.id}
              venueName={venue.name}
              variant="plain"
              size="sm"
            />
            <Button size="sm" onClick={() => openBooking(venueToBookingTarget(venue))}>
              Забронировать
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Мини-карточка для лент «Похожие» и «Рекомендации». */
export function VenueCardMini({ venue }: { venue: VenueListItem }) {
  return (
    <Link
      href={`/venue/${venue.slug}`}
      className="group flex w-[260px] shrink-0 flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={venue.coverImage}
          alt={venue.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-lg border border-white/25 bg-black/45 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
          <Star className="size-3 fill-amber-400 text-amber-400" strokeWidth={0} />
          {formatRating(venue.rating.score)}
        </span>
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate text-sm font-semibold">{venue.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {venue.categoryName} · {formatPrice(venue.averagePrice)}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {formatReviews(venue.rating.count)}
        </p>
      </div>
    </Link>
  );
}
