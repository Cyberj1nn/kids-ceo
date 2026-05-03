import api from './axios';

export type NotificationKind = 'event_1h' | 'event_5min' | 'personal_message';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  payload: Record<string, any> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsCount {
  notificationsUnread: number;
  messagesUnread: number;
  total: number;
}

export async function getNotifications(limit = 50): Promise<AppNotification[]> {
  const { data } = await api.get<AppNotification[]>('/notifications', { params: { limit } });
  return data;
}

export async function getNotificationsCount(): Promise<NotificationsCount> {
  const { data } = await api.get<NotificationsCount>('/notifications/count');
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.put('/notifications/read-all');
}
