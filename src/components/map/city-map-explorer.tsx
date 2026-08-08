'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Crosshair,
  Filter,
  Gift,
  KeyRound,
  LayoutGrid,
  List,
  MapPin,
  Search,
  Truck,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import type { Coordinates, MarketplaceListing, VenueListItem } from '@/types';
import { DEMO_USER_LOCATION } from '@/data/seed/users';
import { distanceKm } from '@/lib/geo';
import { getOpenStatus } from '@/lib/hours';
import { cn } from '@/lib/utils';
import { formatPrice, formatRating } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VenueMap } from '@/components/map/venue-map';
import { VoiceInputButton } from '@/components/ui/voice-input';
import { toast } from 'sonner';

type LayerMode = 'venues' | 'services' | 'all';

type QuickFilter =
  | 'all'
  | 'open'
  | 'promo'
  | 'delivery'
  | 'rental'
  | 'gifts'
  | 'nearby';

interface CityMapExplorerProps {
  venues: VenueListItem[];
  services: (MarketplaceListing & { distanceKm?: number })[];
  className?: string;
}

const QUICK_FILTERS: { id: QuickFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Всё', icon: <LayoutGrid className="size-3.5" /> },
  { id: 'nearby', label: 'Рядом', icon: <MapPin className="size-3.5" /> },
  { id: 'open', label: 'Открыто', icon: <UtensilsCrossed className="size-3.5" /> },
  { id: 'promo', label: 'Акции', icon: <Filter className="size-3.5" /> },
  { id: 'delivery', label: 'Доставка', icon: <Truck className="size-3.5" /> },
  { id: 'rental', label: 'Аренда', icon: <KeyRound className="size-3.5" /> },
  { id: 'gifts', label: 'Подарки', icon: <Gift className="size-3.5" /> },
];

/**
 * Интерактивная карта в духе 2GIS: поиск, слои, фильтры, геолокация,
 * список результатов + пины с превью.
 */
export function CityMapExplorer({ venues, services, className }: CityMapExplorerProps) {
  const [query, setQuery] = React.useState('');
  const [layer, setLayer] = React.useState<LayerMode>('all');
  const [quick, setQuick] = React.useState<QuickFilter>('all');
  const [origin, setOrigin] = React.useState<Coordinates>(DEMO_USER_LOCATION);
  const [geoLabel, setGeoLabel] = React.useState('Демо-точка · Алматы');
  const [locating, setLocating] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(true);
  const listRef = React.useRef<HTMLDivElement>(null);

  const locateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Геолокация недоступна в этом браузере');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeoLabel('Ваше местоположение');
        setQuick('nearby');
        setLocating(false);
        toast.success('Нашли вас на карте');
      },
      () => {
        setLocating(false);
        toast.error('Не удалось получить геолокацию. Разрешите доступ в браузере.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const filteredVenues = React.useMemo(() => {
    if (layer === 'services') return [];
    const q = query.trim().toLowerCase();
    let items = venues.map((venue) => ({
      ...venue,
      distanceKm: Number(
        distanceKm(origin, venue.location.coordinates).toFixed(2),
      ),
    }));

    if (q) {
      items = items.filter(
        (venue) =>
          venue.name.toLowerCase().includes(q) ||
          venue.categoryName.toLowerCase().includes(q) ||
          venue.location.districtName.toLowerCase().includes(q) ||
          venue.location.address.toLowerCase().includes(q),
      );
    }

    if (quick === 'promo') items = items.filter((venue) => Boolean(venue.promotion));
    if (quick === 'open') {
      items = items.filter((venue) => getOpenStatus(venue.workingHours).isOpen);
    }
    if (quick === 'nearby') {
      items = [...items].sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
    }
    if (quick === 'delivery' || quick === 'rental' || quick === 'gifts') {
      return [];
    }

    return items;
  }, [venues, query, quick, layer, origin]);

  const filteredServices = React.useMemo(() => {
    if (layer === 'venues') return [];
    const q = query.trim().toLowerCase();
    let items = services.map((item) => ({
      ...item,
      distanceKm: Number(
        distanceKm(origin, item.location.coordinates).toFixed(2),
      ),
    }));

    if (q) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.tagline.toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }

    if (quick === 'delivery') items = items.filter((item) => item.vertical === 'delivery');
    if (quick === 'rental') items = items.filter((item) => item.vertical === 'rental');
    if (quick === 'gifts') items = items.filter((item) => item.vertical === 'gifts');
    if (quick === 'promo' || quick === 'open') {
      if (layer === 'services') return items.filter((item) => item.isPopular);
      if (quick === 'open' || quick === 'promo') return [];
    }
    if (quick === 'nearby') {
      items = [...items].sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
    }

    return items;
  }, [services, query, quick, layer, origin]);

  /** Пины на карте — заведения; сервисы показываем в списке и как «виртуальные» пины через адаптер. */
  const mapVenues = React.useMemo(() => {
    const venuePins = filteredVenues;
    const serviceAsPins: VenueListItem[] = filteredServices.map((item) =>
      serviceToMapPin(item),
    );
    if (layer === 'venues') return venuePins;
    if (layer === 'services') return serviceAsPins;
    return [...venuePins, ...serviceAsPins];
  }, [filteredVenues, filteredServices, layer]);

  const handleActiveChange = (id: string | null) => {
    setActiveId(id);
    if (!id || !listRef.current) return;
    const target = listRef.current.querySelector(`[data-map-id="${id}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const resultCount = filteredVenues.length + filteredServices.length;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border bg-card shadow-soft',
        className,
      )}
    >
      {/* Панель поиска — как в 2GIS */}
      <div className="flex flex-col gap-3 border-b p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск на карте: район, ресторан, доставка, аренда…"
              className="h-11 pl-9 pr-20"
            />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
                  aria-label="Очистить"
                >
                  <X className="size-4" />
                </button>
              ) : null}
              <VoiceInputButton
                size="icon-sm"
                mode="replace"
                onTranscript={(text) => setQuery(text)}
              />
            </div>
          </div>

          <div className="flex shrink-0 gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 gap-1.5"
              onClick={locateMe}
              disabled={locating}
            >
              <Crosshair className={cn('size-4', locating && 'animate-spin')} />
              <span className="hidden sm:inline">Где я</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 gap-1.5 lg:hidden"
              onClick={() => setPanelOpen((value) => !value)}
            >
              <List className="size-4" />
              Список
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border p-0.5">
            {(
              [
                ['all', 'Всё'],
                ['venues', 'Места'],
                ['services', 'Сервисы'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setLayer(id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  layer === id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setQuick(item.id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  quick === item.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'bg-background text-muted-foreground hover:text-foreground',
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {geoLabel} · найдено {resultCount} · масштабируйте колесом / жестом · перетаскивайте карту
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,340px)_1fr]">
        {/* Список как в 2GIS */}
        <div
          ref={listRef}
          className={cn(
            'max-h-[420px] space-y-2 overflow-y-auto border-b p-3 lg:max-h-[560px] lg:border-b-0 lg:border-r',
            !panelOpen && 'hidden lg:block',
          )}
        >
          {resultCount === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Ничего не найдено. Смените фильтр или сбросьте поиск.
            </div>
          ) : null}

          {filteredVenues.map((venue) => (
            <button
              key={venue.id}
              type="button"
              data-map-id={venue.id}
              onClick={() => setActiveId(venue.id)}
              onMouseEnter={() => setActiveId(venue.id)}
              className={cn(
                'flex w-full gap-3 rounded-2xl border p-2.5 text-left transition-all',
                activeId === venue.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/30',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={venue.coverImage}
                alt=""
                className="size-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{venue.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {venue.categoryName} · {formatRating(venue.rating.score)}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {venue.location.districtName}
                  {venue.distanceKm !== undefined ? ` · ${venue.distanceKm} км` : ''}
                </p>
                <p className="mt-1 text-xs font-medium text-primary">
                  от {formatPrice(venue.averagePrice, false)} ₸
                </p>
              </div>
            </button>
          ))}

          {filteredServices.map((item) => (
            <Link
              key={item.id}
              href={`/services/${item.slug}`}
              data-map-id={`svc-${item.id}`}
              onMouseEnter={() => setActiveId(`svc-${item.id}`)}
              className={cn(
                'flex w-full gap-3 rounded-2xl border p-2.5 text-left transition-all',
                activeId === `svc-${item.id}`
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/30',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.coverImage}
                alt=""
                className="size-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className="truncate text-xs text-muted-foreground">{item.tagline}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.location.districtName}
                  {item.distanceKm !== undefined ? ` · ${item.distanceKm} км` : ''}
                </p>
                <p className="mt-1 text-xs font-medium text-primary">{item.priceLabel}</p>
              </div>
            </Link>
          ))}
        </div>

        <VenueMap
          venues={mapVenues}
          origin={origin}
          activeVenueId={activeId ?? undefined}
          onActiveChange={handleActiveChange}
          className="h-[52vh] rounded-none border-0 lg:h-[560px]"
          enableWheelZoom
          showLocateControl={false}
          mapLabel={`Карта Алматы · ${mapVenues.length} точек`}
        />
      </div>
    </div>
  );
}

function serviceToMapPin(
  item: MarketplaceListing & { distanceKm?: number },
): VenueListItem {
  return {
    id: `svc-${item.id}`,
    slug: item.slug,
    name: item.name,
    tagline: item.tagline,
    categoryId: item.categoryId,
    categoryName: item.ctaLabel,
    cuisineIds: [],
    coverImage: item.coverImage,
    photos: [item.coverImage],
    rating: {
      score: item.rating.score,
      count: item.rating.count,
      breakdown: { food: 0, service: 0, atmosphere: 0, price: 0 },
      distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
    },
    priceLevel: 2,
    averagePrice: item.priceFrom,
    location: {
      coordinates: item.location.coordinates,
      address: item.location.address,
      cityId: 'city-almaty',
      cityName: 'Алматы',
      districtId: item.location.districtId,
      districtName: item.location.districtName,
    },
    amenities: [],
    workingHours: [],
    isVerified: item.isVerified,
    isFeatured: item.isPopular,
    popularityScore: item.isPopular ? 90 : 50,
    capacity: 0,
    tags: item.tags,
    distanceKm: item.distanceKm,
  };
}
