import apiClient from './client';
import type { Store } from '../types';

export async function fetchStores(): Promise<Store[]> {
  const { data } = await apiClient.get<Store[]>('/stores');
  return data;
}

export async function fetchStore(storeId: number): Promise<Store> {
  const { data } = await apiClient.get<Store>(`/stores/${storeId}`);
  return data;
}
