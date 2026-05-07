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

// ========================
// GET /api/groups/:id/tabs
// Список всех вкладок с признаком hasAccess (входит ли в дефолты группы)
// ========================
router.get('/:id/tabs', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;

    const { rows: groupRows } = await query(
      `SELECT id FROM user_groups WHERE id = $1 AND deleted_at IS NULL`,
      [groupId]
    );
    if (groupRows.length === 0) {
      res.status(404).json({ error: 'Группа не найдена' });
      return;
    }

    const { rows } = await query(
      `SELECT t.id, t.slug, t.name, t.sort_order AS "sortOrder",
              EXISTS(
                SELECT 1 FROM user_group_tab_defaults d
                 WHERE d.group_id = $1 AND d.tab_id = t.id
              ) AS "hasAccess"
         FROM tabs t
        ORDER BY t.sort_order`,
      [groupId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Group tabs error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ========================
// PUT /api/groups/:id/tabs
// Заменяет дефолтные вкладки группы и массово синхронизирует доступ всех её участников.
// Логика снятия: если пользователь после изменения уже не получает вкладку
// ни через одну из своих групп — доступ закрывается. Ручные оверрайды вкладок,
// не входивших в эту группу, не трогаем.
// ========================
router.put('/:id/tabs', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const { tabIds } = req.body;
    const grantedBy = req.user!.userId;

    if (!Array.isArray(tabIds) || tabIds.some((x) => !Number.isInteger(x))) {
      res.status(400).json({ error: 'tabIds должен быть массивом целых чисел' });
      return;
    }

    const { rows: groupRows } = await query(
      `SELECT id FROM user_groups WHERE id = $1 AND deleted_at IS NULL`,
      [groupId]
    );
    if (groupRows.length === 0) {
      res.status(404).json({ error: 'Группа не найдена' });
      return;
    }

    await query('BEGIN');
    try {
      // 1. Старые дефолты, которые больше не нужны (для аккуратного снятия)
      const { rows: removedRows } = await query(
        `SELECT tab_id FROM user_group_tab_defaults
          WHERE group_id = $1 AND tab_id <> ALL($2::int[])`,
        [groupId, tabIds]
      );
      const removedTabIds: number[] = removedRows.map((r: any) => r.tab_id);

      // 2. Полная замена дефолтов группы
      await query(`DELETE FROM user_group_tab_defaults WHERE group_id = $1`, [groupId]);
      for (const tabId of tabIds) {
        await query(
          `INSERT INTO user_group_tab_defaults (group_id, tab_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [groupId, tabId]
        );
      }

      // 3. Открыть выбранные вкладки всем текущим участникам
      if (tabIds.length > 0) {
        await query(
          `INSERT INTO user_tab_access (user_id, tab_id, granted_by)
           SELECT m.user_id, ut.tab_id, $2
             FROM user_group_members m
             CROSS JOIN UNNEST($3::int[]) AS ut(tab_id)
            WHERE m.group_id = $1
           ON CONFLICT DO NOTHING`,
          [groupId, grantedBy, tabIds]
        );

        // 3a. Синхронизировать членство в general-чатах для добавленных вкладок
        await query(
          `INSERT INTO chat_room_members (chat_room_id, user_id)
           SELECT cr.id, m.user_id
             FROM user_group_members m
             CROSS JOIN UNNEST($2::int[]) AS ut(tab_id)
             JOIN tabs t ON t.id = ut.tab_id
             JOIN chat_rooms cr ON cr.tab_slug = t.slug AND cr.type = 'general'
            WHERE m.group_id = $1
           ON CONFLICT DO NOTHING`,
          [groupId, tabIds]
        );
      }

      // 4. Снять доступ к вкладкам, которые группа больше не предоставляет —
      //    но только если ни одна другая группа пользователя их тоже не предоставляет
      if (removedTabIds.length > 0) {
        await query(
          `DELETE FROM user_tab_access uta
            USING user_group_members mm
            WHERE uta.user_id = mm.user_id
              AND mm.group_id = $1
              AND uta.tab_id = ANY($2::int[])
              AND NOT EXISTS (
                SELECT 1
                  FROM user_group_members m2
                  JOIN user_group_tab_defaults d2 ON d2.group_id = m2.group_id
                  JOIN user_groups g2 ON g2.id = m2.group_id AND g2.deleted_at IS NULL
                 WHERE m2.user_id = uta.user_id
                   AND d2.tab_id = uta.tab_id
                   AND m2.group_id <> $1
              )`,
          [groupId, removedTabIds]
        );

        // 4a. Снять членство в general-чатах для снятых вкладок (только role='user',
        //     чтобы не задеть admin/mentor, у которых membership ставится глобально)
        await query(
          `DELETE FROM chat_room_members crm
            USING users u, user_group_members mm,
                  chat_rooms cr, tabs t
            WHERE crm.user_id = u.id
              AND u.role = 'user'
              AND crm.user_id = mm.user_id
              AND mm.group_id = $1
              AND crm.chat_room_id = cr.id
              AND cr.type = 'general'
              AND cr.tab_slug = t.slug
              AND t.id = ANY($2::int[])
              AND NOT EXISTS (
                SELECT 1
                  FROM user_group_members m2
                  JOIN user_group_tab_defaults d2 ON d2.group_id = m2.group_id
                  JOIN user_groups g2 ON g2.id = m2.group_id AND g2.deleted_at IS NULL
                 WHERE m2.user_id = crm.user_id
                   AND d2.tab_id = t.id
                   AND m2.group_id <> $1
              )`,
          [groupId, removedTabIds]
        );
      }

      await query('COMMIT');
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }

    res.json({ message: 'Доступ группы обновлён', tabIds });
  } catch (err) {
    console.error('Group tabs update error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
