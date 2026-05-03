import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authJWT } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// GET /api/notifications?limit=50 — последние уведомления текущего пользователя
router.get('/', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);

    const { rows } = await query(
      `SELECT id, kind, title, body, link, payload,
              read_at AS "readAt",
              created_at AS "createdAt"
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json(rows);
  } catch (err) {
    console.error('Notifications list error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/notifications/count — общий счётчик непрочитанных (события + личные сообщения)
// Это объединённый счётчик: непрочитанные notifications + непрочитанные сообщения личных чатов
router.get('/count', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const { rows: notifRows } = await query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );

    const { rows: msgRows } = await query(
      `SELECT COUNT(*)::int AS count
       FROM messages m
       JOIN chat_rooms cr ON cr.id = m.chat_room_id
       JOIN chat_room_members crm ON crm.chat_room_id = cr.id AND crm.user_id = $1
       WHERE cr.type = 'personal'
         AND m.sender_id != $1
         AND NOT EXISTS (
           SELECT 1 FROM message_read_status mrs
           WHERE mrs.message_id = m.id AND mrs.user_id = $1
         )`,
      [userId]
    );

    res.json({
      notificationsUnread: notifRows[0].count,
      messagesUnread: msgRows[0].count,
      total: notifRows[0].count + msgRows[0].count,
    });
  } catch (err) {
    console.error('Notifications count error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/notifications/:id/read — пометить одно уведомление прочитанным
router.put('/:id/read', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    await query(
      `UPDATE notifications SET read_at = NOW()
       WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
      [id, userId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Notification mark read error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/notifications/read-all — пометить все прочитанными
router.put('/read-all', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    await query(
      `UPDATE notifications SET read_at = NOW()
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Notifications read-all error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
