import webpush from 'web-push';
import { config } from '../config';
import { query } from '../db/pool';

let isConfigured = false;

export function initWebPush(): void {
  const { publicKey, privateKey, subject } = config.webPush;
  if (!publicKey || !privateKey) {
    console.warn('Web Push: VAPID keys are not set, push notifications disabled');
    return;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  isConfigured = true;
  console.log('Web Push initialized');
}

export function isWebPushConfigured(): boolean {
  return isConfigured;
}

export interface PushPayload {
  title: string;
  body?: string;
  link?: string;
  tag?: string;
  icon?: string;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string;
}

// Тихие часы 23:00–8:00 в TZ подписки.
function isQuietHours(timezone: string): boolean {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const hourPart = parts.find((p) => p.type === 'hour');
    if (!hourPart) return false;
    // В некоторых локалях возможен '24' в полночь — приводим к 0..23
    const hour = parseInt(hourPart.value, 10) % 24;
    return hour >= 23 || hour < 8;
  } catch {
    return false;
  }
}

/**
 * Отправить push всем активным подпискам пользователя.
 * Не бросает наружу — ошибки логируются. In-app уведомление в это же время
 * создаётся отдельно (вызывается до этой функции).
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!isConfigured) return;

  let subs: SubscriptionRow[];
  try {
    const { rows } = await query(
      `SELECT id, endpoint, p256dh, auth, timezone
       FROM push_subscriptions
       WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    subs = rows;
  } catch (err) {
    console.error('Web Push: failed to load subscriptions', err);
    return;
  }

  if (subs.length === 0) return;

  const json = JSON.stringify({
    title: payload.title,
    body: payload.body || '',
    link: payload.link || '/',
    tag: payload.tag,
    icon: payload.icon || '/icons/icon-192.png',
  });

  await Promise.all(
    subs.map(async (sub) => {
      if (isQuietHours(sub.timezone)) return;

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          json,
          { TTL: 86400 }
        );
        await query(
          `UPDATE push_subscriptions SET last_used_at = NOW() WHERE id = $1`,
          [sub.id]
        );
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          // Подписка больше не валидна — мягко удаляем
          await query(
            `UPDATE push_subscriptions SET deleted_at = NOW() WHERE id = $1`,
            [sub.id]
          ).catch(() => {});
        } else {
          console.error(`Web Push send failed (sub ${sub.id}, status ${status}):`, err?.message || err);
        }
      }
    })
  );
}
