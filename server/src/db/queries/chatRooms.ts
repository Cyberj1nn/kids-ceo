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
 * Добавляет пользователя в основную "Общую беседу".
 * Дополнительные программные чаты подключаются через групповой mapping (см. applyGroupTabDefaults).
 */
export async function addUserToGeneralRoom(userId: string) {
  await query(
    'INSERT INTO chat_room_members (chat_room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [GENERAL_ROOM_ID, userId]
  );
}

/**
 * Добавляет нового admin/mentor/superadmin во все general-комнаты,
 * чтобы он мог писать в любые групповые чаты (chat.ts проверяет membership).
 */
export async function addAdminToAllGeneralRooms(adminId: string) {
  await query(
    `INSERT INTO chat_room_members (chat_room_id, user_id)
     SELECT id, $1 FROM chat_rooms WHERE type = 'general'
     ON CONFLICT DO NOTHING`,
    [adminId]
  );
}

/**
 * Применяет дефолтные доступы к вкладкам и членство в general-чатах
 * для пользователя на основе его текущих групп.
 *
 * Только ДОБАВЛЯЕТ записи (UPSERT) — ничего не отзывает,
 * чтобы не сбрасывать ручные настройки админа в матрице доступа.
 */
export async function applyGroupTabDefaults(userId: string, grantedBy: string) {
  // 1. Открыть все вкладки, привязанные к группам пользователя
  await query(
    `INSERT INTO user_tab_access (user_id, tab_id, granted_by)
     SELECT $1, d.tab_id, $2
       FROM user_group_members m
       JOIN user_groups g ON g.id = m.group_id AND g.deleted_at IS NULL
       JOIN user_group_tab_defaults d ON d.group_id = g.id
      WHERE m.user_id = $1
     ON CONFLICT DO NOTHING`,
    [userId, grantedBy]
  );

  // 2. Добавить в членство general-чатов, привязанных к этим вкладкам
  await query(
    `INSERT INTO chat_room_members (chat_room_id, user_id)
     SELECT cr.id, $1
       FROM user_group_members m
       JOIN user_groups g ON g.id = m.group_id AND g.deleted_at IS NULL
       JOIN user_group_tab_defaults d ON d.group_id = g.id
       JOIN tabs t ON t.id = d.tab_id
       JOIN chat_rooms cr ON cr.tab_slug = t.slug AND cr.type = 'general'
      WHERE m.user_id = $1
     ON CONFLICT DO NOTHING`,
    [userId]
  );
}

export { GENERAL_ROOM_ID };
