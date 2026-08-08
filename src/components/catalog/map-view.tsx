'use client';

import * as React from 'react';
import type { Coordinates, VenueListItem } from '@/types';
import { VenueMap } from '@/components/map/venue-map';
import { VenueCardRow } from '@/components/venue/venue-card';
import { cn } from '@/lib/utils';

/**
 * Режим карты: список слева, карта справа. Наведение на карточку подсвечивает пин,
 * клик по пину прокручивает список к нужной карточке.
 */
export function MapView({
  venues,
  origin,
}: {
  venues: VenueListItem[];
  origin?: Coordinates;
}) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const handleActiveChange = (venueId: string | null) => {
    setActiveId(venueId);
    if (!venueId || !listRef.current) return;
    const target = listRef.current.querySelector(`[data-venue-id="${venueId}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div
        ref={listRef}
        className="order-2 max-h-[70vh] space-y-3 overflow-y-auto pr-1 lg:order-1 lg:max-h-[calc(100vh-13rem)]"
      >
        {venues.map((venue) => (
          <div
            key={venue.id}
            data-venue-id={venue.id}
            onMouseEnter={() => setActiveId(venue.id)}
            onMouseLeave={() => setActiveId(null)}
            className={cn(
              'rounded-2xl transition-all',
              activeId === venue.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
            )}
          >
            <VenueCardRow venue={venue} />
          </div>
        ))}
      </div>

      <div className="order-1 lg:order-2 lg:sticky lg:top-24">
        <VenueMap
          venues={venues}
          origin={origin}
          activeVenueId={activeId ?? undefined}
          onActiveChange={handleActiveChange}
          className="h-[52vh] lg:h-[calc(100vh-13rem)]"
        />
      </div>
    </div>
  );
}
