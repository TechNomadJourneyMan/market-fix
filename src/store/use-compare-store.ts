'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_COMPARE = 4;

interface CompareState {
  ids: string[];
  toggle: (venueId: string) => void;
  remove: (venueId: string) => void;
  clear: () => void;
  has: (venueId: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (venueId) => {
        const current = get().ids;
        if (current.includes(venueId)) {
          set({ ids: current.filter((id) => id !== venueId) });
          return;
        }
        if (current.length >= MAX_COMPARE) {
          set({ ids: [...current.slice(1), venueId] });
          return;
        }
        set({ ids: [...current, venueId] });
      },
      remove: (venueId) => set({ ids: get().ids.filter((id) => id !== venueId) }),
      clear: () => set({ ids: [] }),
      has: (venueId) => get().ids.includes(venueId),
    }),
    { name: 'market-fix-compare' },
  ),
);

export const MAX_COMPARE_VENUES = MAX_COMPARE;
