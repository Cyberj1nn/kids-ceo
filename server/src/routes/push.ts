import { Router, Response } from 'express';
import { config } from '../config';
import { query } from '../db/pool';
import { authJWT } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// GET /api/push/vapid-public-key — публичный VAPID-ключ для подписки на клиенте
router.get('/vapid-public-key', (_req, res: Response) => {
  res.json({ publicKey: config.webPush.publicKey });
});

// POST /api/push/subscribe — сохранить/обновить подписку текущего пользователя
// body: { endpoint, keys: { p256dh, auth }, userAgent?, timezone? }
router.post('/subscribe', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { endpoint, keys, userAgent, timezone } = req.body || {};

    if (typeof endpoint !== 'string' || !endpoint.startsWith('https://')) {
      res.status(400).json({ error: 'Некорректный endpoint' });
      return;
    }
    if (!keys || typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') {
      res.status(400).json({ error: 'Некорректные ключи подписки' });
      return;
    }

    const tz = typeof timezone === 'string' && timezone.length > 0 ? timezone : 'Europe/Moscow';
    const ua = typeof userAgent === 'string' ? userAgent.slice(0, 500) : null;

    await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, timezone, last_used_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (endpoint) DO UPDATE
         SET user_id = EXCLUDED.user_id,
             p256dh = EXCLUDED.p256dh,
             auth = EXCLUDED.auth,
             user_agent = EXCLUDED.user_agent,
             timezone = EXCLUDED.timezone,
             deleted_at = NULL,
             last_used_at = NOW()`,
      [userId, endpoint, keys.p256dh, keys.auth, ua, tz]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// DELETE /api/push/subscribe — мягко удалить подписку по endpoint
router.delete('/subscribe', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { endpoint } = req.body || {};

    if (typeof endpoint !== 'string' || !endpoint) {
      res.status(400).json({ error: 'endpoint обязателен' });
      return;
    }

    await query(
      `UPDATE push_subscriptions SET deleted_at = NOW()
       WHERE endpoint = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [endpoint, userId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
