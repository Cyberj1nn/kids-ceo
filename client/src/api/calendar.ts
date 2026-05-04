import api from './axios';

export type AudienceType = 'all' | 'users' | 'groups';
export type EditScope = 'this' | 'following';

export interface RecurrencePattern {
  weekdays: number[]; // 0..6, 0=Sun
  until: string;      // 'YYYY-MM-DD'
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  startAt: string;
  createdBy: string;
  createdAt: string;
  audienceType: AudienceType;
  recurrenceId: string | null;
  recurrencePattern: RecurrencePattern | null;
  // приходят только в админской выдаче (для редактирования)
  audienceUserIds?: string[];
  audienceGroupIds?: string[];
}

export interface CalendarEventInput {
  title: string;
  description?: string | null;
  link?: string | null;
  startAt: string; // ISO
  audienceType: AudienceType;
  audienceUserIds?: string[];
  audienceGroupIds?: string[];
  recurrence?: RecurrencePattern | null;
}

export interface CreateRecurringResult {
  events: CalendarEvent[];
  recurrenceId: string;
}

export async function getEvents(params?: { from?: string; to?: string }): Promise<CalendarEvent[]> {
  const { data } = await api.get<CalendarEvent[]>('/calendar/events', { params });
  return data;
}

export async function createEvent(
  input: CalendarEventInput
): Promise<CalendarEvent | CreateRecurringResult> {
  const { data } = await api.post<CalendarEvent | CreateRecurringResult>('/calendar/events', input);
  return data;
}

export async function updateEvent(
  id: string,
  input: Partial<CalendarEventInput>,
  scope: EditScope = 'this'
): Promise<CalendarEvent & { affectedCount: number }> {
  const { data } = await api.put<CalendarEvent & { affectedCount: number }>(
    `/calendar/events/${id}`,
    input,
    { params: { scope } }
  );
  return data;
}

export async function deleteEvent(id: string, scope: EditScope = 'this'): Promise<{ affectedCount: number }> {
  const { data } = await api.delete<{ affectedCount: number }>(`/calendar/events/${id}`, {
    params: { scope },
  });
  return data;
}
