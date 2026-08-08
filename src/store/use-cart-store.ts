'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  venueId: string;
  venueSlug: string;
  venueName: string;
  venueImage: string;
  venueAddress: string;
  date: string;
  time: string;
  guests: number;
  comment?: string;
  /** Ориентировочная сумма на компанию / депозит */
  estimatedTotal: number;
  extras: { serviceId: string; name: string; price: number; quantity: number }[];
  addedAt: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => string;
  removeItem: (id: string) => void;
  clear: () => void;
  updateGuests: (id: string, guests: number) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const id = `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set({
          items: [
            ...get().items,
            { ...item, id, addedAt: new Date().toISOString() },
          ],
        });
        return id;
      },
      removeItem: (id) => set({ items: get().items.filter((item) => item.id !== id) }),
      clear: () => set({ items: [] }),
      updateGuests: (id, guests) =>
        set({
          items: get().items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  guests,
                  estimatedTotal: Math.round(
                    (item.estimatedTotal / Math.max(item.guests, 1)) * guests,
                  ),
                }
              : item,
          ),
        }),
    }),
    { name: 'market-fix-cart' },
  ),
);

export function selectCartCount(state: CartState) {
  return state.items.length;
}

export function selectCartTotal(state: CartState) {
  return state.items.reduce((sum, item) => sum + item.estimatedTotal, 0);
}
