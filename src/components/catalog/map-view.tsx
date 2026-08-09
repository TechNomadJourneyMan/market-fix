'use client';

import * as React from 'react';
import { List, Map as MapIcon } from 'lucide-react';

import type { Coordinates, VenueListItem } from '@/types';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/client';
import { VenueMap } from '@/components/map/venue-map';
import type { MapBoundsRect } from '@/components/map/map-types';
import { VenueCardRow } from '@/components/venue/venue-card';

/**
 * Режим карты в каталоге: список и карта синхронизированы в обе стороны.
 * Desktop — две колонки, mobile — переключатель «Карта / Список».
 */
export function MapView({
  venues,
  origin,
}: {
  venues: VenueListItem[];
  origin?: Coordinates;
}) {
  const t = useT('map');
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [pane, setPane] = React.useState<'map' | 'list'>('list');
  const [area, setArea] = React.useState<MapBoundsRect | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const visible = React.useMemo(() => {
    if (!area) return venues;
    return venues.filter(({ location }) => {
      const { lat, lng } = location.coordinates;
      return lat <= area.north && lat >= area.south && lng <= area.east && lng >= area.west;
    });
  }, [venues, area]);

  const handleActiveChange = (venueId: string | null) => {
    setActiveId(venueId);
    if (!venueId) return;
    listRef.current
      ?.querySelector(`[data-venue-id="${venueId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div className="space-y-3">
      <div className="flex rounded-xl border p-0.5 lg:hidden" role="group">
        {(
          [
            ['list', List, `${t('controls.showList')} (${visible.length})`],
            ['map', MapIcon, t('controls.showMap')],
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
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div
          ref={listRef}
          className={cn(
            'order-2 max-h-[70vh] space-y-3 overflow-y-auto pr-1 lg:order-1 lg:max-h-[calc(100vh-13rem)]',
            pane === 'map' && 'hidden lg:block',
          )}
        >
          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-center">
              <p className="text-sm font-semibold">{t('list.emptyTitle')}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('states.emptyDescription')}
              </p>
            </div>
          ) : null}

          {visible.map((venue) => (
            <div
              key={venue.id}
              data-venue-id={venue.id}
              onMouseEnter={() => setActiveId(venue.id)}
              onMouseLeave={() => setActiveId(null)}
              className={cn(
                'rounded-2xl transition-all',
                activeId === venue.id &&
                  'ring-2 ring-primary ring-offset-2 ring-offset-background',
              )}
            >
              <VenueCardRow venue={venue} />
            </div>
          ))}
        </div>

        <div
          className={cn(
            'order-1 lg:order-2 lg:sticky lg:top-24',
            pane === 'list' && 'hidden lg:block',
          )}
        >
          <VenueMap
            venues={visible}
            origin={origin}
            activeVenueId={activeId ?? undefined}
            onActiveChange={handleActiveChange}
            onSearchArea={setArea}
            onResetArea={() => setArea(null)}
            areaFilterActive={Boolean(area)}
            onResetFilters={() => setArea(null)}
            className="h-[58vh] lg:h-[calc(100vh-13rem)]"
          />
        </div>
      </div>
    </div>
  );
}
