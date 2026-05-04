import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authJWT } from '../middleware/auth';
import { roleCheck } from '../middleware/roleCheck';
import { AuthRequest } from '../types';
import { applyGroupTabDefaults } from '../db/queries/chatRooms';

const router = Router();
const ADMIN_ROLES = roleCheck(['superadmin', 'admin', 'mentor']);

// GET /api/groups — список активных групп с числом участников
router.get('/', authJWT, ADMIN_ROLES, async (_req: AuthRequest, res: Response) => {
  try {
    const { rows } = await query(
      `SELECT g.id, g.name,
              g.created_at AS "createdAt",
              g.updated_at AS "updatedAt",
              (SELECT COUNT(*)::int FROM user_group_members m WHERE m.group_id = g.id) AS "memberCount"
       FROM user_groups g
       WHERE g.deleted_at IS NULL
       ORDER BY g.name`
    );
    res.json(rows);
  } catch (err) {
    console.error('Groups list error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/groups — создать группу
router.post('/', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const userId = req.user!.userId;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Название группы обязательно' });
      return;
    }

    const trimmed = name.trim();
    // Проверка уникальности (case-insensitive) среди активных групп
    const { rows: existing } = await query(
      `SELECT id FROM user_groups WHERE lower(name) = lower($1) AND deleted_at IS NULL`,
      [trimmed]
    );
    if (existing.length > 0) {
      res.status(400).json({ error: 'Группа с таким названием уже существует' });
      return;
    }

    const { rows } = await query(
      `INSERT INTO user_groups (name, created_by) VALUES ($1, $2)
       RETURNING id, name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [trimmed, userId]
    );
    res.status(201).json({ ...rows[0], memberCount: 0 });
  } catch (err) {
    console.error('Group create error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/groups/:id — переименовать группу
router.put('/:id', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const { name } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Название группы обязательно' });
      return;
    }

    const trimmed = name.trim();
    const { rows: existing } = await query(
      `SELECT id FROM user_groups WHERE lower(name) = lower($1) AND deleted_at IS NULL AND id != $2`,
      [trimmed, groupId]
    );
    if (existing.length > 0) {
      res.status(400).json({ error: 'Группа с таким названием уже существует' });
      return;
    }

    const { rows } = await query(
      `UPDATE user_groups SET name = $1
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, name, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [trimmed, groupId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Группа не найдена' });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Group update error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// DELETE /api/groups/:id — мягкое удаление
router.delete('/:id', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;

    const { rows } = await query(
      `UPDATE user_groups SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [groupId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Группа не найдена' });
      return;
    }

    res.json({ message: 'Группа удалена' });
  } catch (err) {
    console.error('Group delete error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/groups/:id/members — список участников группы
router.get('/:id/members', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;

    const { rows } = await query(
      `SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName",
              u.login, u.role
       FROM user_group_members m
       JOIN users u ON u.id = m.user_id
       WHERE m.group_id = $1 AND u.deleted_at IS NULL
       ORDER BY u.last_name, u.first_name`,
      [groupId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Group members error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/groups/:id/members — заменить набор участников группы (массив userIds)
router.put('/:id/members', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const { userIds } = req.body;
    const addedBy = req.user!.userId;

    if (!Array.isArray(userIds)) {
      res.status(400).json({ error: 'userIds должен быть массивом' });
      return;
    }

    // Убедимся, что группа существует
    const { rows: groupRows } = await query(
      `SELECT id FROM user_groups WHERE id = $1 AND deleted_at IS NULL`,
      [groupId]
    );
    if (groupRows.length === 0) {
      res.status(404).json({ error: 'Группа не найдена' });
      return;
    }

    // Транзакция: удалить всех, добавить новых
    await query('BEGIN');
    try {
      await query(`DELETE FROM user_group_members WHERE group_id = $1`, [groupId]);
      for (const uid of userIds) {
        await query(
          `INSERT INTO user_group_members (group_id, user_id, added_by)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [groupId, uid, addedBy]
        );
      }
      await query('COMMIT');
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }

    // Открыть дефолтные вкладки и членство в чатах для всех текущих участников.
    // Удалённым из группы доступ сохраняется — админ может закрыть вручную.
    for (const uid of userIds) {
      await applyGroupTabDefaults(uid, addedBy);
    }

    res.json({ message: 'Участники обновлены', count: userIds.length });
  } catch (err) {
    console.error('Group set members error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
