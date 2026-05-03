import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { query } from '../db/pool';
import { JwtPayload } from '../types';

let io: Server;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  activeRoomId?: string | null;
}

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
  });

  // JWT аутентификация
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Токен не предоставлен'));
    }

    try {
      const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
      socket.userId = payload.userId;
      socket.userRole = payload.role;
      next();
    } catch {
      next(new Error('Невалидный токен'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    socket.activeRoomId = null;

    // Join во все комнаты пользователя
    try {
      const { rows } = await query(
        'SELECT chat_room_id FROM chat_room_members WHERE user_id = $1',
        [userId]
      );
      for (const row of rows) {
        socket.join(row.chat_room_id);
      }
    } catch (err) {
      console.error('Socket join rooms error:', err);
    }

    // Typing indicator (ephemeral)
    socket.on('message:typing', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('message:typing', {
        roomId: data.roomId,
        userId,
      });
    });

    // Клиент сообщает, что открыл/закрыл чат — это влияет на создание notifications
    socket.on('chat:active', (data: { roomId: string | null }) => {
      socket.activeRoomId = data?.roomId || null;
    });

    socket.on('disconnect', () => {
      socket.activeRoomId = null;
    });
  });

  return io;
}

/**
 * Broadcast нового сообщения в комнату.
 */
export function broadcastMessage(roomId: string, message: any) {
  if (!io) return;
  io.to(roomId).emit('message:new', { roomId, message });
}

/**
 * Сообщить всем участникам комнаты, что userId прочитал сообщения.
 */
export function broadcastRoomRead(roomId: string, readByUserId: string) {
  if (!io) return;
  io.to(roomId).emit('room:read', { roomId, readByUserId });
}

/**
 * Проверить, активен ли у пользователя данный чат хотя бы в одном сокете.
 */
export async function isUserActiveInRoom(userId: string, roomId: string): Promise<boolean> {
  if (!io) return false;
  const sockets = await io.fetchSockets();
  for (const s of sockets) {
    const sock = s as unknown as AuthenticatedSocket;
    if (sock.userId === userId && sock.activeRoomId === roomId) {
      return true;
    }
  }
  return false;
}

/**
 * Отправить обновление badge непрочитанных сообщений конкретному пользователю.
 */
export async function notifyUnread(userId: string) {
  if (!io) return;

  try {
    const { rows: msg } = await query(
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

    const { rows: notif } = await query(
      `SELECT COUNT(*)::int AS count
       FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );

    const messagesUnread = msg[0].count;
    const notificationsUnread = notif[0].count;
    const total = messagesUnread + notificationsUnread;

    const sockets = await io.fetchSockets();
    for (const s of sockets) {
      if ((s as any).userId === userId) {
        s.emit('notification:unread', {
          unreadCount: messagesUnread, // обратная совместимость
          messagesUnread,
          notificationsUnread,
          total,
        });
      }
    }
  } catch (err) {
    console.error('Notify unread error:', err);
  }
}

/**
 * Отправить новое уведомление пользователю в реальном времени и обновить общий счётчик.
 */
export async function pushNotificationToUser(userId: string, notification: any): Promise<void> {
  if (!io) return;

  const sockets = await io.fetchSockets();
  for (const s of sockets) {
    if ((s as any).userId === userId) {
      s.emit('notification:new', notification);
    }
  }
  // обновим общий счётчик
  await notifyUnread(userId);
}

export { io };
