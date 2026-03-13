import { create } from 'zustand';
import type { Cart, CartItem } from '../types';

interface CartState {
  items: CartItem[];
  storeId: number | null;
  cartId: number | null;

  setCart: (cart: Cart) => void;
  addItem: (item: CartItem) => void;
  updateItem: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  storeId: null,
  cartId: null,

  setCart: (cart) =>
    set({
      items: cart.items,
      storeId: cart.store_id,
      cartId: cart.id,
    }),

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find(
        (i) => i.product_id === item.product_id,
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product_id === item.product_id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i,
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  updateItem: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product_id === productId ? { ...i, quantity } : i,
      ),
    })),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product_id !== productId),
    })),

  clearCart: () => set({ items: [], storeId: null, cartId: null }),

  getTotalPrice: () =>
    get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

  getTotalItems: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
