import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authJWT } from '../middleware/auth';
import { roleCheck } from '../middleware/roleCheck';
import { AuthRequest } from '../types';

const router = Router();
const ADMIN_ROLES = roleCheck(['superadmin', 'admin', 'mentor']);

// ========================
// GET /api/dtp?user_id=&year=&month=
// Записи ДТП за месяц
// ========================
router.get('/', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { role, userId } = req.user!;
    let targetUserId = req.query.user_id as string || userId;
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month as string, 10) || (new Date().getMonth() + 1);

    // Обычный пользователь видит только свои
    if (role === 'user' && targetUserId !== userId) {
      res.status(403).json({ error: 'Нет доступа к ДТП другого пользователя' });
      return;
    }

    const { rows } = await query(
      `SELECT id, user_id AS "userId", year, month, week,
              day_index AS "dayIndex", entry_date AS "entryDate",
              achievements, difficulties, suggestions,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM dtp_entries
       WHERE user_id = $1 AND year = $2 AND month = $3
       ORDER BY week, day_index`,
      [targetUserId, year, month]
    );

    res.json(rows);
  } catch (err) {
    console.error('DTP get error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ========================
// POST /api/dtp
// Создать или обновить запись (upsert)
// ========================
router.post('/', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.user!;
    const { year, month, week, dayIndex, entryDate, achievements, difficulties, suggestions } = req.body;

    if (!year || !month || !week || !dayIndex || !entryDate) {
      res.status(400).json({ error: 'year, month, week, dayIndex, entryDate обязательны' });
      return;
    }

    const { rows } = await query(
      `INSERT INTO dtp_entries (user_id, year, month, week, day_index, entry_date, achievements, difficulties, suggestions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, year, month, week, day_index) DO UPDATE SET
         achievements = EXCLUDED.achievements,
         difficulties = EXCLUDED.difficulties,
         suggestions = EXCLUDED.suggestions,
         entry_date = EXCLUDED.entry_date
       RETURNING id, year, month, week, day_index AS "dayIndex", entry_date AS "entryDate",
                 achievements, difficulties, suggestions,
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [userId, year, month, week, dayIndex, entryDate,
       achievements || '', difficulties || '', suggestions || '']
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('DTP create error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ========================
// PUT /api/dtp/:id
// Обновить запись + audit log
// ========================
router.put('/:id', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const entryId = req.params.id as string;
    const { userId } = req.user!;
    const { achievements, difficulties, suggestions } = req.body;

    // Получить текущие значения
    const { rows: existing } = await query(
      'SELECT * FROM dtp_entries WHERE id = $1',
      [entryId]
    );

    if (existing.length === 0) {
      res.status(404).json({ error: 'Запись не найдена' });
      return;
    }

    const entry = existing[0];

    // Проверка: обычный пользователь может редактировать только свои
    if (req.user!.role === 'user' && entry.user_id !== userId) {
      res.status(403).json({ error: 'Нет прав на редактирование' });
      return;
    }

    // Audit log для каждого изменённого поля
    const fields: { name: string; old: string; new: string }[] = [];
    if (achievements !== undefined && achievements !== entry.achievements) {
      fields.push({ name: 'achievements', old: entry.achievements, new: achievements });
    }
    if (difficulties !== undefined && difficulties !== entry.difficulties) {
      fields.push({ name: 'difficulties', old: entry.difficulties, new: difficulties });
    }
    if (suggestions !== undefined && suggestions !== entry.suggestions) {
      fields.push({ name: 'suggestions', old: entry.suggestions, new: suggestions });
    }

    if (fields.length === 0) {
      res.json({ message: 'Нет изменений' });
      return;
    }

    // Записать в audit log
    for (const f of fields) {
      await query(
        `INSERT INTO dtp_audit_log (dtp_entry_id, user_id, field_changed, old_value, new_value)
         VALUES ($1, $2, $3, $4, $5)`,
        [entryId, userId, f.name, f.old, f.new]
      );
    }

    // Обновить запись
    const { rows } = await query(
      `UPDATE dtp_entries SET
         achievements = COALESCE($1, achievements),
         difficulties = COALESCE($2, difficulties),
         suggestions = COALESCE($3, suggestions)
       WHERE id = $4
       RETURNING id, achievements, difficulties, suggestions, updated_at AS "updatedAt"`,
      [achievements ?? entry.achievements, difficulties ?? entry.difficulties,
       suggestions ?? entry.suggestions, entryId]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('DTP update error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ========================
// GET /api/dtp/:id/audit
// История изменений конкретной записи
// ========================
router.get('/:id/audit', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await query(
      `SELECT al.id, al.field_changed AS "fieldChanged",
              al.old_value AS "oldValue", al.new_value AS "newValue",
              al.changed_at AS "changedAt",
              u.first_name || ' ' || u.last_name AS "changedBy"
       FROM dtp_audit_log al
       JOIN users u ON u.id = al.user_id
       WHERE al.dtp_entry_id = $1
       ORDER BY al.changed_at DESC`,
      [req.params.id as string]
    );

    res.json(rows);
  } catch (err) {
    console.error('DTP audit error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ========================
// GET /api/dtp/audit?user_id=&year=&month=
// Полный audit log по пользователю за месяц
// ========================
router.get('/audit', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.query.user_id as string;
    const year = parseInt(req.query.year as string, 10);
    const month = parseInt(req.query.month as string, 10);

    if (!targetUserId || !year || !month) {
      res.status(400).json({ error: 'user_id, year, month обязательны' });
      return;
    }

    const { rows } = await query(
      `SELECT al.id, al.dtp_entry_id AS "entryId",
              al.field_changed AS "fieldChanged",
              al.old_value AS "oldValue", al.new_value AS "newValue",
              al.changed_at AS "changedAt",
              u.first_name || ' ' || u.last_name AS "changedBy",
              de.week, de.day_index AS "dayIndex", de.entry_date AS "entryDate"
       FROM dtp_audit_log al
       JOIN users u ON u.id = al.user_id
       JOIN dtp_entries de ON de.id = al.dtp_entry_id
       WHERE de.user_id = $1 AND de.year = $2 AND de.month = $3
       ORDER BY al.changed_at DESC`,
      [targetUserId, year, month]
    );

    res.json(rows);
  } catch (err) {
    console.error('DTP audit full error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
