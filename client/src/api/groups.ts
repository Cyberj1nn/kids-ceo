import api from './axios';

export interface UserGroup {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
}

export interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  login: string;
  role: string;
}

export interface UserGroupMembership {
  id: string;
  name: string;
  isMember: boolean;
}

// ----- Groups CRUD -----

export async function getGroups(): Promise<UserGroup[]> {
  const { data } = await api.get<UserGroup[]>('/groups');
  return data;
}

export async function createGroup(name: string): Promise<UserGroup> {
  const { data } = await api.post<UserGroup>('/groups', { name });
  return data;
}

export async function renameGroup(id: string, name: string): Promise<UserGroup> {
  const { data } = await api.put<UserGroup>(`/groups/${id}`, { name });
  return data;
}

export async function deleteGroup(id: string): Promise<void> {
  await api.delete(`/groups/${id}`);
}

// ----- Group members -----

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data } = await api.get<GroupMember[]>(`/groups/${groupId}/members`);
  return data;
}

export async function setGroupMembers(groupId: string, userIds: string[]): Promise<void> {
  await api.put(`/groups/${groupId}/members`, { userIds });
}

// ----- User-side: groups of one user -----

export async function getUserGroups(userId: string): Promise<UserGroupMembership[]> {
  const { data } = await api.get<UserGroupMembership[]>(`/users/${userId}/groups`);
  return data;
}

export async function setUserGroups(userId: string, groupIds: string[]): Promise<void> {
  await api.put(`/users/${userId}/groups`, { groupIds });
}
