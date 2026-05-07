import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authJWT } from '../middleware/auth';
import { AuthRequest } from '../types';
import {
  broadcastMessage,
  broadcastRoomRead,
  notifyUnread,
  isUserActiveInRoom,
  pushNotificationToUser,
} from '../socket';
import { sendPushToUser } from '../services/webPush';

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
         cr.tab_slug AS "tabSlug",
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
         AND (
           cr.type <> 'personal'
           OR EXISTS (
             SELECT 1
               FROM chat_room_members crm2
               JOIN users u2 ON u2.id = crm2.user_id
              WHERE crm2.chat_room_id = cr.id
                AND u2.role = 'user'
                AND u2.deleted_at IS NULL
           )
         )
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

    const baseSelect = `
        SELECT m.id, m.text, m.created_at AS "createdAt",
               m.sender_id AS "senderId",
               u.first_name || ' ' || u.last_name AS "senderName",
               u.role AS "senderRole",
               m.reply_to_id AS "replyToId",
               rm.text AS "replyToText",
               ru.first_name || ' ' || ru.last_name AS "replyToSender",
               EXISTS(
                 SELECT 1 FROM message_read_status mrs
                 WHERE mrs.message_id = m.id AND mrs.user_id != m.sender_id
               ) AS "read"
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        LEFT JOIN messages rm ON rm.id = m.reply_to_id
        LEFT JOIN users ru ON ru.id = rm.sender_id`;

    if (before) {
      messagesQuery = `${baseSelect}
        WHERE m.chat_room_id = $1 AND m.created_at < $2
        ORDER BY m.created_at DESC
        LIMIT $3`;
      params = [roomId, before, limit];
    } else {
      messagesQuery = `${baseSelect}
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
    const { text, replyToId } = req.body;

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

    // Валидация reply_to_id
    let validReplyToId: string | null = null;
    if (replyToId) {
      const { rows: replyRows } = await query(
        'SELECT id FROM messages WHERE id = $1 AND chat_room_id = $2',
        [replyToId, roomId]
      );
      if (replyRows.length > 0) validReplyToId = replyToId;
    }

    const { rows } = await query(
      `INSERT INTO messages (chat_room_id, sender_id, text, reply_to_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, text, created_at AS "createdAt", sender_id AS "senderId", reply_to_id AS "replyToId"`,
      [roomId, userId, text.trim(), validReplyToId]
    );

    // Получаем имя отправителя + reply-цитату
    const { rows: userRows } = await query(
      `SELECT first_name || ' ' || last_name AS "senderName", role AS "senderRole" FROM users WHERE id = $1`,
      [userId]
    );

    let replyToText: string | null = null;
    let replyToSender: string | null = null;
    if (validReplyToId) {
      const { rows: replyInfo } = await query(
        `SELECT rm.text, ru.first_name || ' ' || ru.last_name AS sender_name
         FROM messages rm JOIN users ru ON ru.id = rm.sender_id
         WHERE rm.id = $1`,
        [validReplyToId]
      );
      if (replyInfo.length > 0) {
        replyToText = replyInfo[0].text;
        replyToSender = replyInfo[0].sender_name;
      }
    }

    const message = {
      ...rows[0],
      senderName: userRows[0].senderName,
      senderRole: userRows[0].senderRole,
      replyToText,
      replyToSender,
      read: false,
    };

    // Автоматически отмечаем как прочитанное для отправителя
    await query(
      'INSERT INTO message_read_status (message_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [message.id, userId]
    );

    // Broadcast через WebSocket
    broadcastMessage(roomId, message);

    // Тип комнаты — для решения, создавать ли persistent-уведомление
    const { rows: roomRows } = await query(
      `SELECT type, name FROM chat_rooms WHERE id = $1`,
      [roomId]
    );
    const roomType: string | undefined = roomRows[0]?.type;
    const roomName: string | undefined = roomRows[0]?.name;

    // Обновить badge непрочитанных для всех участников комнаты (кроме отправителя)
    const { rows: members } = await query(
      'SELECT user_id FROM chat_room_members WHERE chat_room_id = $1 AND user_id != $2',
      [roomId, userId]
    );
    for (const member of members) {
      // Личные сообщения — создаём notification, если пользователь не открыт в этом чате прямо сейчас
      if (roomType === 'personal') {
        const isActive = await isUserActiveInRoom(member.user_id, roomId);
        if (!isActive) {
          const senderName = userRows[0].senderName as string;
          const preview = text.trim().length > 120 ? text.trim().slice(0, 120) + '…' : text.trim();
          const { rows: notifRows } = await query(
            `INSERT INTO notifications (user_id, kind, title, body, link, payload)
             VALUES ($1, 'personal_message', $2, $3, $4, $5)
             RETURNING id, kind, title, body, link, payload,
                       read_at AS "readAt",
                       created_at AS "createdAt"`,
            [
              member.user_id,
              senderName,
              preview,
              '/personal-chat',
              JSON.stringify({ roomId, roomName, messageId: message.id }),
            ]
          );
          await pushNotificationToUser(member.user_id, notifRows[0]);
          void sendPushToUser(member.user_id, {
            title: userRows[0].senderName as string,
            body: preview,
            link: '/personal-chat',
            tag: `chat-${roomId}`,
          });
          continue;
        }
      }
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

    const { rowCount } = await query(
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

    // Уведомить отправителей что их сообщения прочитаны
    if (rowCount && rowCount > 0) {
      broadcastRoomRead(roomId, userId);
    }

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
