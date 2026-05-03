import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authJWT } from '../middleware/auth';
import { roleCheck } from '../middleware/roleCheck';
import { AuthRequest } from '../types';

const router = Router();
const ADMIN_ROLES = roleCheck(['superadmin', 'admin', 'mentor']);

type AudienceType = 'all' | 'users' | 'groups';

interface AudienceInput {
  audienceType: AudienceType;
  audienceUserIds?: string[];
  audienceGroupIds?: string[];
}

function isAdminRole(role: string): boolean {
  return role === 'superadmin' || role === 'admin' || role === 'mentor';
}

async function fetchEventAudience(eventId: string): Promise<{
  userIds: string[];
  groupIds: string[];
}> {
  const [users, groups] = await Promise.all([
    query(`SELECT user_id FROM calendar_event_users WHERE event_id = $1`, [eventId]),
    query(`SELECT group_id FROM calendar_event_groups WHERE event_id = $1`, [eventId]),
  ]);
  return {
    userIds: users.rows.map((r: any) => r.user_id),
    groupIds: groups.rows.map((r: any) => r.group_id),
  };
}

async function setEventAudience(eventId: string, payload: AudienceInput): Promise<void> {
  // Сбрасываем существующее
  await query(`DELETE FROM calendar_event_users WHERE event_id = $1`, [eventId]);
  await query(`DELETE FROM calendar_event_groups WHERE event_id = $1`, [eventId]);

  if (payload.audienceType === 'users' && payload.audienceUserIds?.length) {
    for (const uid of payload.audienceUserIds) {
      await query(
        `INSERT INTO calendar_event_users (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [eventId, uid]
      );
    }
  } else if (payload.audienceType === 'groups' && payload.audienceGroupIds?.length) {
    for (const gid of payload.audienceGroupIds) {
      await query(
        `INSERT INTO calendar_event_groups (event_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [eventId, gid]
      );
    }
  }
}

function validateAudience(payload: AudienceInput): string | null {
  if (!['all', 'users', 'groups'].includes(payload.audienceType)) {
    return 'Некорректный тип аудитории';
  }
  if (payload.audienceType === 'users') {
    if (!Array.isArray(payload.audienceUserIds) || payload.audienceUserIds.length === 0) {
      return 'Выберите хотя бы одного пользователя';
    }
  }
  if (payload.audienceType === 'groups') {
    if (!Array.isArray(payload.audienceGroupIds) || payload.audienceGroupIds.length === 0) {
      return 'Выберите хотя бы одну группу';
    }
  }
  return null;
}

// GET /api/calendar/events?from=ISO&to=ISO
// Видимость:
//  - admin/mentor/superadmin → все события
//  - user → события с audience_type='all', либо где он указан напрямую,
//           либо где он в одной из активных групп события
router.get('/events', authJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const conditions: string[] = ['e.deleted_at IS NULL'];
    const params: any[] = [];
    let idx = 1;

    if (from) {
      conditions.push(`e.start_at >= $${idx++}`);
      params.push(from);
    } else {
      conditions.push(`e.start_at >= NOW() - interval '30 days'`);
    }
    if (to) {
      conditions.push(`e.start_at <= $${idx++}`);
      params.push(to);
    }

    if (!isAdminRole(role)) {
      // Фильтр по audience для обычного пользователя
      const userParam = `$${idx++}`;
      params.push(userId);
      conditions.push(`(
        e.audience_type = 'all'
        OR (e.audience_type = 'users' AND EXISTS (
          SELECT 1 FROM calendar_event_users cu
          WHERE cu.event_id = e.id AND cu.user_id = ${userParam}
        ))
        OR (e.audience_type = 'groups' AND EXISTS (
          SELECT 1 FROM calendar_event_groups cg
          JOIN user_groups g ON g.id = cg.group_id AND g.deleted_at IS NULL
          JOIN user_group_members m ON m.group_id = g.id AND m.user_id = ${userParam}
          WHERE cg.event_id = e.id
        ))
      )`);
    }

    const { rows } = await query(
      `SELECT e.id, e.title, e.description, e.link,
              e.start_at AS "startAt",
              e.audience_type AS "audienceType",
              e.created_by AS "createdBy",
              e.created_at AS "createdAt"
       FROM calendar_events e
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.start_at ASC`,
      params
    );

    // Подтянем audience для админов (для отображения в редакторе)
    if (isAdminRole(role) && rows.length > 0) {
      const ids = rows.map((r: any) => r.id);
      const [usersRes, groupsRes] = await Promise.all([
        query(
          `SELECT event_id, user_id FROM calendar_event_users WHERE event_id = ANY($1::uuid[])`,
          [ids]
        ),
        query(
          `SELECT event_id, group_id FROM calendar_event_groups WHERE event_id = ANY($1::uuid[])`,
          [ids]
        ),
      ]);
      const usersByEvent: Record<string, string[]> = {};
      const groupsByEvent: Record<string, string[]> = {};
      for (const r of usersRes.rows as any[]) {
        (usersByEvent[r.event_id] ||= []).push(r.user_id);
      }
      for (const r of groupsRes.rows as any[]) {
        (groupsByEvent[r.event_id] ||= []).push(r.group_id);
      }
      for (const ev of rows as any[]) {
        ev.audienceUserIds = usersByEvent[ev.id] || [];
        ev.audienceGroupIds = groupsByEvent[ev.id] || [];
      }
    }

    res.json(rows);
  } catch (err) {
    console.error('Calendar list error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/calendar/events
router.post('/events', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, link, startAt } = req.body;
    const userId = req.user!.userId;

    const audience: AudienceInput = {
      audienceType: req.body.audienceType || 'all',
      audienceUserIds: req.body.audienceUserIds,
      audienceGroupIds: req.body.audienceGroupIds,
    };

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

    const audErr = validateAudience(audience);
    if (audErr) {
      res.status(400).json({ error: audErr });
      return;
    }

    const cleanLink = (link || '').trim() || null;
    const cleanDesc = (description || '').trim() || null;

    await query('BEGIN');
    try {
      const { rows } = await query(
        `INSERT INTO calendar_events (title, description, link, start_at, created_by, audience_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title, description, link,
                   start_at AS "startAt",
                   audience_type AS "audienceType",
                   created_by AS "createdBy",
                   created_at AS "createdAt"`,
        [title.trim(), cleanDesc, cleanLink, startDate.toISOString(), userId, audience.audienceType]
      );

      await setEventAudience(rows[0].id, audience);
      await query('COMMIT');

      const aud = await fetchEventAudience(rows[0].id);
      res.status(201).json({
        ...rows[0],
        audienceUserIds: aud.userIds,
        audienceGroupIds: aud.groupIds,
      });
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Calendar create error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// PUT /api/calendar/events/:id
router.put('/events/:id', authJWT, ADMIN_ROLES, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id as string;
    const { title, description, link, startAt } = req.body;
    const audienceProvided = req.body.audienceType !== undefined;

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
      fields.push(`notified_1h_at = NULL`);
      fields.push(`notified_5min_at = NULL`);
    }

    if (audienceProvided) {
      const audience: AudienceInput = {
        audienceType: req.body.audienceType,
        audienceUserIds: req.body.audienceUserIds,
        audienceGroupIds: req.body.audienceGroupIds,
      };
      const audErr = validateAudience(audience);
      if (audErr) {
        res.status(400).json({ error: audErr });
        return;
      }
      fields.push(`audience_type = $${idx++}`);
      values.push(audience.audienceType);
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'Нет полей для обновления' });
      return;
    }

    await query('BEGIN');
    try {
      values.push(eventId);
      const { rows } = await query(
        `UPDATE calendar_events SET ${fields.join(', ')}
         WHERE id = $${idx} AND deleted_at IS NULL
         RETURNING id, title, description, link,
                   start_at AS "startAt",
                   audience_type AS "audienceType",
                   created_by AS "createdBy",
                   created_at AS "createdAt"`,
        values
      );

      if (rows.length === 0) {
        await query('ROLLBACK');
        res.status(404).json({ error: 'Событие не найдено' });
        return;
      }

      if (audienceProvided) {
        await setEventAudience(eventId, {
          audienceType: req.body.audienceType,
          audienceUserIds: req.body.audienceUserIds,
          audienceGroupIds: req.body.audienceGroupIds,
        });
      }

      await query('COMMIT');

      const aud = await fetchEventAudience(eventId);
      res.json({
        ...rows[0],
        audienceUserIds: aud.userIds,
        audienceGroupIds: aud.groupIds,
      });
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Calendar update error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// DELETE /api/calendar/events/:id
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
