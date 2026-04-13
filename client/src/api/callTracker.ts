import api from './axios';

export interface CallTrackerEntry {
  id: string;
  userId: string;
  callDate: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  authorName: string;
}

export async function getCallTrackerEntries(userId: string): Promise<CallTrackerEntry[]> {
  const { data } = await api.get<CallTrackerEntry[]>('/call-tracker', { params: { user_id: userId } });
  return data;
}

export async function createCallTrackerEntry(targetUserId: string, callDate: string, summary: string): Promise<CallTrackerEntry> {
  const { data } = await api.post<CallTrackerEntry>('/call-tracker', { targetUserId, callDate, summary });
  return data;
}

export async function updateCallTrackerEntry(id: string, fields: { callDate?: string; summary?: string }): Promise<any> {
  const { data } = await api.put(`/call-tracker/${id}`, fields);
  return data;
}

export async function deleteCallTrackerEntry(id: string): Promise<void> {
  await api.delete(`/call-tracker/${id}`);
}
