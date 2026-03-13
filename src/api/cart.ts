import apiClient from './client';
import type { Cart } from '../types';

export async function fetchCart(storeId: number): Promise<Cart> {
  const { data } = await apiClient.get<Cart>('/cart', {
    params: { store_id: storeId },
  });
  return data;
}

export async function addToCart(
  productId: number,
  storeId: number,
  quantity: number = 1,
): Promise<Cart> {
  const { data } = await apiClient.post<Cart>('/cart/add', {
    product_id: productId,
    store_id: storeId,
    quantity,
  });
  return data;
}

export async function updateCartItem(
  productId: number,
  quantity: number,
): Promise<Cart> {
  const { data } = await apiClient.post<Cart>('/cart/update', {
    product_id: productId,
    quantity,
  });
  return data;
}

export async function removeFromCart(productId: number): Promise<Cart> {
  const { data } = await apiClient.post<Cart>('/cart/remove', {
    product_id: productId,
  });
  return data;
}

export async function clearCart(storeId: number): Promise<Cart> {
  const { data } = await apiClient.delete<Cart>('/cart', {
    params: { store_id: storeId },
  });
  return data;
}
