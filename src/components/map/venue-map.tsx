'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { VenueMapProps } from '@/components/map/map-types';

export type { VenueMapProps } from '@/components/map/map-types';

/**
 * Leaflet работает только в браузере, поэтому канвас подключаем динамически.
 * До готовности показываем скелетон в габаритах будущей карты — без сдвига layout.
 */
const OsmMapCanvas = dynamic(
  () => import('@/components/map/osm-map-canvas').then((mod) => mod.OsmMapCanvas),
  { ssr: false, loading: () => <MapSkeleton /> },
);

/**
 * Карта объектов Market Fix на OpenStreetMap.
 * API-ключи не требуются, стартовый вид — Алматы.
 */
export function VenueMap({ className, ...props }: VenueMapProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-muted shadow-soft',
        className,
      )}
    >
      <OsmMapCanvas {...props} />
    </div>
  );
}

function MapSkeleton() {
  return (
    <div
      className="flex size-full min-h-[240px] items-center justify-center bg-muted"
      role="status"
      aria-live="polite"
    >
      <div
        className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-secondary/60 to-muted"
        aria-hidden
      />
      <Loader2 className="relative size-5 animate-spin text-muted-foreground" aria-hidden />
    </div>
  );
}
