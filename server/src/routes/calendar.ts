import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authJWT } from '../middleware/auth';
import { roleCheck } from '../middleware/roleCheck';
import { AuthRequest } from '../types';

const router = Router();
const ADMIN_ROLES = roleCheck(['superadmin', 'admin', 'mentor']);

// GET /api/calendar/events?from=ISO&to=ISO
// from/to опциональны; по умолчанию — все актуальные события (start_at >= now - 30 дней)
router.get('/events', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const conditions: string[] = ['deleted_at IS NULL'];
    const params: any[] = [];
    let idx = 1;

    if (from) {
      conditions.push(`start_at >= $${idx++}`);
      params.push(from);
    } else {
      conditions.push(`start_at >= NOW() - interval '30 days'`);
    }
    if (to) {
      conditions.push(`start_at <= $${idx++}`);
      params.push(to);
    }

    const { rows } = await query(
      `SELECT id, title, description, link,
              start_at AS "startAt",
              created_by AS "createdBy",
              created_at AS "createdAt"
       FROM calendar_events
       WHERE ${conditions.join(' AND ')}
       ORDER BY start_at ASC`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error('Calendar list error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/calendar/events — создание (admin/mentor/superadmin)
router.post('/events', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, link, startAt } = req.body;
    const userId = req.user!.userId;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Название обязательно' });
      return;
    }
    if (!startAt) {
      res.status(400).json({ error: 'Дата и время обязательны' });
      return;
    }

    const startDate = new Date(startAt);
    if (isNaN(startDate.getTime())) {
      res.status(400).json({ error: 'Некорректная дата' });
      return;
    }

    const cleanLink = (link || '').trim() || null;
    const cleanDesc = (description || '').trim() || null;

    const { rows } = await query(
      `INSERT INTO calendar_events (title, description, link, start_at, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, link,
                 start_at AS "startAt",
                 created_by AS "createdBy",
                 created_at AS "createdAt"`,
      [title.trim(), cleanDesc, cleanLink, startDate.toISOString(), userId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Calendar create error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/calendar/events/:id — редактирование (admin/mentor/superadmin)
router.put('/events/:id', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id as string;
    const { title, description, link, startAt } = req.body;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (title !== undefined) {
      if (!title.trim()) {
        res.status(400).json({ error: 'Название не может быть пустым' });
        return;
      }
      fields.push(`title = $${idx++}`);
      values.push(title.trim());
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push((description || '').trim() || null);
    }
    if (link !== undefined) {
      fields.push(`link = $${idx++}`);
      values.push((link || '').trim() || null);
    }
    if (startAt !== undefined) {
      const startDate = new Date(startAt);
      if (isNaN(startDate.getTime())) {
        res.status(400).json({ error: 'Некорректная дата' });
        return;
      }
      fields.push(`start_at = $${idx++}`);
      values.push(startDate.toISOString());
      // Сброс флагов отправленных уведомлений — новая дата требует новых напоминаний
      fields.push(`notified_1h_at = NULL`);
      fields.push(`notified_5min_at = NULL`);
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'Нет полей для обновления' });
      return;
    }

    values.push(eventId);
    const { rows } = await query(
      `UPDATE calendar_events SET ${fields.join(', ')}
       WHERE id = $${idx} AND deleted_at IS NULL
       RETURNING id, title, description, link,
                 start_at AS "startAt",
                 created_by AS "createdBy",
                 created_at AS "createdAt"`,
      values
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Событие не найдено' });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Calendar update error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// DELETE /api/calendar/events/:id — мягкое удаление (admin/mentor/superadmin)
router.delete('/events/:id', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id as string;

    const { rows } = await query(
      `UPDATE calendar_events SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [eventId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Событие не найдено' });
      return;
    }

    res.json({ message: 'Событие удалено' });
  } catch (err) {
    console.error('Calendar delete error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
