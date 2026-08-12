import { apiClient } from './client';
import { ApiResponse, User } from './types';

export async function login(email: string, password: string) {
  const res = await apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
    email,
    password,
  });
  return res.data.data;
}

export async function fetchMe() {
  const res = await apiClient.get<ApiResponse<User>>('/auth/me');
  return res.data.data;
}
