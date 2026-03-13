import apiClient from './client';
import type { Order } from '../types';

export async function createOrder(data: {
  store_id: number;
  items: { product_id: number; quantity: number }[];
  comment?: string;
}): Promise<Order> {
  const { data: order } = await apiClient.post<Order>('/orders', data);
  return order;
}

export async function fetchOrders(
  limit?: number,
  offset?: number,
): Promise<Order[]> {
  const { data } = await apiClient.get<Order[]>('/orders', {
    params: { limit, offset },
  });
  return data;
}

export async function fetchOrder(orderId: number): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${orderId}`);
  return data;
}
