'use client';

import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

interface FavoritesState {
  venueIds: string[];
  isHydrated: boolean;
  hydrate: (ids: string[]) => void;
  isFavorite: (venueId: string) => boolean;
  toggle: (venueId: string) => Promise<boolean>;
}

/**
 * Избранное держим в глобальном сторе: сердечко на карточке в каталоге и
 * на детальной странице должны меняться синхронно.
 * Обновляем оптимистично, при ошибке откатываем.
 */
export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  venueIds: [],
  isHydrated: false,

  hydrate: (ids) => set({ venueIds: ids, isHydrated: true }),

  isFavorite: (venueId) => get().venueIds.includes(venueId),

  toggle: async (venueId) => {
    const current = get().venueIds;
    const willBeFavorite = !current.includes(venueId);

    set({
      venueIds: willBeFavorite
        ? [venueId, ...current]
        : current.filter((id) => id !== venueId),
    });

    try {
      const result = await apiClient.post<{ isFavorite: boolean; venueIds: string[] }>(
        '/api/favorites',
        { venueId },
      );
      set({ venueIds: result.venueIds });
      return result.isFavorite;
    } catch {
      set({ venueIds: current });
      return !willBeFavorite;
    }
  },
}));
