import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck, Clock, MapPin, Star } from 'lucide-react';
import type { MarketplaceListing } from '@/types';
import { formatRating } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const VERTICAL_LABEL: Record<MarketplaceListing['vertical'], string> = {
  delivery: 'Доставка',
  rental: 'Аренда',
  services: 'Услуга',
  gifts: 'Подарок',
  catering: 'Кейтеринг',
  transport: 'Транспорт',
  events: 'Событие',
  other: 'Сервис',
};

export function ServiceCard({
  listing,
  className,
}: {
  listing: MarketplaceListing & { distanceKm?: number };
  className?: string;
}) {
  return (
    <Link
      href={`/services/${listing.slug}`}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300',
        'hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift',
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={listing.coverImage}
          alt={listing.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge className="bg-background/90 text-foreground backdrop-blur">
            {VERTICAL_LABEL[listing.vertical]}
          </Badge>
          {listing.isPopular ? (
            <Badge className="bg-primary text-primary-foreground">Популярное</Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold tracking-tight group-hover:text-primary">
              {listing.name}
              {listing.isVerified ? (
                <BadgeCheck className="ml-1 inline size-4 text-primary" aria-label="Проверено" />
              ) : null}
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{listing.tagline}</p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-primary">{listing.priceLabel}</p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 fill-amber-400 text-amber-400" strokeWidth={0} />
            {formatRating(listing.rating.score)}
            <span>({listing.rating.count})</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {listing.location.districtName}
            {listing.distanceKm !== undefined ? ` · ${listing.distanceKm} км` : ''}
          </span>
          {listing.deliveryEtaMinutes ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />~{listing.deliveryEtaMinutes} мин
            </span>
          ) : null}
        </div>

        <Button size="sm" className="mt-2 w-full" tabIndex={-1}>
          {listing.ctaLabel}
        </Button>
      </div>
    </Link>
  );
}
