import { apiClient } from './client';
import { ApiResponse, Customer, PaginatedResponse } from './types';

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerType?: string;
}

export async function listCustomers(params: CustomerListParams) {
  const res = await apiClient.get<PaginatedResponse<Customer>>('/customers', { params });
  return res.data;
}

export async function getCustomer(id: string) {
  const res = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
  return res.data.data;
}

export async function createCustomer(payload: Partial<Customer>) {
  const res = await apiClient.post<ApiResponse<Customer>>('/customers', payload);
  return res.data.data;
}

export async function updateCustomer(id: string, payload: Partial<Customer>) {
  const res = await apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, payload);
  return res.data.data;
}

export async function addCustomerNote(id: string, note: string, followUpAt?: string) {
  const res = await apiClient.post(`/customers/${id}/notes`, { note, followUpAt });
  return res.data.data;
}
