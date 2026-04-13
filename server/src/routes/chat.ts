import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authJWT } from '../middleware/auth';
import { AuthRequest } from '../types';
import { broadcastMessage, notifyUnread } from '../socket';

const router = Router();

// ========================
// GET /api/chat/rooms
// Список комнат текущего пользователя
// ========================
router.get('/rooms', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const { rows } = await query(
      `SELECT
         cr.id,
         cr.type,
         cr.name,
         cr.created_at AS "createdAt",
         -- Последнее сообщение
         (SELECT m.text FROM messages m WHERE m.chat_room_id = cr.id ORDER BY m.created_at DESC LIMIT 1) AS "lastMessage",
         (SELECT m.created_at FROM messages m WHERE m.chat_room_id = cr.id ORDER BY m.created_at DESC LIMIT 1) AS "lastMessageAt",
         -- Непрочитанные
         (
           SELECT COUNT(*)::int FROM messages m
           WHERE m.chat_room_id = cr.id
             AND m.sender_id != $1
             AND NOT EXISTS (
               SELECT 1 FROM message_read_status mrs
               WHERE mrs.message_id = m.id AND mrs.user_id = $1
             )
         ) AS "unreadCount"
       FROM chat_rooms cr
       INNER JOIN chat_room_members crm ON crm.chat_room_id = cr.id
       WHERE crm.user_id = $1
       ORDER BY
         (SELECT m.created_at FROM messages m WHERE m.chat_room_id = cr.id ORDER BY m.created_at DESC LIMIT 1) DESC NULLS LAST,
         cr.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Chat rooms error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ========================
// GET /api/chat/rooms/:id/messages
// Сообщения с cursor-пагинацией (infinite scroll)
// ========================
router.get('/rooms/:id/messages', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const roomId = req.params.id as string;
    const userId = req.user!.userId;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 30, 100);
    const before = req.query.before as string | undefined;

    // Проверка членства
    const { rows: membership } = await query(
      'SELECT 1 FROM chat_room_members WHERE chat_room_id = $1 AND user_id = $2',
      [roomId, userId]
    );
    if (membership.length === 0) {
      res.status(403).json({ error: 'Нет доступа к этой комнате' });
      return;
    }

    let messagesQuery: string;
    let params: any[];

    if (before) {
      messagesQuery = `
        SELECT m.id, m.text, m.created_at AS "createdAt",
               m.sender_id AS "senderId",
               u.first_name || ' ' || u.last_name AS "senderName",
               u.role AS "senderRole"
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.chat_room_id = $1 AND m.created_at < $2
        ORDER BY m.created_at DESC
        LIMIT $3`;
      params = [roomId, before, limit];
    } else {
      messagesQuery = `
        SELECT m.id, m.text, m.created_at AS "createdAt",
               m.sender_id AS "senderId",
               u.first_name || ' ' || u.last_name AS "senderName",
               u.role AS "senderRole"
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.chat_room_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2`;
      params = [roomId, limit];
    }

    const { rows } = await query(messagesQuery, params);

    // Вернуть в хронологическом порядке (от старых к новым)
    res.json(rows.reverse());
  } catch (err) {
    console.error('Messages error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ========================
// POST /api/chat/rooms/:id/messages
// Отправка сообщения
// ========================
router.post('/rooms/:id/messages', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const roomId = req.params.id as string;
    const userId = req.user!.userId;
    const { text } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Текст сообщения обязателен' });
      return;
    }

    // Проверка членства
    const { rows: membership } = await query(
      'SELECT 1 FROM chat_room_members WHERE chat_room_id = $1 AND user_id = $2',
      [roomId, userId]
    );
    if (membership.length === 0) {
      res.status(403).json({ error: 'Нет доступа к этой комнате' });
      return;
    }

    const { rows } = await query(
      `INSERT INTO messages (chat_room_id, sender_id, text)
       VALUES ($1, $2, $3)
       RETURNING id, text, created_at AS "createdAt", sender_id AS "senderId"`,
      [roomId, userId, text.trim()]
    );

    // Получаем имя отправителя
    const { rows: userRows } = await query(
      `SELECT first_name || ' ' || last_name AS "senderName", role AS "senderRole" FROM users WHERE id = $1`,
      [userId]
    );

    const message = {
      ...rows[0],
      senderName: userRows[0].senderName,
      senderRole: userRows[0].senderRole,
    };

    // Автоматически отмечаем как прочитанное для отправителя
    await query(
      'INSERT INTO message_read_status (message_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [message.id, userId]
    );

    // Broadcast через WebSocket
    broadcastMessage(roomId, message);

    // Обновить badge непрочитанных для всех участников комнаты (кроме отправителя)
    const { rows: members } = await query(
      'SELECT user_id FROM chat_room_members WHERE chat_room_id = $1 AND user_id != $2',
      [roomId, userId]
    );
    for (const member of members) {
      notifyUnread(member.user_id);
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ========================
// PUT /api/chat/rooms/:id/read
// Пометить все сообщения в комнате как прочитанные
// ========================
router.put('/rooms/:id/read', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const roomId = req.params.id as string;
    const userId = req.user!.userId;

    await query(
      `INSERT INTO message_read_status (message_id, user_id)
       SELECT m.id, $2
       FROM messages m
       WHERE m.chat_room_id = $1
         AND m.sender_id != $2
         AND NOT EXISTS (
           SELECT 1 FROM message_read_status mrs
           WHERE mrs.message_id = m.id AND mrs.user_id = $2
         )`,
      [roomId, userId]
    );

    res.json({ message: 'Прочитано' });
  } catch (err) {
    console.error('Read messages error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ========================
// GET /api/notifications/unread-count
// Количество непрочитанных сообщений в личных беседах
// ========================
router.get('/unread-count', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const { rows } = await query(
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

    res.json({ unreadCount: rows[0].count });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
