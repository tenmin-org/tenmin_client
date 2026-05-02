import { create } from 'zustand';
import type { Cart, CartItem, Product } from '../types';
import {
  cartLineSubtotal,
  defaultWeightGrams,
  isKgProduct,
} from '../utils/cartPricing';

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
  setWeightGrams: (productId: number, grams: number) => void;

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
    set((s) => {
      const prevByPid = new Map(s.items.map((i) => [i.product_id, i]));
      const items: CartItem[] = cart.items.map((i) => {
        if (!isKgProduct(i.product)) {
          return { ...i };
        }
        const prev = prevByPid.get(i.product_id);
        let weight = defaultWeightGrams(i.quantity);
        if (
          prev &&
          prev.weight_grams != null &&
          prev.weight_grams > 0 &&
          prev.quantity === i.quantity
        ) {
          weight = prev.weight_grams;
        }
        return { ...i, weight_grams: weight };
      });
      return {
        items,
        storeId: cart.store_id,
        cartId: cart.id,
        deliveryPrice: Number(cart.delivery_price ?? 0),
      };
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
              ? {
                  ...i,
                  quantity: i.quantity + 1,
                  ...(isKgProduct(product)
                    ? { weight_grams: defaultWeightGrams(i.quantity + 1) }
                    : {}),
                }
              : i,
          ),
        };
      }
      const temp: CartItem = {
        id: -Date.now(),
        product_id: product.id,
        quantity: 1,
        product,
        ...(isKgProduct(product) ? { weight_grams: 1000 } : {}),
      };
      return { items: [...s.items, temp] };
    }),

  optimisticSetQty: (productId, quantity) =>
    set((s) => ({
      items: s.items.map((i) => {
        if (i.product_id !== productId) return i;
        if (!isKgProduct(i.product)) return { ...i, quantity };
        return {
          ...i,
          quantity,
          weight_grams: defaultWeightGrams(quantity),
        };
      }),
    })),

  setWeightGrams: (productId, grams) =>
    set((s) => ({
      items: s.items.map((i) => {
        if (i.product_id !== productId || !isKgProduct(i.product)) return i;
        const maxG = i.quantity * 50000;
        const clamped = Math.min(Math.max(50, Math.round(grams)), maxG);
        return { ...i, weight_grams: clamped };
      }),
    })),

  optimisticRemove: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.product_id !== productId) })),

  getTotalPrice: () =>
    get().items.reduce((sum, i) => sum + cartLineSubtotal(i), 0),

  getTotalItems: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),

  getGrandTotal: () => get().getTotalPrice() + get().deliveryPrice,
}));
