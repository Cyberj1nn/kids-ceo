import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { query } from '../db/pool';
import { authJWT } from '../middleware/auth';
import { roleCheck } from '../middleware/roleCheck';
import { AuthRequest } from '../types';
import { createPersonalRoom, addAdminToAllPersonalRooms, addUserToGeneralRoom } from '../db/queries/chatRooms';

const router = Router();
const ADMIN_ROLES = roleCheck(['superadmin', 'admin', 'mentor']);

// GET /api/users
router.get('/', authJWT, ADMIN_ROLES, async (_req: AuthRequest, res: Response) => {
  try {
    const { rows } = await query(
      `SELECT u.id,
              u.first_name AS "firstName",
              u.last_name AS "lastName",
              u.login,
              u.role,
              u.created_at AS "createdAt",
              COALESCE(
                (
                  SELECT json_agg(json_build_object('id', g.id, 'name', g.name) ORDER BY g.name)
                  FROM user_group_members m
                  JOIN user_groups g ON g.id = m.group_id AND g.deleted_at IS NULL
                  WHERE m.user_id = u.id
                ),
                '[]'::json
              ) AS groups
       FROM users u
       WHERE u.deleted_at IS NULL
       ORDER BY u.last_name, u.first_name`
    );
    res.json(rows);
  } catch (err) {
    console.error('Users list error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/users — создание пользователя
router.post('/', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, login, password, role } = req.body;
    const currentRole = req.user!.role;

    if (!firstName || !lastName || !login || !password) {
      res.status(400).json({ error: 'Имя, фамилия, логин и пароль обязательны' });
      return;
    }

    // Проверка прав на назначение роли
    const targetRole = role || 'user';
    if (['admin', 'mentor', 'superadmin'].includes(targetRole) && currentRole !== 'superadmin') {
      res.status(403).json({ error: 'Только суперадмин может назначать роли admin/mentor' });
      return;
    }

    // Проверка уникальности логина
    const { rows: existing } = await query('SELECT id FROM users WHERE login = $1', [login]);
    if (existing.length > 0) {
      res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await query(
      `INSERT INTO users (first_name, last_name, login, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, first_name AS "firstName", last_name AS "lastName", login, role`,
      [firstName, lastName, login, passwordHash, targetRole]
    );

    const newUser = rows[0];

    // Добавить в общую комнату чата
    await addUserToGeneralRoom(newUser.id);

    // Создать личную комнату (для обычных пользователей)
    if (targetRole === 'user') {
      await createPersonalRoom(newUser.id, firstName, lastName);
    } else {
      // Админ/наставник — добавить во все существующие личные комнаты
      await addAdminToAllPersonalRooms(newUser.id);
    }

    res.status(201).json(newUser);
  } catch (err) {
    console.error('User create error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/users/:id — редактирование пользователя
router.put('/:id', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;
    const { firstName, lastName, login, role } = req.body;
    const currentRole = req.user!.role;

    // Проверка прав на смену роли
    if (role && ['admin', 'mentor', 'superadmin'].includes(role) && currentRole !== 'superadmin') {
      res.status(403).json({ error: 'Только суперадмин может назначать роли admin/mentor' });
      return;
    }

    // Проверка уникальности логина
    if (login) {
      const { rows: dup } = await query(
        'SELECT id FROM users WHERE login = $1 AND id != $2',
        [login, userId]
      );
      if (dup.length > 0) {
        res.status(400).json({ error: 'Логин уже занят' });
        return;
      }
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (firstName !== undefined) { fields.push(`first_name = $${idx++}`); values.push(firstName); }
    if (lastName !== undefined) { fields.push(`last_name = $${idx++}`); values.push(lastName); }
    if (login !== undefined) { fields.push(`login = $${idx++}`); values.push(login); }
    if (role !== undefined) { fields.push(`role = $${idx++}`); values.push(role); }

    if (fields.length === 0) {
      res.status(400).json({ error: 'Нет полей для обновления' });
      return;
    }

    values.push(userId);
    const { rows } = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL
       RETURNING id, first_name AS "firstName", last_name AS "lastName", login, role`,
      values
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('User update error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/users/:id/reset-password — сброс пароля
router.post('/:id/reset-password', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;
    const newPassword = crypto.randomBytes(4).toString('hex'); // 8 символов
    const hash = await bcrypt.hash(newPassword, 10);

    const { rows } = await query(
      `UPDATE users SET password_hash = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING id`,
      [hash, userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    // Инвалидировать все refresh-токены
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);

    res.json({ newPassword });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// DELETE /api/users/:id — мягкое удаление
router.delete('/:id', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;

    // Нельзя удалить себя
    if (userId === req.user!.userId) {
      res.status(400).json({ error: 'Нельзя деактивировать свой аккаунт' });
      return;
    }

    const { rows } = await query(
      `UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    // Инвалидировать refresh-токены
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);

    res.json({ message: 'Пользователь деактивирован' });
  } catch (err) {
    console.error('User delete error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ========================
// Управление доступом к вкладкам
// ========================

// GET /api/users/:id/tabs — вкладки пользователя
router.get('/:id/tabs', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;

    const { rows: allTabs } = await query('SELECT id, slug, name, sort_order AS "sortOrder" FROM tabs ORDER BY sort_order');
    const { rows: access } = await query('SELECT tab_id FROM user_tab_access WHERE user_id = $1', [userId]);
    const accessSet = new Set(access.map((a: any) => a.tab_id));

    const result = allTabs.map((tab: any) => ({
      ...tab,
      hasAccess: accessSet.has(tab.id),
    }));

    res.json(result);
  } catch (err) {
    console.error('User tabs error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ========================
// Группы пользователя
// ========================

// GET /api/users/:id/groups — список всех активных групп с признаком членства
router.get('/:id/groups', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;

    const { rows } = await query(
      `SELECT g.id, g.name,
              EXISTS(
                SELECT 1 FROM user_group_members m
                WHERE m.group_id = g.id AND m.user_id = $1
              ) AS "isMember"
       FROM user_groups g
       WHERE g.deleted_at IS NULL
       ORDER BY g.name`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error('User groups error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/users/:id/groups — заменить набор групп пользователя (массив groupIds)
router.put('/:id/groups', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;
    const { groupIds } = req.body;
    const addedBy = req.user!.userId;

    if (!Array.isArray(groupIds)) {
      res.status(400).json({ error: 'groupIds должен быть массивом' });
      return;
    }

    // Убедимся, что пользователь существует
    const { rows: userRows } = await query(
      `SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    if (userRows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    await query('BEGIN');
    try {
      await query(`DELETE FROM user_group_members WHERE user_id = $1`, [userId]);
      for (const gid of groupIds) {
        await query(
          `INSERT INTO user_group_members (group_id, user_id, added_by)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [gid, userId, addedBy]
        );
      }
      await query('COMMIT');
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }

    res.json({ message: 'Группы обновлены', count: groupIds.length });
  } catch (err) {
    console.error('User set groups error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/users/:id/tabs — установить доступ к вкладкам
router.put('/:id/tabs', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;
    const { tabIds } = req.body; // number[]
    const grantedBy = req.user!.userId;

    if (!Array.isArray(tabIds)) {
      res.status(400).json({ error: 'tabIds должен быть массивом' });
      return;
    }

    // Удалить текущие
    await query('DELETE FROM user_tab_access WHERE user_id = $1', [userId]);

    // Добавить новые
    for (const tabId of tabIds) {
      await query(
        'INSERT INTO user_tab_access (user_id, tab_id, granted_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [userId, tabId, grantedBy]
      );
    }

    res.json({ message: 'Доступ обновлён', tabIds });
  } catch (err) {
    console.error('Update tabs error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
