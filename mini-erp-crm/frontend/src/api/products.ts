import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, Product } from './types';

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
}

export async function listProducts(params: ProductListParams) {
  const res = await apiClient.get<PaginatedResponse<Product>>('/products', { params });
  return res.data;
}

export async function getProduct(id: string) {
  const res = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
  return res.data.data;
}

export async function createProduct(payload: Partial<Product>) {
  const res = await apiClient.post<ApiResponse<Product>>('/products', payload);
  return res.data.data;
}

export async function updateProduct(id: string, payload: Partial<Product>) {
  const res = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, payload);
  return res.data.data;
}

export async function addStockMovement(
  id: string,
  payload: { quantity: number; movementType: 'IN' | 'OUT'; reason: string }
) {
  const res = await apiClient.post(`/products/${id}/stock-movements`, payload);
  return res.data.data;
}
