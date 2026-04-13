import api from './axios';

export interface DtpEntry {
  id: string;
  userId: string;
  year: number;
  month: number;
  week: number;
  dayIndex: number;
  entryDate: string;
  achievements: string;
  difficulties: string;
  suggestions: string;
  createdAt: string;
  updatedAt: string;
}

export interface DtpAuditItem {
  id: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
  changedBy: string;
}

export async function getDtpEntries(userId: string, year: number, month: number): Promise<DtpEntry[]> {
  const { data } = await api.get<DtpEntry[]>('/dtp', { params: { user_id: userId, year, month } });
  return data;
}

export async function saveDtpEntry(payload: {
  year: number; month: number; week: number;
  dayIndex: number; entryDate: string;
  achievements: string; difficulties: string; suggestions: string;
}): Promise<DtpEntry> {
  const { data } = await api.post<DtpEntry>('/dtp', payload);
  return data;
}

export async function updateDtpEntry(id: string, fields: {
  achievements?: string; difficulties?: string; suggestions?: string;
}): Promise<any> {
  const { data } = await api.put(`/dtp/${id}`, fields);
  return data;
}

export async function getDtpAudit(entryId: string): Promise<DtpAuditItem[]> {
  const { data } = await api.get<DtpAuditItem[]>(`/dtp/${entryId}/audit`);
  return data;
}
