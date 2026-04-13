import api from './axios';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  login: string;
  role: 'user' | 'admin' | 'superadmin' | 'mentor';
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Tab {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
}

export async function login(loginStr: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { login: loginStr, password });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me');
  return data;
}

export async function getTabs(): Promise<Tab[]> {
  const { data } = await api.get<Tab[]>('/tabs');
  return data;
}
