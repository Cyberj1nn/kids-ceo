import { query } from '../pool';

const GENERAL_ROOM_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Создаёт личную комнату для пользователя + все текущие admin/mentor/superadmin.
 * Вызывается при создании нового пользователя с ролью 'user'.
 */
export async function createPersonalRoom(userId: string, userFirstName: string, userLastName: string) {
  const roomName = `Личная работа ${userFirstName} ${userLastName}`;

  const { rows } = await query(
    `INSERT INTO chat_rooms (type, name) VALUES ('personal', $1) RETURNING id`,
    [roomName]
  );
  const roomId = rows[0].id;

  // Добавляем самого пользователя
  await query(
    'INSERT INTO chat_room_members (chat_room_id, user_id) VALUES ($1, $2)',
    [roomId, userId]
  );

  // Добавляем всех admin/mentor/superadmin
  const { rows: admins } = await query(
    `SELECT id FROM users WHERE role IN ('admin', 'mentor', 'superadmin') AND deleted_at IS NULL AND id != $1`,
    [userId]
  );

  for (const admin of admins) {
    await query(
      'INSERT INTO chat_room_members (chat_room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [roomId, admin.id]
    );
  }

  return roomId;
}

/**
 * Добавляет нового admin/mentor во все существующие личные комнаты.
 * Вызывается при создании пользователя с ролью admin/mentor/superadmin.
 */
export async function addAdminToAllPersonalRooms(adminId: string) {
  const { rows: rooms } = await query(
    `SELECT id FROM chat_rooms WHERE type = 'personal'`
  );

  for (const room of rooms) {
    await query(
      'INSERT INTO chat_room_members (chat_room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [room.id, adminId]
    );
  }
}

/**
 * Добавляет пользователя в общую комнату "Беседа".
 */
export async function addUserToGeneralRoom(userId: string) {
  await query(
    'INSERT INTO chat_room_members (chat_room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [GENERAL_ROOM_ID, userId]
  );
}

export { GENERAL_ROOM_ID };
