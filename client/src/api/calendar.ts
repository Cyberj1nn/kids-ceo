import api from './axios';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  startAt: string;
  createdBy: string;
  createdAt: string;
}

export interface CalendarEventInput {
  title: string;
  description?: string | null;
  link?: string | null;
  startAt: string; // ISO
}

export async function getEvents(params?: { from?: string; to?: string }): Promise<CalendarEvent[]> {
  const { data } = await api.get<CalendarEvent[]>('/calendar/events', { params });
  return data;
}

export async function createEvent(input: CalendarEventInput): Promise<CalendarEvent> {
  const { data } = await api.post<CalendarEvent>('/calendar/events', input);
  return data;
}

export async function updateEvent(id: string, input: Partial<CalendarEventInput>): Promise<CalendarEvent> {
  const { data } = await api.put<CalendarEvent>(`/calendar/events/${id}`, input);
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/calendar/events/${id}`);
}
