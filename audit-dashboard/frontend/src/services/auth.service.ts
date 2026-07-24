import { apiClient } from './axiosClient';
import { LoginRequest, AuthResponse, AuthUser } from '@/types/auth.types';

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post('/auth/login', payload);
    return data.data as AuthResponse;
  },

  async refresh(): Promise<{ accessToken: string }> {
    const { data } = await apiClient.post('/auth/refresh');
    return data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get('/auth/me');
    return data.data as AuthUser;
  },
};
