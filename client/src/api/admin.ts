import api from './axios';

export interface UserGroupRef {
  id: string;
  name: string;
}

export interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  login: string;
  role: string;
  createdAt: string;
  groups?: UserGroupRef[];
}

export interface TabAccess {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
  hasAccess: boolean;
}

export async function getUsers(): Promise<UserItem[]> {
  const { data } = await api.get<UserItem[]>('/users');
  return data;
}

export async function createUser(payload: {
  firstName: string; lastName: string; login: string; password: string; role?: string;
}): Promise<UserItem> {
  const { data } = await api.post<UserItem>('/users', payload);
  return data;
}

export async function updateUser(id: string, payload: {
  firstName?: string; lastName?: string; login?: string; role?: string;
}): Promise<UserItem> {
  const { data } = await api.put<UserItem>(`/users/${id}`, payload);
  return data;
}

export async function resetPassword(id: string): Promise<{ newPassword: string }> {
  const { data } = await api.post<{ newPassword: string }>(`/users/${id}/reset-password`);
  return data;
}

export async function deactivateUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function getUserTabs(userId: string): Promise<TabAccess[]> {
  const { data } = await api.get<TabAccess[]>(`/users/${userId}/tabs`);
  return data;
}

export async function setUserTabs(userId: string, tabIds: number[]): Promise<void> {
  await api.put(`/users/${userId}/tabs`, { tabIds });
}
