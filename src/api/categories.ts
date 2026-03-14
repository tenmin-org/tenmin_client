import apiClient from './client';
import type { Category } from '../types';

export async function fetchCategories(
  storeId: number,
  limit?: number,
  offset?: number,
): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>(
    `/stores/${storeId}/categories/`,
    { params: { limit, offset } },
  );
  return data;
}
