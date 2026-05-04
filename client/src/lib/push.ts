import { getVapidPublicKey, subscribePush, unsubscribePush } from '../api/push';

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if ((navigator as any).standalone === true) return true;
  return false;
}

export function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  try {
    const reg = await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await getRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

async function sendSubscriptionToServer(sub: PushSubscription): Promise<void> {
  const json = sub.toJSON();
  const p256dh = (json.keys as any)?.p256dh;
  const auth = (json.keys as any)?.auth;
  if (!p256dh || !auth) return;

  await subscribePush({
    endpoint: sub.endpoint,
    keys: { p256dh, auth },
    userAgent: navigator.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

/**
 * Создать новую подписку и отправить её на сервер.
 * Перед вызовом должно быть granted-разрешение.
 */
export async function subscribeUser(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await getRegistration();
  if (!reg) return null;

  // Если уже есть подписка — синхронизируем и возвращаем её
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    try {
      await sendSubscriptionToServer(existing);
    } catch {
      // silent
    }
    return existing;
  }

  const publicKey = await getVapidPublicKey();
  if (!publicKey) return null;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  await sendSubscriptionToServer(sub);
  return sub;
}

/**
 * Запросить разрешение и подписаться. Возвращает финальный статус.
 */
export async function requestPermissionAndSubscribe(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied';

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return permission;

  await subscribeUser();
  return 'granted';
}

/**
 * Отписаться: снять подписку в браузере и удалить её на сервере.
 */
export async function unsubscribeUser(): Promise<void> {
  if (!isPushSupported()) return;
  const reg = await getRegistration();
  if (!reg) return;

  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  const endpoint = sub.endpoint;
  try {
    await sub.unsubscribe();
  } catch {
    // silent
  }
  try {
    await unsubscribePush(endpoint);
  } catch {
    // silent
  }
}
