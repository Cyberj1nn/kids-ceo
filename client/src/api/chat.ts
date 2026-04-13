import api from './axios';

export interface ChatRoom {
  id: string;
  type: 'general' | 'personal';
  name: string;
  createdAt: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  text: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  senderRole: string;
}

export async function getChatRooms(): Promise<ChatRoom[]> {
  const { data } = await api.get<ChatRoom[]>('/chat/rooms');
  return data;
}

export async function getMessages(roomId: string, before?: string, limit = 30): Promise<Message[]> {
  const params: Record<string, string | number> = { limit };
  if (before) params.before = before;
  const { data } = await api.get<Message[]>(`/chat/rooms/${roomId}/messages`, { params });
  return data;
}

export async function sendMessage(roomId: string, text: string): Promise<Message> {
  const { data } = await api.post<Message>(`/chat/rooms/${roomId}/messages`, { text });
  return data;
}

export async function markAsRead(roomId: string): Promise<void> {
  await api.put(`/chat/rooms/${roomId}/read`);
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<{ unreadCount: number }>('/notifications/unread-count');
  return data.unreadCount;
}
