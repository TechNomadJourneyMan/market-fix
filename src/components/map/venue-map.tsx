'use client';

import * as React from 'react';
import Link from 'next/link';
import { Layers, Locate, Minus, Navigation, Plus, Star, X } from 'lucide-react';
import type { Coordinates, VenueListItem } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistance, formatPrice, formatRating } from '@/lib/format';
import { getBounds, getDirectionsUrl, projectToPercent } from '@/lib/geo';
import { Button } from '@/components/ui/button';
import { useBookingStore, venueToBookingTarget } from '@/store/use-booking-store';
import { FavoriteButton } from '@/components/venue/favorite-button';

interface VenueMapProps {
  venues: VenueListItem[];
  /** Точка пользователя — рисуем отдельным маркером. */
  origin?: Coordinates;
  className?: string;
  /** Подсвеченное заведение (например, при наведении на карточку в списке). */
  activeVenueId?: string;
  onActiveChange?: (venueId: string | null) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * Демо-рендерер карты.
 *
 * Работает без внешних SDK и API-ключей: координаты проецируются в проценты
 * контейнера (см. lib/geo.ts). Слой пинов и вся логика взаимодействия
 * не зависят от рендерера — при подключении Mapbox/Google Maps
 * заменяется только подложка и функция проекции.
 */
export function VenueMap({
  venues,
  origin,
  className,
  activeVenueId,
  onActiveChange,
}: VenueMapProps) {
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const dragState = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const points = React.useMemo(
    () => [
      ...venues.map((venue) => venue.location.coordinates),
      ...(origin ? [origin] : []),
    ],
    [venues, origin],
  );

  const bounds = React.useMemo(() => getBounds(points), [points]);
  const selected = venues.find((venue) => venue.id === selectedId) ?? null;

  React.useEffect(() => {
    if (activeVenueId !== undefined) setSelectedId(activeVenueId ?? null);
  }, [activeVenueId]);

  const select = (venueId: string | null) => {
    setSelectedId(venueId);
    onActiveChange?.(venueId);
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if ((event.target as HTMLElement).closest('[data-pin]')) return;
    dragState.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragState.current) return;
    const { x, y, ox, oy } = dragState.current;
    setOffset({ x: ox + (event.clientX - x), y: oy + (event.clientY - y) });
  };

  const handlePointerUp = () => {
    dragState.current = null;
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-[#eef1f6] dark:bg-[#171d2b]',
        className,
      )}
    >
      {/* Подложка: сетка «кварталов» и условные магистрали. */}
      <div
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="absolute inset-0 origin-center transition-transform duration-100"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        >
          <MapBackdrop />

          {/* Точка пользователя */}
          {origin ? (
            <MapOrigin position={projectToPercent(origin, bounds)} zoom={zoom} />
          ) : null}

          {/* Пины заведений */}
          {venues.map((venue) => {
            const position = projectToPercent(venue.location.coordinates, bounds);
            const isActive = venue.id === selectedId;
            return (
              <button
                key={venue.id}
                data-pin
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  select(isActive ? null : venue.id);
                }}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: `translate(-50%, -100%) scale(${1 / zoom})`,
                }}
                className={cn(
                  'absolute z-10 origin-bottom transition-[filter] duration-200',
                  isActive ? 'z-20' : 'hover:z-20',
                )}
                aria-label={venue.name}
              >
                <span
                  className={cn(
                    'flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold shadow-lift transition-all',
                    isActive
                      ? 'scale-110 border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:scale-105 hover:border-primary/40',
                  )}
                >
                  {venue.promotion ? (
                    <span className={cn('size-1.5 rounded-full', isActive ? 'bg-white' : 'bg-rose-500')} />
                  ) : null}
                  {formatPrice(venue.averagePrice, false)} ₸
                </span>
                <span
                  className={cn(
                    'mx-auto block size-2 rotate-45 -translate-y-1 border-b border-r',
                    isActive ? 'border-primary bg-primary' : 'border-border bg-background',
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Управление */}
      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        <MapControl
          label="Приблизить"
          onClick={() => setZoom((value) => Math.min(MAX_ZOOM, Number((value + 0.4).toFixed(1))))}
        >
          <Plus className="size-4" />
        </MapControl>
        <MapControl
          label="Отдалить"
          onClick={() => setZoom((value) => Math.max(MIN_ZOOM, Number((value - 0.4).toFixed(1))))}
        >
          <Minus className="size-4" />
        </MapControl>
        <MapControl label="Показать всё" onClick={reset}>
          <Locate className="size-4" />
        </MapControl>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg border bg-background/85 px-2.5 py-1.5 text-[11px] text-muted-foreground backdrop-blur">
        <Layers className="size-3.5" />
        Демо-карта · {venues.length} мест
      </div>

      {/* Карточка выбранного заведения */}
      {selected ? (
        <div className="absolute inset-x-3 bottom-3 z-30 sm:inset-x-auto sm:left-3 sm:w-80">
          <div className="relative flex gap-3 rounded-2xl border bg-background p-3 shadow-lift">
            <button
              type="button"
              onClick={() => select(null)}
              className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Закрыть"
            >
              <X className="size-3.5" />
            </button>

            <Link href={`/venue/${selected.slug}`} className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.coverImage}
                alt={selected.name}
                className="size-20 rounded-xl object-cover"
              />
            </Link>

            <div className="min-w-0 flex-1 pr-5">
              <Link href={`/venue/${selected.slug}`}>
                <p className="truncate text-sm font-semibold hover:text-primary">
                  {selected.name}
                </p>
              </Link>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="size-3 fill-amber-400 text-amber-400" strokeWidth={0} />
                {formatRating(selected.rating.score)}
                <span>·</span>
                <span className="truncate">{selected.categoryName}</span>
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {selected.location.address}
                {selected.distanceKm !== undefined
                  ? ` · ${formatDistance(selected.distanceKm)}`
                  : ''}
              </p>

              <div className="mt-2 flex items-center gap-1.5">
                <MapBookButton venue={selected} />
                <a
                  href={getDirectionsUrl(selected.location.coordinates, selected.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex size-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="Доехать"
                >
                  <Navigation className="size-3.5" />
                </a>
                <FavoriteButton
                  venueId={selected.id}
                  venueName={selected.name}
                  variant="outline"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MapBookButton({ venue }: { venue: VenueListItem }) {
  const openBooking = useBookingStore((state) => state.open);
  return (
    <Button size="sm" className="h-8 flex-1" onClick={() => openBooking(venueToBookingTarget(venue))}>
      Забронировать
    </Button>
  );
}

function MapControl({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-xl border bg-background/90 text-foreground shadow-soft backdrop-blur transition-colors hover:bg-secondary"
    >
      {children}
    </button>
  );
}

function MapOrigin({ position, zoom }: { position: { x: number; y: number }; zoom: number }) {
  return (
    <span
      className="absolute z-10"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) scale(${1 / zoom})`,
      }}
    >
      <span className="relative flex size-4 items-center justify-center">
        <span className="absolute size-8 animate-ping rounded-full bg-primary/25" />
        <span className="size-4 rounded-full border-2 border-white bg-primary shadow-lift" />
      </span>
    </span>
  );
}

/** Стилизованная подложка: кварталы, зелёные зоны и магистрали. */
function MapBackdrop() {
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <pattern id="map-grid" width="6" height="6" patternUnits="userSpaceOnUse">
          <path
            d="M 6 0 L 0 0 0 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.18"
            className="text-slate-400/35 dark:text-slate-600/30"
          />
        </pattern>
      </defs>

      <rect width="100" height="100" fill="url(#map-grid)" />

      {/* Зелёные зоны */}
      <ellipse cx="22" cy="72" rx="14" ry="9" className="fill-emerald-400/15" />
      <ellipse cx="78" cy="30" rx="11" ry="13" className="fill-emerald-400/12" />
      <ellipse cx="52" cy="14" rx="18" ry="7" className="fill-emerald-400/10" />

      {/* Магистрали */}
      <path d="M0 42 L100 36" className="stroke-slate-300/70 dark:stroke-slate-700/60" strokeWidth="1.2" fill="none" />
      <path d="M0 63 L100 58" className="stroke-slate-300/70 dark:stroke-slate-700/60" strokeWidth="1.2" fill="none" />
      <path d="M34 0 L30 100" className="stroke-slate-300/70 dark:stroke-slate-700/60" strokeWidth="1.2" fill="none" />
      <path d="M68 0 L72 100" className="stroke-slate-300/70 dark:stroke-slate-700/60" strokeWidth="1.2" fill="none" />
      <path d="M0 20 L100 24" className="stroke-slate-300/50 dark:stroke-slate-700/40" strokeWidth="0.7" fill="none" />
      <path d="M0 84 L100 80" className="stroke-slate-300/50 dark:stroke-slate-700/40" strokeWidth="0.7" fill="none" />
      <path d="M14 0 L12 100" className="stroke-slate-300/50 dark:stroke-slate-700/40" strokeWidth="0.7" fill="none" />
      <path d="M88 0 L90 100" className="stroke-slate-300/50 dark:stroke-slate-700/40" strokeWidth="0.7" fill="none" />

      {/* Река */}
      <path
        d="M0 92 C 20 88, 30 96, 48 90 S 76 84, 100 88"
        className="stroke-sky-400/35"
        strokeWidth="1.6"
        fill="none"
      />
    </svg>
  );
}
