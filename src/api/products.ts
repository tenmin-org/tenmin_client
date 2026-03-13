import apiClient from './client';
import type { PaginatedProducts } from '../types';

export async function fetchProducts(
  categoryId: number,
  limit?: number,
  offset?: number,
): Promise<PaginatedProducts> {
  const { data } = await apiClient.get<PaginatedProducts>(
    `/categories/${categoryId}/products`,
    { params: { limit, offset } },
  );
  return data;
}
