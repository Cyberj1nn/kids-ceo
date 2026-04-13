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

    // Typing indicator (ephemeral, не сохраняется)
    socket.on('message:typing', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('message:typing', {
        roomId: data.roomId,
        userId,
      });
    });

    socket.on('disconnect', () => {
      // cleanup если нужно
    });
  });

  return io;
}

/**
 * Broadcast нового сообщения в комнату.
 * Вызывается из REST-роута после сохранения в БД.
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
 * Отправить обновление badge непрочитанных конкретному пользователю.
 */
export async function notifyUnread(userId: string) {
  if (!io) return;

  try {
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

    // Отправить всем сокетам этого пользователя
    const sockets = await io.fetchSockets();
    for (const s of sockets) {
      if ((s as any).userId === userId) {
        s.emit('notification:unread', { unreadCount: rows[0].count });
      }
    }
  } catch (err) {
    console.error('Notify unread error:', err);
  }
}

export { io };
