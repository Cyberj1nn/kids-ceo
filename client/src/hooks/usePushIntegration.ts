import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentSubscription, isPushSupported, subscribeUser } from '../lib/push';

/**
 * Подключает интеграцию Web Push к авторизованной части приложения:
 *  - после монтирования (~5 сек) при granted-разрешении синхронизирует подписку
 *    с сервером (на случай нового устройства / ротации endpoint);
 *  - слушает postMessage от Service Worker:
 *      type=navigate     — переход внутри SPA по ссылке из push-нотификации;
 *      type=push:resubscribe — переподписка после pushsubscriptionchange.
 */
export default function usePushIntegration(): void {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPushSupported()) return;
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    const autoResubscribe = async () => {
      if (cancelled) return;
      try {
        if (Notification.permission !== 'granted') return;
        const sub = await getCurrentSubscription();
        if (sub) {
          await subscribeUser();
        }
      } catch {
        // silent
      }
    };

    const timer = window.setTimeout(autoResubscribe, 5000);

    const onMessage = async (event: MessageEvent) => {
      const data = event.data || {};
      if (data.type === 'navigate' && typeof data.link === 'string') {
        if (/^https?:\/\//i.test(data.link)) {
          window.open(data.link, '_blank', 'noopener,noreferrer');
        } else {
          navigate(data.link);
        }
      } else if (data.type === 'push:resubscribe') {
        try {
          if (Notification.permission === 'granted') {
            await subscribeUser();
          }
        } catch {
          // silent
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', onMessage);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };
  }, [navigate]);
}
