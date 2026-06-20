'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { CartItem, CartAddon, Item, Variation } from '@/types';
import { calcLineTotal } from '@/lib/utils';

interface CartState {
  restaurantId: string | null;
  tableId: string | null;
  items: CartItem[];
  // Actions
  initCart: (restaurantId: string, tableId: string) => void;
  addItem: (
    item: Item,
    variation: Variation | null,
    addons: CartAddon[],
    quantity: number,
    notes: string
  ) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  // Computed
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      tableId: null,
      items: [],

      initCart: (restaurantId, tableId) => {
        const current = get();
        // Reset cart if switching restaurants
        if (current.restaurantId !== restaurantId) {
          set({ restaurantId, tableId, items: [] });
        } else {
          set({ restaurantId, tableId });
        }
      },

      addItem: (item, variation, addons, quantity, notes) => {
        const variationModifier = variation?.price_modifier ?? 0;
        const unitPrice = item.price + variationModifier;
        const lineTotal = calcLineTotal(
          item.price,
          variationModifier,
          addons.map((a) => a.price),
          quantity
        );

        const cartItem: CartItem = {
          cartId: nanoid(8),
          item,
          variation,
          addons,
          quantity,
          notes,
          unitPrice,
          lineTotal,
        };

        set((state) => ({ items: [...state.items, cartItem] }));
      },

      removeItem: (cartId) => {
        set((state) => ({
          items: state.items.filter((i) => i.cartId !== cartId),
        }));
      },

      updateQuantity: (cartId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (i.cartId !== cartId) return i;
            const lineTotal = calcLineTotal(
              i.item.price,
              i.variation?.price_modifier ?? 0,
              i.addons.map((a) => a.price),
              quantity
            );
            return { ...i, quantity, lineTotal };
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.lineTotal, 0),
    }),
    {
      name: 'dokan-cart',
      partialize: (state) => ({
        restaurantId: state.restaurantId,
        tableId: state.tableId,
        items: state.items,
      }),
    }
  )
);
