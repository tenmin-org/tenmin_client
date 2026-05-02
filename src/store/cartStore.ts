import { create } from 'zustand';
import type { Cart, CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  storeId: number | null;
  cartId: number | null;
  /** Стоимость доставки магазина (из API корзины) */
  deliveryPrice: number;

  /** Replace local state with server response */
  setCart: (cart: Cart) => void;
  clearCart: () => void;

  /** Optimistic helpers — mutate local state before API confirms */
  optimisticAdd: (product: Product) => void;
  optimisticSetQty: (productId: number, quantity: number) => void;
  optimisticRemove: (productId: number) => void;

  getTotalPrice: () => number;
  getTotalItems: () => number;
  getGrandTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  storeId: null,
  cartId: null,
  deliveryPrice: 0,

  setCart: (cart) =>
    set({
      items: cart.items,
      storeId: cart.store_id,
      cartId: cart.id,
      deliveryPrice: Number(cart.delivery_price ?? 0),
    }),

  clearCart: () =>
    set({ items: [], storeId: null, cartId: null, deliveryPrice: 0 }),

  optimisticAdd: (product) =>
    set((s) => {
      const existing = s.items.find((i) => i.product_id === product.id);
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.product_id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        };
      }
      const temp: CartItem = {
        id: -Date.now(),
        product_id: product.id,
        quantity: 1,
        product,
      };
      return { items: [...s.items, temp] };
    }),

  optimisticSetQty: (productId, quantity) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.product_id === productId ? { ...i, quantity } : i,
      ),
    })),

  optimisticRemove: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.product_id !== productId) })),

  getTotalPrice: () =>
    get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

  getTotalItems: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),

  getGrandTotal: () => get().getTotalPrice() + get().deliveryPrice,
}));
