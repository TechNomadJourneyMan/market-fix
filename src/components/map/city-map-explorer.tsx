'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Crosshair,
  Gift,
  KeyRound,
  LayoutGrid,
  List,
  Loader2,
  Map as MapIcon,
  MapPin,
  Percent,
  Search,
  Truck,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Coordinates, MarketplaceListing, VenueListItem } from '@/types';
import type { MapPinKind } from '@/lib/map-config';
import { DEMO_USER_LOCATION } from '@/data/seed/users';
import { distanceKm } from '@/lib/geo';
import { getOpenStatus } from '@/lib/hours';
import { cn } from '@/lib/utils';
import { useLocale, useT } from '@/i18n/client';
import { formatDistanceI18n, formatPriceI18n, formatRatingI18n } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VenueMap } from '@/components/map/venue-map';
import type { MapBoundsRect } from '@/components/map/map-types';
import { VoiceInputButton } from '@/components/ui/voice-input';

type LayerMode = 'all' | 'venues' | 'services';

type QuickFilter = 'all' | 'nearby' | 'open' | 'promo' | 'delivery' | 'rental' | 'gifts';

type PaneMode = 'map' | 'list';

interface CityMapExplorerProps {
  venues: VenueListItem[];
  services: (MarketplaceListing & { distanceKm?: number })[];
  className?: string;
}

/** Единая модель для списка и для карты — гарантирует их синхронность. */
interface ExplorerItem {
  id: string;
  kind: MapPinKind;
  href: string;
  title: string;
  subtitle: string;
  district: string;
  price: number;
  priceLabel?: string;
  image: string;
  rating: number;
  distanceKm: number;
  promo: boolean;
  isOpen?: boolean;
  searchIndex: string;
  pin: VenueListItem;
}

const VENUE_QUICK_FILTERS: { id: QuickFilter; icon: React.ElementType }[] = [
  { id: 'all', icon: LayoutGrid },
  { id: 'nearby', icon: MapPin },
  { id: 'open', icon: UtensilsCrossed },
  { id: 'promo', icon: Percent },
];

const SERVICE_QUICK_FILTERS: { id: QuickFilter; icon: React.ElementType }[] = [
  { id: 'delivery', icon: Truck },
  { id: 'rental', icon: KeyRound },
  { id: 'gifts', icon: Gift },
];

/**
 * Карта города: поиск, слои, быстрые фильтры, геолокация и список результатов.
 * Desktop — список слева и карта справа, mobile — переключатель «Карта / Список».
 */
export function CityMapExplorer({ venues, services, className }: CityMapExplorerProps) {
  const t = useT('map');
  const locale = useLocale();
  const hasServices = services.length > 0;
  const quickFilters = hasServices
    ? [...VENUE_QUICK_FILTERS, ...SERVICE_QUICK_FILTERS]
    : VENUE_QUICK_FILTERS;
  const layers: LayerMode[] = hasServices ? ['all', 'venues', 'services'] : ['venues'];

  const [query, setQuery] = React.useState('');
  const [layer, setLayer] = React.useState<LayerMode>(hasServices ? 'all' : 'venues');
  const [quick, setQuick] = React.useState<QuickFilter>('all');
  const [origin, setOrigin] = React.useState<Coordinates>(DEMO_USER_LOCATION);
  const [originIsUser, setOriginIsUser] = React.useState(false);
  const [locating, setLocating] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [pane, setPane] = React.useState<PaneMode>('map');
  const [area, setArea] = React.useState<MapBoundsRect | null>(null);
  const [geoDenied, setGeoDenied] = React.useState(false);

  const listRef = React.useRef<HTMLDivElement>(null);
  const searchInputId = React.useId();

  const locateMe = React.useCallback(() => {
    if (!('geolocation' in navigator)) {
      toast.error(t('toast.unsupported'));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude });
        setOriginIsUser(true);
        setGeoDenied(false);
        setQuick('nearby');
        setLocating(false);
        toast.success(t('toast.located'));
      },
      () => {
        setLocating(false);
        setGeoDenied(true);
        toast.error(t('toast.denied'));
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, [t]);

  /** Собираем места и сервисы в один список с расстояниями от текущей точки. */
  const allItems = React.useMemo<ExplorerItem[]>(() => {
    const venueItems = venues.map<ExplorerItem>((venue) => {
      const status = venue.workingHours.length ? getOpenStatus(venue.workingHours) : null;
      return {
        id: venue.id,
        kind: 'venue',
        href: `/venue/${venue.slug}`,
        title: venue.name,
        subtitle: venue.categoryName,
        district: venue.location.districtName,
        price: venue.averagePrice,
        image: venue.coverImage,
        rating: venue.rating.score,
        distanceKm: distanceKm(origin, venue.location.coordinates),
        promo: Boolean(venue.promotion),
        isOpen: status?.isOpen,
        searchIndex: [
          venue.name,
          venue.categoryName,
          venue.location.districtName,
          venue.location.address,
          ...venue.tags,
        ]
          .join(' ')
          .toLowerCase(),
        pin: venue,
      };
    });

    const serviceItems = services.map<ExplorerItem>((service) => ({
      id: `svc-${service.id}`,
      kind: service.vertical,
      href: `/services/${service.slug}`,
      title: service.name,
      subtitle: service.tagline,
      district: service.location.districtName,
      price: service.priceFrom,
      priceLabel: service.priceLabel,
      image: service.coverImage,
      rating: service.rating.score,
      distanceKm: distanceKm(origin, service.location.coordinates),
      promo: service.isPopular,
      searchIndex: [
        service.name,
        service.tagline,
        service.providerName,
        service.location.districtName,
        ...service.tags,
      ]
        .join(' ')
        .toLowerCase(),
      pin: serviceToMapPin(service),
    }));

    return [...venueItems, ...serviceItems];
  }, [venues, services, origin]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    let items = allItems.filter((item) => {
      if (layer === 'venues' && item.kind !== 'venue') return false;
      if (layer === 'services' && item.kind === 'venue') return false;
      if (q && !item.searchIndex.includes(q)) return false;

      switch (quick) {
        case 'open':
          return item.isOpen === true;
        case 'promo':
          return item.promo;
        case 'delivery':
          return item.kind === 'delivery' || item.kind === 'catering';
        case 'rental':
          return item.kind === 'rental' || item.kind === 'transport';
        case 'gifts':
          return item.kind === 'gifts';
        default:
          return true;
      }
    });

    if (area) {
      items = items.filter((item) => {
        const { lat, lng } = item.pin.location.coordinates;
        return (
          lat <= area.north && lat >= area.south && lng <= area.east && lng >= area.west
        );
      });
    }

    if (quick === 'nearby' || originIsUser) {
      items = [...items].sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return items;
  }, [allItems, layer, quick, query, area, originIsUser]);

  const kindById = React.useMemo(() => {
    const map = new Map<string, MapPinKind>();
    filtered.forEach((item) => map.set(item.id, item.kind));
    return map;
  }, [filtered]);

  const hrefById = React.useMemo(() => {
    const map = new Map<string, string>();
    filtered.forEach((item) => map.set(item.id, item.href));
    return map;
  }, [filtered]);

  const pins = React.useMemo(
    () => filtered.map((item) => ({ ...item.pin, distanceKm: item.distanceKm })),
    [filtered],
  );

  /** Выбор пина на карте подсвечивает и подкручивает список к элементу. */
  const handleMapActiveChange = React.useCallback((id: string | null) => {
    setActiveId(id);
    if (!id) return;
    const target = listRef.current?.querySelector(`[data-item-id="${id}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const resetAll = React.useCallback(() => {
    setQuery('');
    setLayer('all');
    setQuick('all');
    setArea(null);
    setActiveId(null);
  }, []);

  const hasFilters = Boolean(query) || layer !== 'all' || quick !== 'all' || Boolean(area);

  const statusLine = [
    originIsUser ? t('status.yourLocation') : t('status.demoOrigin'),
    t('common:counts.results', { count: filtered.length }),
    t('status.hint'),
  ].join(' · ');

  return (
    <div className={cn('overflow-hidden rounded-3xl border bg-card shadow-soft', className)}>
      {/* Панель поиска и фильтров */}
      <div className="flex flex-col gap-3 border-b p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <label className="sr-only" htmlFor={searchInputId}>
              {t('searchLabel')}
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id={searchInputId}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="h-11 pl-9 pr-[4.75rem]"
              autoComplete="off"
            />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="focus-ring rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
                  aria-label={t('common:actions.clear')}
                >
                  <X className="size-4" aria-hidden />
                </button>
              ) : null}
              <VoiceInputButton
                size="icon-sm"
                mode="replace"
                currentValue={query}
                onInterimTranscript={setQuery}
                onTranscript={setQuery}
              />
            </div>
          </div>

          <div className="flex shrink-0 gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 min-w-11 gap-1.5"
              onClick={locateMe}
              disabled={locating}
              aria-label={t('controls.locate')}
            >
              {locating ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Crosshair className="size-4" aria-hidden />
              )}
              <span className="hidden truncate sm:inline">{t('controls.locate')}</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex rounded-xl border p-0.5"
            role="group"
            aria-label={t('layers.label')}
          >
            {layers.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setLayer(id)}
                aria-pressed={layer === id}
                className={cn(
                  'focus-ring min-h-9 rounded-lg px-3 text-xs font-medium transition-colors',
                  layer === id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`layers.${id}`)}
              </button>
            ))}
          </div>

          <div
            className="no-scrollbar -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1"
            role="group"
            aria-label={t('filters.label')}
          >
            {quickFilters.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setQuick(id)}
                aria-pressed={quick === id}
                className={cn(
                  'focus-ring inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
                  quick === id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'bg-background text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {t(`filters.${id}`)}
              </button>
            ))}
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={resetAll}
              className="focus-ring inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
              {t('common:actions.reset')}
            </button>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground" aria-live="polite">
          {statusLine}
        </p>

        {geoDenied ? (
          <p className="rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {t('states.noLocationTitle')}
            </span>{' '}
            {t('states.noLocationDescription')}
          </p>
        ) : null}

        {pins.length > 40 ? (
          <p className="text-xs text-muted-foreground">{t('states.manyMarkers')}</p>
        ) : null}

        {/* Переключатель «Карта / Список» — только мобильный сценарий */}
        <div className="flex rounded-xl border p-0.5 lg:hidden" role="group">
          {(
            [
              ['map', MapIcon, t('controls.showMap')],
              ['list', List, t('controls.showList')],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPane(id)}
              aria-pressed={pane === id}
              className={cn(
                'focus-ring inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors',
                pane === id
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
              {id === 'list' ? (
                <span className="text-xs text-muted-foreground">({filtered.length})</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,20.5rem)_1fr]">
        <div
          ref={listRef}
          className={cn(
            'max-h-[60vh] space-y-2 overflow-y-auto border-b p-3 lg:max-h-[34rem] lg:border-b-0 lg:border-r',
            pane === 'map' && 'hidden lg:block',
          )}
        >
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-center">
              <p className="text-sm font-semibold">{t('list.emptyTitle')}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('list.emptyDescription')}
              </p>
              {hasFilters ? (
                <Button size="sm" variant="outline" className="mt-3 h-9" onClick={resetAll}>
                  {t('common:actions.reset')}
                </Button>
              ) : null}
            </div>
          ) : null}

          {filtered.map((item) => (
            <ResultRow
              key={item.id}
              item={item}
              active={activeId === item.id}
              locale={locale}
              unitM={t('common:units.m')}
              unitKm={t('common:units.km')}
              fromLabel={t('common:labels.from')}
              onHover={() => setActiveId(item.id)}
              onFocus={() => setActiveId(item.id)}
            />
          ))}
        </div>

        <div className={cn(pane === 'list' && 'hidden lg:block')}>
          <VenueMap
            venues={pins}
            origin={origin}
            originIsUser={originIsUser}
            activeVenueId={activeId ?? undefined}
            onActiveChange={handleMapActiveChange}
            className="h-[58vh] rounded-none border-0 shadow-none lg:h-[34rem]"
            locating={locating}
            onLocateRequest={locateMe}
            resolveKind={(venue) => kindById.get(venue.id) ?? 'venue'}
            resolveHref={(venue) => hrefById.get(venue.id) ?? `/venue/${venue.slug}`}
            onSearchArea={setArea}
            onResetArea={() => setArea(null)}
            areaFilterActive={Boolean(area)}
            onResetFilters={resetAll}
            mapLabel={`${t(`layers.${layer}`)} · ${t('status.points', { count: pins.length })}`}
          />
        </div>
      </div>
    </div>
  );
}

/** Карточка результата в списке: связана с пином через data-item-id. */
function ResultRow({
  item,
  active,
  locale,
  unitM,
  unitKm,
  fromLabel,
  onHover,
  onFocus,
}: {
  item: ExplorerItem;
  active: boolean;
  locale: ReturnType<typeof useLocale>;
  unitM: string;
  unitKm: string;
  fromLabel: string;
  onHover: () => void;
  onFocus: () => void;
}) {
  const distance = formatDistanceI18n(item.distanceKm, locale, { m: unitM, km: unitKm });

  return (
    <Link
      href={item.href}
      data-item-id={item.id}
      onMouseEnter={onHover}
      onFocus={onFocus}
      aria-current={active}
      className={cn(
        'focus-ring flex w-full gap-3 rounded-2xl border p-2.5 text-left transition-colors',
        active ? 'border-primary bg-primary/5' : 'hover:border-primary/30 hover:bg-secondary/40',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image}
        alt=""
        loading="lazy"
        decoding="async"
        className="size-16 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.subtitle} · {formatRatingI18n(item.rating, locale)}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {item.district}
          {distance ? ` · ${distance}` : ''}
        </p>
        <p className="mt-1 truncate text-xs font-semibold text-primary">
          {item.priceLabel ?? `${fromLabel} ${formatPriceI18n(item.price, locale)}`}
        </p>
      </div>
    </Link>
  );
}

/** Сервис → пин карты: переиспользуем модель VenueListItem без изменения типов. */
function serviceToMapPin(item: MarketplaceListing & { distanceKm?: number }): VenueListItem {
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
