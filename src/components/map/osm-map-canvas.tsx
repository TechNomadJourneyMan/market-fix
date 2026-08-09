'use client';

import * as React from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Crosshair, Expand, Loader2, Maximize, Minimize, Minus, Plus } from 'lucide-react';

import type { Coordinates, VenueListItem } from '@/types';
import {
  ALMATY_CENTER,
  CLUSTER_CELL_PX,
  CLUSTER_DISABLE_ZOOM,
  FALLBACK_TILES,
  getTileProvider,
  MAP_DEFAULT_ZOOM,
  MAP_FIT_MAX_ZOOM,
  MAP_FOCUS_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  VIEWPORT_PADDING_RATIO,
  type MapPinKind,
} from '@/lib/map-config';
import { cn } from '@/lib/utils';
import { useLocale, useT } from '@/i18n/client';
import { formatPriceI18n } from '@/i18n/format';
import { clusterVenues, isCluster, type ClusterNode } from '@/components/map/map-cluster';
import {
  createClusterIcon,
  createPinIcon,
  createUserLocationIcon,
} from '@/components/map/map-pins';
import {
  MapBadge,
  MapControl,
  MapControlGroup,
  MapSearchAreaButton,
  MapStateOverlay,
  SelectedVenueCard,
  venueHref,
} from '@/components/map/map-overlays';
import { useIsDarkTheme } from '@/components/map/use-map-theme';
import type { VenueMapProps } from '@/components/map/map-types';

import 'leaflet/dist/leaflet.css';

interface ViewState {
  zoom: number;
  bounds: L.LatLngBounds | null;
}

/**
 * Карта на OpenStreetMap (Leaflet). Ключи и платные API не нужны.
 *
 * Внутри: кластеризация в экранных координатах, рендер только видимой области,
 * собственные пины по типам объектов, карточка объекта (bottom sheet на мобильных),
 * полноэкранный режим, «искать в этой области» и состояния loading/empty/error/offline.
 */
export function OsmMapCanvas({
  venues,
  origin,
  originIsUser = false,
  activeVenueId,
  onActiveChange,
  showLocateControl = true,
  locating = false,
  onLocateRequest,
  showFullscreenControl = true,
  compact = false,
  mapLabel,
  resolveHref,
  resolveKind,
  resolveLabel,
  onSearchArea,
  onResetArea,
  areaFilterActive = false,
  onResetFilters,
  autoFit = true,
}: VenueMapProps) {
  const t = useT('map');
  const locale = useLocale();
  const isDark = useIsDarkTheme();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = React.useState<L.Map | null>(null);

  const [view, setView] = React.useState<ViewState>({
    zoom: MAP_DEFAULT_ZOOM,
    bounds: null,
  });
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [tileStatus, setTileStatus] = React.useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [tileKey, setTileKey] = React.useState(0);
  const [useFallbackTiles, setUseFallbackTiles] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(true);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [wheelZoom, setWheelZoom] = React.useState(false);
  const [areaMoved, setAreaMoved] = React.useState(false);

  const tileErrorsRef = React.useRef(0);
  /** Гасим реакцию на программные перемещения карты (fit, panTo, зум-кнопки). */
  const suppressMoveUntilRef = React.useRef(0);

  const provider = useFallbackTiles ? FALLBACK_TILES : getTileProvider(isDark);

  const selected = React.useMemo(
    () => venues.find((venue) => venue.id === selectedId) ?? null,
    [venues, selectedId],
  );

  const kindOf = React.useCallback(
    (venue: VenueListItem): MapPinKind => resolveKind?.(venue) ?? 'venue',
    [resolveKind],
  );

  const labelOf = React.useCallback(
    (venue: VenueListItem) =>
      resolveLabel?.(venue) ?? formatPriceI18n(venue.averagePrice, locale),
    [resolveLabel, locale],
  );

  /** Внешняя подсветка (наведение/выбор в списке) синхронизирует выбор на карте. */
  React.useEffect(() => {
    if (activeVenueId !== undefined) setSelectedId(activeVenueId ?? null);
  }, [activeVenueId]);

  const select = React.useCallback(
    (venueId: string | null) => {
      setSelectedId(venueId);
      onActiveChange?.(venueId);
    },
    [onActiveChange],
  );

  const runProgrammatic = React.useCallback((action: () => void) => {
    suppressMoveUntilRef.current = Date.now() + 900;
    action();
  }, []);

  /** Синхронизация состояния вида + определение «карту сдвинули руками». */
  React.useEffect(() => {
    if (!map) return;

    const sync = () => setView({ zoom: map.getZoom(), bounds: map.getBounds() });

    const onMoveEnd = () => {
      sync();
      if (Date.now() < suppressMoveUntilRef.current) return;
      setAreaMoved(true);
    };

    sync();
    map.on('moveend', onMoveEnd);
    map.on('zoomend', sync);
    map.on('resize', sync);

    return () => {
      map.off('moveend', onMoveEnd);
      map.off('zoomend', sync);
      map.off('resize', sync);
    };
  }, [map]);

  /** Автоподгонка границ при смене набора объектов, но не поверх ручного зума. */
  const fitSignature = React.useMemo(
    () => venues.map((venue) => venue.id).join('|'),
    [venues],
  );

  const fitAll = React.useCallback(() => {
    if (!map) return;
    runProgrammatic(() => fitMapToVenues(map, venues, origin));
    setAreaMoved(false);
  }, [map, venues, origin, runProgrammatic]);

  React.useEffect(() => {
    if (!map || !autoFit) return;
    runProgrammatic(() => fitMapToVenues(map, venues, origin));
    setAreaMoved(false);
    // Пересчитываем только когда меняется сам набор точек или центр пользователя.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, autoFit, fitSignature, origin?.lat, origin?.lng]);

  /** Подводим выбранный объект в кадр, только если он за границами экрана. */
  React.useEffect(() => {
    if (!map || !selected) return;
    const point = L.latLng(
      selected.location.coordinates.lat,
      selected.location.coordinates.lng,
    );
    if (map.getBounds().pad(-0.12).contains(point)) return;
    runProgrammatic(() => map.panTo(point, { animate: true, duration: 0.4 }));
  }, [map, selected, runProgrammatic]);

  /** Подстройка размера при fullscreen, переключении «Карта/Список» и ресайзе. */
  React.useEffect(() => {
    if (!map || !containerRef.current) return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.invalidateSize({ animate: false }));
    });
    observer.observe(containerRef.current);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map]);

  React.useEffect(() => {
    const handler = () => {
      const active = document.fullscreenElement === containerRef.current;
      setIsFullscreen(active);
      requestAnimationFrame(() => map?.invalidateSize({ animate: false }));
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [map]);

  React.useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const toggleFullscreen = React.useCallback(() => {
    const node = containerRef.current;
    if (!node) return;
    if (document.fullscreenElement === node) {
      void document.exitFullscreen();
    } else {
      void node.requestFullscreen?.().catch(() => setIsFullscreen(false));
    }
  }, []);

  const zoomBy = React.useCallback(
    (delta: number) => {
      if (!map) return;
      runProgrammatic(() =>
        map.setZoom(Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, map.getZoom() + delta))),
      );
    },
    [map, runProgrammatic],
  );

  const retryTiles = React.useCallback(() => {
    tileErrorsRef.current = 0;
    setTileStatus('loading');
    setTileKey((value) => value + 1);
  }, []);

  const handleSearchArea = React.useCallback(() => {
    if (!map || !onSearchArea) return;
    const bounds = map.getBounds();
    onSearchArea({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
    setAreaMoved(false);
  }, [map, onSearchArea]);

  const stateOverlay = resolveStateOverlay({
    tileStatus,
    isOnline,
    isEmpty: venues.length === 0,
    t,
  });

  const badgeLabel =
    mapLabel ?? `${t('title')} · ${t('status.points', { count: venues.length })}`;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={t('regionLabel')}
      className={cn(
        'relative isolate size-full overflow-hidden bg-muted',
        isFullscreen && 'rounded-none',
      )}
      onPointerDown={() => setWheelZoom(true)}
    >
      <MapContainer
        ref={setMap}
        center={[ALMATY_CENTER.lat, ALMATY_CENTER.lng]}
        zoom={MAP_DEFAULT_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        zoomControl={false}
        attributionControl
        keyboard
        scrollWheelZoom={wheelZoom || isFullscreen}
        // isolate удерживает внутренние z-index Leaflet (панели, контролы) внутри
        // карты, поэтому наши оверлеи предсказуемо лежат выше.
        className="isolate size-full min-h-[240px]"
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          key={`${provider.url}-${tileKey}`}
          url={provider.url}
          attribution={provider.attribution}
          subdomains={provider.subdomains}
          maxZoom={provider.maxZoom}
          detectRetina
          keepBuffer={3}
          eventHandlers={{
            load: () => {
              tileErrorsRef.current = 0;
              setTileStatus('ready');
            },
            tileerror: () => {
              tileErrorsRef.current += 1;
              // Сначала пробуем резервный источник тайлов, потом показываем ошибку.
              if (tileErrorsRef.current === 6 && !useFallbackTiles) {
                setUseFallbackTiles(true);
                tileErrorsRef.current = 0;
                return;
              }
              if (tileErrorsRef.current >= 6) setTileStatus('error');
            },
          }}
        />

        <MarkersLayer
          venues={venues}
          view={view}
          selectedId={selectedId}
          onSelect={select}
          kindOf={kindOf}
          labelOf={labelOf}
          onClusterClick={(node) => {
            if (!map) return;
            runProgrammatic(() => zoomToCluster(map, node));
            setAreaMoved(false);
          }}
        />

        {origin ? (
          <Marker
            position={[origin.lat, origin.lng]}
            icon={createUserLocationIcon(
              originIsUser ? t('status.yourLocation') : t('status.demoOrigin'),
            )}
            interactive={false}
            keyboard={false}
            zIndexOffset={-500}
          />
        ) : null}

        <SelectionKeyboardBridge onEscape={() => select(null)} onBackgroundClick={() => select(null)} />
      </MapContainer>

      {/* Контролы держим сверху справа: низ занимают карточка объекта и атрибуция. */}
      <div className="absolute right-2.5 top-2.5 z-20 flex flex-col gap-2">
        <MapControlGroup>
          <MapControl label={t('controls.zoomIn')} onClick={() => zoomBy(1)} compact={compact}>
            <Plus className="size-4" aria-hidden />
          </MapControl>
          <MapControl label={t('controls.zoomOut')} onClick={() => zoomBy(-1)} compact={compact}>
            <Minus className="size-4" aria-hidden />
          </MapControl>
        </MapControlGroup>

        <MapControlGroup>
          <MapControl label={t('controls.reset')} onClick={fitAll} compact={compact}>
            <Maximize className="size-4" aria-hidden />
          </MapControl>
          {showLocateControl && onLocateRequest ? (
            <MapControl
              label={t('controls.locate')}
              onClick={onLocateRequest}
              disabled={locating}
              active={originIsUser}
              compact={compact}
            >
              {locating ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Crosshair className="size-4" aria-hidden />
              )}
            </MapControl>
          ) : null}
          {showFullscreenControl ? (
            <MapControl
              label={isFullscreen ? t('controls.fullscreenExit') : t('controls.fullscreenEnter')}
              onClick={toggleFullscreen}
              compact={compact}
            >
              {isFullscreen ? (
                <Minimize className="size-4" aria-hidden />
              ) : (
                <Expand className="size-4" aria-hidden />
              )}
            </MapControl>
          ) : null}
        </MapControlGroup>
      </div>

      {onSearchArea ? (
        <MapSearchAreaButton
          visible={areaMoved && !stateOverlay}
          label={t('searchArea.button')}
          onClick={handleSearchArea}
        />
      ) : null}

      {areaFilterActive && onResetArea ? (
        <div className="absolute inset-x-0 top-14 z-30 flex justify-center px-3 sm:top-3 sm:px-16">
          <button
            type="button"
            onClick={() => {
              onResetArea();
              setAreaMoved(false);
            }}
            className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-full border bg-background/95 px-3.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur hover:text-foreground"
          >
            {t('searchArea.reset')}
          </button>
        </div>
      ) : null}

      <MapBadge label={badgeLabel} />

      {stateOverlay ? (
        <MapStateOverlay
          variant={stateOverlay.variant}
          title={stateOverlay.title}
          description={stateOverlay.description}
          actionLabel={
            stateOverlay.variant === 'error'
              ? t('states.errorAction')
              : stateOverlay.variant === 'empty'
                ? t('states.emptyAction')
                : undefined
          }
          onAction={
            stateOverlay.variant === 'error'
              ? retryTiles
              : stateOverlay.variant === 'empty'
                ? (onResetFilters ?? onResetArea ?? fitAll)
                : undefined
          }
        />
      ) : null}

      {selected ? (
        <SelectedVenueCard
          venue={selected}
          href={venueHref(selected, resolveHref)}
          kind={kindOf(selected)}
          onClose={() => select(null)}
        />
      ) : null}
    </div>
  );
}

/**
 * Слой маркеров: рендерим только то, что попадает в видимую область с запасом,
 * близкие объекты объединяем в кластеры. Выбранный объект всегда показываем
 * отдельным пином, чтобы он не «прятался» внутри кластера.
 */
function MarkersLayer({
  venues,
  view,
  selectedId,
  onSelect,
  kindOf,
  labelOf,
  onClusterClick,
}: {
  venues: VenueListItem[];
  view: ViewState;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  kindOf: (venue: VenueListItem) => MapPinKind;
  labelOf: (venue: VenueListItem) => string;
  onClusterClick: (node: ClusterNode) => void;
}) {
  const map = useMap();
  const t = useT('map');

  const nodes = React.useMemo(() => {
    const zoom = view.zoom;
    const padded = view.bounds?.pad(VIEWPORT_PADDING_RATIO) ?? null;

    const visible = padded
      ? venues.filter(
          (venue) =>
            venue.id === selectedId ||
            padded.contains(
              L.latLng(venue.location.coordinates.lat, venue.location.coordinates.lng),
            ),
        )
      : venues;

    const selectedVenue = visible.find((venue) => venue.id === selectedId) ?? null;
    const clusterable = selectedVenue
      ? visible.filter((venue) => venue.id !== selectedId)
      : visible;

    const clustered =
      zoom >= CLUSTER_DISABLE_ZOOM
        ? clusterable.map((venue) => ({
            id: venue.id,
            lat: venue.location.coordinates.lat,
            lng: venue.location.coordinates.lng,
            items: [venue],
          }))
        : clusterVenues(
            clusterable,
            (lat, lng) => map.project(L.latLng(lat, lng), zoom),
            CLUSTER_CELL_PX,
          );

    if (selectedVenue) {
      clustered.push({
        id: selectedVenue.id,
        lat: selectedVenue.location.coordinates.lat,
        lng: selectedVenue.location.coordinates.lng,
        items: [selectedVenue],
      });
    }

    return clustered;
  }, [venues, view, selectedId, map]);

  return (
    <>
      {nodes.map((node) => {
        if (isCluster(node)) {
          return (
            <Marker
              key={node.id}
              position={[node.lat, node.lng]}
              icon={createClusterIcon(
                node.items.length,
                `${t('cluster.aria', { count: node.items.length })}. ${t('cluster.hint')}`,
              )}
              keyboard
              eventHandlers={{
                click: (event) => {
                  L.DomEvent.stopPropagation(event);
                  onClusterClick(node);
                },
              }}
            />
          );
        }

        const venue = node.items[0];
        const active = venue.id === selectedId;
        const kind = kindOf(venue);
        const label = labelOf(venue);

        return (
          <Marker
            key={venue.id}
            position={[node.lat, node.lng]}
            icon={createPinIcon({
              kind,
              label,
              active,
              promo: Boolean(venue.promotion),
              ariaLabel:
                kind === 'venue'
                  ? t('pin.venueAria', { name: venue.name, price: label })
                  : t('pin.serviceAria', { name: venue.name }),
            })}
            keyboard
            zIndexOffset={active ? 1000 : 0}
            eventHandlers={{
              click: (event) => {
                L.DomEvent.stopPropagation(event);
                onSelect(active ? null : venue.id);
              },
            }}
          />
        );
      })}
    </>
  );
}

/** Escape и клик по «пустой» карте закрывают карточку объекта. */
function SelectionKeyboardBridge({
  onEscape,
  onBackgroundClick,
}: {
  onEscape: () => void;
  onBackgroundClick: () => void;
}) {
  useMapEvents({
    click: onBackgroundClick,
    keydown: (event) => {
      if ((event as unknown as { originalEvent: KeyboardEvent }).originalEvent.key === 'Escape') {
        onEscape();
      }
    },
  });
  return null;
}

function fitMapToVenues(map: L.Map, venues: VenueListItem[], origin?: Coordinates) {
  const points = venues.map((venue) =>
    L.latLng(venue.location.coordinates.lat, venue.location.coordinates.lng),
  );

  if (points.length === 0) {
    const center = origin
      ? L.latLng(origin.lat, origin.lng)
      : L.latLng(ALMATY_CENTER.lat, ALMATY_CENTER.lng);
    map.setView(center, MAP_DEFAULT_ZOOM);
    return;
  }

  if (points.length === 1) {
    map.setView(points[0], MAP_FOCUS_ZOOM);
    return;
  }

  const bounds = L.latLngBounds(points);
  // Точку пользователя добавляем в кадр, только если она рядом с результатами,
  // иначе карта «улетит» и объекты станут неразличимы.
  if (origin) {
    const userPoint = L.latLng(origin.lat, origin.lng);
    if (bounds.pad(1).contains(userPoint)) bounds.extend(userPoint);
  }

  map.fitBounds(bounds, { padding: [56, 56], maxZoom: MAP_FIT_MAX_ZOOM });
}

function zoomToCluster(map: L.Map, node: ClusterNode) {
  const points = node.items.map((venue) =>
    L.latLng(venue.location.coordinates.lat, venue.location.coordinates.lng),
  );
  const bounds = L.latLngBounds(points);

  // Все объекты в одной точке — просто приближаемся на шаг.
  if (bounds.getNorth() === bounds.getSouth() && bounds.getEast() === bounds.getWest()) {
    map.setView(bounds.getCenter(), Math.min(MAP_MAX_ZOOM, map.getZoom() + 2));
    return;
  }

  map.fitBounds(bounds, { padding: [64, 64], maxZoom: CLUSTER_DISABLE_ZOOM });
}

function resolveStateOverlay({
  tileStatus,
  isOnline,
  isEmpty,
  t,
}: {
  tileStatus: 'loading' | 'ready' | 'error';
  isOnline: boolean;
  isEmpty: boolean;
  t: ReturnType<typeof useT>;
}) {
  if (!isOnline) {
    return {
      variant: 'offline' as const,
      title: t('states.offlineTitle'),
      description: t('states.offlineDescription'),
    };
  }
  if (tileStatus === 'error') {
    return {
      variant: 'error' as const,
      title: t('states.errorTitle'),
      description: t('states.errorDescription'),
    };
  }
  if (tileStatus === 'loading') {
    return { variant: 'loading' as const, title: t('states.loading') };
  }
  if (isEmpty) {
    return {
      variant: 'empty' as const,
      title: t('states.emptyTitle'),
      description: t('states.emptyDescription'),
    };
  }
  return null;
}
