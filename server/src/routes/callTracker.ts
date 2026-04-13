import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authJWT } from '../middleware/auth';
import { roleCheck } from '../middleware/roleCheck';
import { AuthRequest } from '../types';

const router = Router();
const ADMIN_ROLES = roleCheck(['superadmin', 'admin', 'mentor']);

// GET /api/call-tracker?user_id=
router.get('/', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, role } = req.user!;
    let targetUserId = req.query.user_id as string || userId;

    if (role === 'user' && targetUserId !== userId) {
      res.status(403).json({ error: 'Нет доступа к трекеру другого пользователя' });
      return;
    }

    const { rows } = await query(
      `SELECT ct.id, ct.user_id AS "userId", ct.call_date AS "callDate",
              ct.summary, ct.created_at AS "createdAt", ct.updated_at AS "updatedAt",
              u.first_name || ' ' || u.last_name AS "authorName"
       FROM call_tracker ct
       JOIN users u ON u.id = ct.author_id
       WHERE ct.user_id = $1 AND ct.deleted_at IS NULL
       ORDER BY ct.call_date DESC, ct.created_at DESC`,
      [targetUserId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Call tracker get error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/call-tracker
router.post('/', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.user!;
    const { targetUserId, callDate, summary } = req.body;

    if (!targetUserId || !callDate) {
      res.status(400).json({ error: 'targetUserId и callDate обязательны' });
      return;
    }

    const { rows } = await query(
      `INSERT INTO call_tracker (user_id, author_id, call_date, summary)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id AS "userId", call_date AS "callDate", summary,
                 created_at AS "createdAt"`,
      [targetUserId, userId, callDate, summary || '']
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Call tracker create error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/call-tracker/:id
router.put('/:id', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const { callDate, summary } = req.body;
    const entryId = req.params.id as string;

    const { rows: existing } = await query(
      'SELECT id FROM call_tracker WHERE id = $1 AND deleted_at IS NULL',
      [entryId]
    );
    if (existing.length === 0) {
      res.status(404).json({ error: 'Запись не найдена' });
      return;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (callDate !== undefined) { fields.push(`call_date = $${idx++}`); values.push(callDate); }
    if (summary !== undefined) { fields.push(`summary = $${idx++}`); values.push(summary); }

    if (fields.length === 0) {
      res.status(400).json({ error: 'Нет полей для обновления' });
      return;
    }

    values.push(entryId);
    const { rows } = await query(
      `UPDATE call_tracker SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, call_date AS "callDate", summary, updated_at AS "updatedAt"`,
      values
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Call tracker update error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// DELETE /api/call-tracker/:id
router.delete('/:id', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await query(
      `UPDATE call_tracker SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [req.params.id as string]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Запись не найдена' });
      return;
    }

    res.json({ message: 'Запись удалена' });
  } catch (err) {
    console.error('Call tracker delete error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
