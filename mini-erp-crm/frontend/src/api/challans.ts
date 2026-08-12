import { apiClient } from './client';
import { ApiResponse, Challan, PaginatedResponse } from './types';

export interface ChallanListParams {
  page?: number;
  limit?: number;
  status?: string;
  customerId?: string;
}

export async function listChallans(params: ChallanListParams) {
  const res = await apiClient.get<PaginatedResponse<Challan>>('/challans', { params });
  return res.data;
}

export async function getChallan(id: string) {
  const res = await apiClient.get<ApiResponse<Challan>>(`/challans/${id}`);
  return res.data.data;
}

export async function createChallan(payload: {
  customerId: string;
  items: { productId: string; quantity: number }[];
}) {
  const res = await apiClient.post<ApiResponse<Challan>>('/challans', payload);
  return res.data.data;
}

export async function updateChallan(
  id: string,
  payload: { customerId?: string; items?: { productId: string; quantity: number }[] }
) {
  const res = await apiClient.put<ApiResponse<Challan>>(`/challans/${id}`, payload);
  return res.data.data;
}

export async function confirmChallan(id: string) {
  const res = await apiClient.post<ApiResponse<Challan>>(`/challans/${id}/confirm`);
  return res.data.data;
}

export async function cancelChallan(id: string) {
  const res = await apiClient.post<ApiResponse<Challan>>(`/challans/${id}/cancel`);
  return res.data.data;
}
