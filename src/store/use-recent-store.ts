'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentVenue {
  id: string;
  slug: string;
  name: string;
  coverImage: string;
  tagline: string;
  viewedAt: string;
}

interface RecentState {
  items: RecentVenue[];
  track: (venue: Omit<RecentVenue, 'viewedAt'>) => void;
  clear: () => void;
}

export const useRecentStore = create<RecentState>()(
  persist(
    (set, get) => ({
      items: [],
      track: (venue) => {
        const next = [
          { ...venue, viewedAt: new Date().toISOString() },
          ...get().items.filter((item) => item.id !== venue.id),
        ].slice(0, 12);
        set({ items: next });
      },
      clear: () => set({ items: [] }),
    }),
    { name: 'market-fix-recent' },
  ),
);
