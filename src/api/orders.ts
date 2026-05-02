import apiClient from './client';
import type { Order, OrderSummary } from '../types';

export async function createOrder(data: {
  store_id: number;
  items: { product_id: number; quantity: number; weight_grams?: number }[];
  comment?: string;
  payment_method?: 'transfer' | 'card';
}): Promise<Order> {
  const { data: order } = await apiClient.post<Order>('/orders/', data);
  return order;
}

export async function fetchOrders(
  limit?: number,
  offset?: number,
): Promise<OrderSummary[]> {
  const { data } = await apiClient.get<OrderSummary[]>('/orders/', {
    params: { limit, offset },
  });
  return data;
}

export async function fetchOrder(orderId: number): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${orderId}`);
  return data;
}

export async function cancelOrder(orderId: number): Promise<Order> {
  const { data } = await apiClient.post<Order>(`/orders/${orderId}/cancel`);
  return data;
}
