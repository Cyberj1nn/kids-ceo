import api from './axios';

export async function getVapidPublicKey(): Promise<string> {
  const { data } = await api.get<{ publicKey: string }>('/push/vapid-public-key');
  return data.publicKey;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
  timezone?: string;
}

export async function subscribePush(payload: PushSubscriptionPayload): Promise<void> {
  await api.post('/push/subscribe', payload);
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  await api.delete('/push/subscribe', { data: { endpoint } });
}
