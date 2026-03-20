import apiClient from './client';
import type { Category } from '../types';

export async function fetchCategories(
  storeId: number,
  opts?: { limit?: number; offset?: number; parentId?: number | null },
): Promise<Category[]> {
  const params: Record<string, unknown> = {};
  if (opts?.limit != null) params.limit = opts.limit;
  if (opts?.offset != null) params.offset = opts.offset;
  if (opts?.parentId !== undefined) params.parent_id = opts.parentId;
  const { data } = await apiClient.get<Category[]>(
    `/stores/${storeId}/categories/`,
    { params },
  );
  return data;
}

export async function fetchCategory(
  storeId: number,
  categoryId: number,
): Promise<Category> {
  const { data } = await apiClient.get<Category>(
    `/stores/${storeId}/categories/${categoryId}`,
  );
  return data;
}
