'use client';

import * as React from 'react';
import { useRecentStore } from '@/store/use-recent-store';

/** Невидимый трекер: пишет заведение в «Недавно смотрели». */
export function TrackRecent({
  id,
  slug,
  name,
  coverImage,
  tagline,
}: {
  id: string;
  slug: string;
  name: string;
  coverImage: string;
  tagline: string;
}) {
  const track = useRecentStore((state) => state.track);

  React.useEffect(() => {
    track({ id, slug, name, coverImage, tagline });
  }, [track, id, slug, name, coverImage, tagline]);

  return null;
}
