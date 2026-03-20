import apiClient from './client';
import type { PaginatedProducts } from '../types';

export async function fetchProducts(
  storeId: number,
  categoryId: number,
  limit?: number,
  offset?: number,
): Promise<PaginatedProducts> {
  const { data } = await apiClient.get<PaginatedProducts>(
    `/stores/${storeId}/categories/${categoryId}/products`,
    { params: { limit, offset } },
  );
  return data;
}
