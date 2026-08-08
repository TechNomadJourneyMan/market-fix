'use client';

import { create } from 'zustand';
import type { VenueListItem } from '@/types';

/** Минимум данных, нужных модалке бронирования. */
export interface BookingTarget {
  id: string;
  slug: string;
  name: string;
  coverImage: string;
  address: string;
  averagePrice: number;
  rating: number;
  reviewsCount: number;
  categoryName: string;
  capacity: number;
}

interface BookingState {
  target: BookingTarget | null;
  isOpen: boolean;
  /** Предзаполнение из каталога/AI: дата, время, гости. */
  prefill: { date?: string; time?: string; guests?: number };
  open: (target: BookingTarget, prefill?: BookingState['prefill']) => void;
  close: () => void;
}

/**
 * Модалка бронирования живёт в корневом layout, а открывается из любого места:
 * карточка в каталоге, детальная страница, AI-подбор, избранное.
 */
export const useBookingStore = create<BookingState>((set) => ({
  target: null,
  isOpen: false,
  prefill: {},

  open: (target, prefill = {}) => set({ target, prefill, isOpen: true }),
  close: () => set({ isOpen: false }),
}));

export function venueToBookingTarget(venue: VenueListItem): BookingTarget {
  return {
    id: venue.id,
    slug: venue.slug,
    name: venue.name,
    coverImage: venue.coverImage,
    address: venue.location.address,
    averagePrice: venue.averagePrice,
    rating: venue.rating.score,
    reviewsCount: venue.rating.count,
    categoryName: venue.categoryName,
    capacity: venue.capacity,
  };
}
